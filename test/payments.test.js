// Self-check for the PeptidePay integration. Runs against a local mock of PeptidePay's API,
// so no real money moves. Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

process.env.PEPTIDEPAY_API_BASE = "http://127.0.0.1:47391";
const SECRET = "whsec_test_" + crypto.randomBytes(8).toString("hex");
const calls = [];
let sessionStatus = {}; // id -> status returned by GET /sessions/:id
const mock = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    calls.push({ method: req.method, url: req.url, headers: req.headers, body: body ? JSON.parse(body) : null });
    if (req.method === "POST" && req.url === "/api/v1/checkout/init") {
      const id = "cs_" + crypto.randomBytes(6).toString("hex");
      const b = JSON.parse(body);
      sessionStatus[id] = { id, status: "pending", amount: b.amount_cents, currency: b.currency };
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ id, url: `https://peptide-pay.com/session/${id}`, status: "pending", amount: b.amount_cents, currency: b.currency }));
    }
    const m = /^\/api\/v1\/sessions\/(.+)$/.exec(req.url);
    if (req.method === "GET" && m && sessionStatus[m[1]]) {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(sessionStatus[m[1]]));
    }
    res.writeHead(404).end("{}");
  });
});

let base, app, server;
test.before(async () => {
  await new Promise((r) => mock.listen(47391, "127.0.0.1", r));
  process.env.PEPTIDEPAY_WALLET = "0x" + "ab".repeat(20);
  process.env.PEPTIDEPAY_WEBHOOK_SECRET = SECRET;
  process.env.CHECKOUT_ENABLED = "true";
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lbstore-"));
  process.env.SITE_URL = "https://shop.example.com";
  app = require("../server.js");
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); mock.close(); });

const { verifyPeptidePaySignature } = require("../lib/peptidepay");
const sign = (raw, t = Math.floor(Date.now() / 1000), secret = SECRET) =>
  `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex")}`;

const post = (p, body, headers = {}) =>
  fetch(base + p, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

test("verifyPeptidePaySignature: valid, tampered, wrong secret, stale, malformed", () => {
  const raw = '{"event":"order.paid","amount":5000}';
  assert.equal(verifyPeptidePaySignature(raw, sign(raw), { secret: SECRET }), true);
  assert.equal(verifyPeptidePaySignature(raw.replace("5000", "5001"), sign(raw), { secret: SECRET }), false);
  assert.equal(verifyPeptidePaySignature(raw, sign(raw, undefined, "whsec_other"), { secret: SECRET }), false);
  assert.equal(verifyPeptidePaySignature(raw, sign(raw, Math.floor(Date.now() / 1000) - 301), { secret: SECRET }), false);
  assert.equal(verifyPeptidePaySignature(raw, "t=abc,v1=zz", { secret: SECRET }), false);
  assert.equal(verifyPeptidePaySignature(raw, "", { secret: SECRET }), false);
});

let order;
test("checkout prices server-side and ignores client totals", async () => {
  const r = await post("/api/checkout", {
    items: [{ sku: "SS31-10", quantity: 3, price: 1 }, { sku: "KPV-10", quantity: 1 }],
    total: 1, amount_cents: 1, email: "Buyer@Example.com", fulfillment: "pickup", attest: true,
  });
  const d = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  assert.match(d.url, /^https:\/\/peptide-pay\.com\/session\/cs_/);
  const init = calls.filter((c) => c.url === "/api/v1/checkout/init").at(-1);
  // SS-31 $90 x3 at 5% off = 3 x 8550 = 25650; KPV $39.99 = 3999; pickup free
  assert.equal(init.body.amount_cents, 25650 + 3999);
  assert.equal(init.body.currency, "USD");
  assert.equal(init.body.wallet, process.env.PEPTIDEPAY_WALLET, "wallet-only mode sends wallet");
  assert.equal(init.headers.authorization, undefined, "no Authorization header in wallet-only mode");
  assert.ok(init.headers["idempotency-key"], "Idempotency-Key header sent");
  assert.equal(init.body.metadata.order_id, d.order_id);
  assert.equal(init.body.success_url, `https://shop.example.com/order/${d.order_id}`);
  order = { id: d.order_id, session: init.headers && calls.length, amount: init.body.amount_cents };
  const st = await (await fetch(`${base}/api/order/${d.order_id}`)).json();
  assert.equal(st.status, "pending");
  order.sessionId = Object.keys(sessionStatus).at(-1);
});

test("Authorization mode omits wallet from body", async () => {
  process.env.PEPTIDEPAY_API_KEY = "sk_live_" + "x".repeat(24);
  try {
    const r = await post("/api/checkout", { product_slug: "kpv-10mg", quantity: 1, email: "a@b.co", fulfillment: "pickup", attest: true });
    assert.equal(r.status, 200);
    const init = calls.filter((c) => c.url === "/api/v1/checkout/init").at(-1);
    assert.equal(init.headers.authorization, `Bearer ${process.env.PEPTIDEPAY_API_KEY}`);
    assert.equal("wallet" in init.body, false);
  } finally { delete process.env.PEPTIDEPAY_API_KEY; }
});

test("sk_test_ key is ignored (falls back to wallet)", async () => {
  process.env.PEPTIDEPAY_API_KEY = "sk_test_abc";
  try {
    await post("/api/checkout", { product_slug: "kpv-10mg", quantity: 1, email: "a@b.co", fulfillment: "pickup", attest: true });
    const init = calls.filter((c) => c.url === "/api/v1/checkout/init").at(-1);
    assert.equal(init.headers.authorization, undefined);
    assert.ok(init.body.wallet);
  } finally { delete process.env.PEPTIDEPAY_API_KEY; }
});

test("checkout rejects unknown SKUs, missing attestation and bad quantities", async () => {
  assert.equal((await post("/api/checkout", { items: [{ sku: "NOPE", quantity: 1 }], email: "a@b.co", attest: true })).status, 400);
  assert.equal((await post("/api/checkout", { items: [{ sku: "KPV-10", quantity: 1 }], email: "a@b.co" })).status, 400);
  assert.equal((await post("/api/checkout", { items: [{ sku: "KPV-10", quantity: -2 }], email: "a@b.co", attest: true })).status, 400);
});

const evt = (o) => JSON.stringify({ event: "order.paid", session_id: o.sessionId, order_id: o.id, address_in: "0x" + "cd".repeat(20), status: "paid", amount: o.amount, currency: "USD", txid: "0xfeed", paid_at: new Date().toISOString(), attempt: 1 });

test("webhook: tampered signature -> 401, order stays pending", async () => {
  const raw = evt(order);
  const r = await post("/api/peptidepay-webhook", raw.replace('"attempt":1', '"attempt":2'), { "x-peptidepay-signature": sign(raw) });
  assert.equal(r.status, 401);
  assert.equal((await (await fetch(`${base}/api/order/${order.id}`)).json()).status, "pending");
});

test("webhook: stale timestamp -> 401", async () => {
  const raw = evt(order);
  const r = await post("/api/peptidepay-webhook", raw, { "x-peptidepay-signature": sign(raw, Math.floor(Date.now() / 1000) - 600) });
  assert.equal(r.status, 401);
});

test("webhook: unsigned event is not trusted unless PeptidePay API confirms it", async () => {
  const r = await post("/api/peptidepay-webhook", evt(order)); // session still 'pending' on the mock
  assert.equal(r.status, 401);
  assert.equal((await (await fetch(`${base}/api/order/${order.id}`)).json()).status, "pending");
});

test("webhook: underpaid amount is rejected", async () => {
  const raw = evt({ ...order, amount: order.amount - 1 });
  const r = await post("/api/peptidepay-webhook", raw, { "x-peptidepay-signature": sign(raw) });
  assert.equal(r.status, 422);
});

test("webhook: valid signature marks paid; replay is idempotent", async () => {
  const raw = evt(order);
  const r1 = await post("/api/peptidepay-webhook", raw, { "x-peptidepay-signature": sign(raw) });
  assert.equal(r1.status, 200);
  assert.deepEqual(await r1.json(), { ok: true, duplicate: false });
  const st = await (await fetch(`${base}/api/order/${order.id}`)).json();
  assert.deepEqual(st, { status: "paid", amount: order.amount, currency: "USD" });

  const { db } = require("../lib/db");
  const jobs1 = db.prepare("SELECT COUNT(*) n FROM jobs").get().n;
  const ref1 = db.prepare("SELECT referral_code FROM orders WHERE id=?").get(order.id).referral_code;
  const r2 = await post("/api/peptidepay-webhook", raw, { "x-peptidepay-signature": sign(raw) });
  assert.equal(r2.status, 200);
  assert.equal((await r2.json()).duplicate, true);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM jobs").get().n, jobs1, "no second fulfillment job");
  assert.equal(db.prepare("SELECT referral_code FROM orders WHERE id=?").get(order.id).referral_code, ref1);
});

test("order polling falls back to GET /sessions/{id} when no webhook arrives", async () => {
  const r = await post("/api/checkout", { items: [{ sku: "SELANK-10", quantity: 1 }], email: "c@d.co", fulfillment: "ship", attest: true, address: { line1: "1 Main", city: "Long Beach", state: "CA", zip: "90802" } });
  const d = await r.json();
  const sid = Object.keys(sessionStatus).at(-1);
  assert.equal(calls.at(-1).body.amount_cents, 2995 + 1500, "shipping added under free threshold");
  sessionStatus[sid] = { ...sessionStatus[sid], status: "paid", txid: "0xbeef" };
  const st = await (await fetch(`${base}/api/order/${d.order_id}`)).json();
  assert.equal(st.status, "paid");
});

test("no card input fields anywhere in the site", async () => {
  for (const p of ["/", "/shop", "/cart", "/product/retatrutide-20mg", `/order/${order.id}`]) {
    const h = await (await fetch(base + p)).text();
    assert.doesNotMatch(h, /name="(card|cc|cvc|cvv|card_?number|exp(iry)?)/i, p);
    assert.doesNotMatch(h, /autocomplete="cc-/i, p);
  }
  const js = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");
  assert.doesNotMatch(js, /PEPTIDEPAY_|sk_live|whsec/);
});

test("Lab Box: 4 picks at 40% off, free delivery, renewal after payment", async () => {
  const box = ["RETA-20", "KLOW-80", "SELANK-10", "SELANK-10"];
  assert.equal((await post("/api/checkout", { box: box.slice(0, 3), email: "box@lab.co", fulfillment: "ship", attest: true, box_terms: true, address: { line1: "1 A", city: "LB", zip: "90802" } })).status, 400);
  assert.equal((await post("/api/checkout", { box: ["RETA-10", ...box.slice(1)], email: "box@lab.co", fulfillment: "pickup", attest: true, box_terms: true })).status, 400, "out-of-stock size rejected");
  assert.equal((await post("/api/checkout", { box, email: "box@lab.co", fulfillment: "pickup", attest: true })).status, 400, "box terms required");
  const r = await post("/api/checkout", { box, email: "box@lab.co", fulfillment: "ship", attest: true, box_terms: true, address: { line1: "1 A", city: "LB", zip: "90802" }, total: 1 });
  const d = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  const expected = Math.round(12699 * 0.6) + Math.round(9999 * 0.6) + 2 * Math.round(2995 * 0.6);
  assert.equal(calls.at(-1).body.amount_cents, expected, "40% off list, shipping free");
  const sid = Object.keys(sessionStatus).at(-1);
  sessionStatus[sid] = { ...sessionStatus[sid], status: "paid", txid: "0xb0b" };
  assert.equal((await (await fetch(`${base}/api/order/${d.order_id}`)).json()).status, "paid");
  const orders = require("../lib/orders");
  const { db } = require("../lib/db");
  const boxId = db.prepare("SELECT box_id FROM orders WHERE id=?").get(d.order_id).box_id;
  assert.equal(orders.getBox(boxId).months_paid, 1);
  assert.equal(orders.getBox(boxId).status, "active");
  const renewal = orders.createBoxRenewal(boxId);
  assert.equal(renewal.total_cents, expected);
  assert.equal(orders.createBoxRenewal(boxId).id, renewal.id, "only one open invoice at a time");
});
