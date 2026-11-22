// Self-check for the store with manual payments (card via Stripe link, Zelle, Cash App, Venmo).
// No money moves. Run: npm test
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Local stand-in for ntfy.sh so the phone-alert test sends nothing real.
const http = require("node:http");
const pushes = [];
const ntfy = http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { pushes.push({ url: req.url, body: JSON.parse(b) }); res.end("{}"); }); });

let base, app, server;
test.before(async () => {
  process.env.CHECKOUT_ENABLED = "true";
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "lbstore-"));
  process.env.SITE_URL = "https://shop.example.com";
  process.env.ZELLE_HANDLE = "pay@example.com";
  process.env.ZELLE_NAME = "LB Aminos";
  process.env.CASHAPP_HANDLE = "lbaminos";
  process.env.VENMO_HANDLE = "@lb-aminos";
  process.env.ADMIN_PASSWORD = "test-admin-pw";
  await new Promise((r) => ntfy.listen(0, "127.0.0.1", r));
  process.env.NTFY_SERVER = `http://127.0.0.1:${ntfy.address().port}`;
  process.env.NTFY_TOPIC = "lb-test-topic";
  app = require("../server.js");
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); ntfy.close(); });

const post = (p, body, headers = {}) =>
  fetch(base + p, { method: "POST", headers: { "content-type": "application/json", accept: "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const page = async (p) => (await fetch(base + p)).text();
const adminAuth = { authorization: "Basic " + Buffer.from("ant:test-admin-pw").toString("base64") };
const adminPost = (p, form = "") => fetch(base + p, { method: "POST", redirect: "manual", headers: { ...adminAuth, "content-type": "application/x-www-form-urlencoded" }, body: form });

let order;
test("checkout prices server-side, ignores client totals, and records the payment method", async () => {
  const r = await post("/api/checkout", {
    items: [{ sku: "SS31-10", quantity: 3, price: 1 }, { sku: "KPV-10", quantity: 1 }],
    total: 1, amount_cents: 1, email: "Buyer@Example.com", fulfillment: "pickup", attest: true, pay_method: "zelle",
  });
  const d = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  assert.equal(d.url, `/order/${d.order_id}`);
  const st = await (await fetch(`${base}/api/order/${d.order_id}`)).json();
  // SS-31 $49.99 x3 with BOGO 50% (beats 5% bulk) = 4999+4999+2500; KPV $64.99; pickup free
  assert.equal(st.amount, 4999 * 2 + 2500 + 6499);
  assert.equal(st.status, "pending");
  assert.equal(st.pay_link, null);
  const o = require("../lib/orders").getOrder(d.order_id);
  assert.equal(o.pay_method, "zelle");
  assert.equal(o.email, "buyer@example.com");
  order = o;
});

test("new order sends a phone alert with the details", async () => {
  require("../lib/orders").startWorker()();
  for (let i = 0; i < 50 && !pushes.some((p) => p.body.message.includes(require("../lib/orders").payRef(order))); i++) await new Promise((r) => setTimeout(r, 20));
  const p = pushes.find((x) => x.body.message.includes(require("../lib/orders").payRef(order)));
  assert.ok(p, "alert sent");
  assert.equal(p.body.topic, "lb-test-topic");
  assert.equal(p.body.title, "New order! $189.97 · Zelle");
  assert.match(p.body.message, /SS-31[^\n]*× 3/);
  assert.match(p.body.message, /buyer@example\.com/);
  assert.match(p.body.message, /Local pickup/);
  assert.equal(p.body.click, "https://shop.example.com/admin");
});

test("checkout requires a valid payment method", async () => {
  const base_ = { items: [{ sku: "KPV-10", quantity: 1 }], email: "a@b.co", attest: true };
  assert.equal((await post("/api/checkout", base_)).status, 400);
  assert.equal((await post("/api/checkout", { ...base_, pay_method: "crypto" })).status, 400);
  for (const m of ["card", "zelle", "cashapp", "venmo"]) assert.equal((await post("/api/checkout", { ...base_, pay_method: m })).status, 200, m);
});

test("checkout rejects unknown SKUs, missing attestation and bad quantities", async () => {
  assert.equal((await post("/api/checkout", { items: [{ sku: "NOPE", quantity: 1 }], email: "a@b.co", attest: true, pay_method: "card" })).status, 400);
  assert.equal((await post("/api/checkout", { items: [{ sku: "KPV-10", quantity: 1 }], email: "a@b.co", pay_method: "card" })).status, 400);
  assert.equal((await post("/api/checkout", { items: [{ sku: "KPV-10", quantity: -2 }], email: "a@b.co", attest: true, pay_method: "card" })).status, 400);
});

test("order page shows per-method instructions with the memo code", async () => {
  const { payRef } = require("../lib/orders");
  const h = await page(`/order/${order.id}`);
  assert.match(h, /pay@example\.com/);
  assert.match(h, /Name shown: LB Aminos/);
  assert.match(h, new RegExp(payRef(order)));
  assert.match(h, /\$189\.97/);
  const mk = async (pay_method) => (await (await post("/api/checkout", { items: [{ sku: "KPV-10", quantity: 1 }], email: "m@b.co", attest: true, pay_method })).json()).order_id;
  assert.match(await page(`/order/${await mk("cashapp")}`), /\$lbaminos[\s\S]*cash\.app\/%24lbaminos\/64\.99/);
  assert.match(await page(`/order/${await mk("venmo")}`), /@lb-aminos[\s\S]*venmo\.com\/u\/lb-aminos/);
  assert.match(await page(`/order/${await mk("card")}`), /secure Stripe payment link/);
});

test("admin: Stripe link on a card order, then mark paid (idempotent), and cancel", async () => {
  const orders = require("../lib/orders");
  const id = (await (await post("/api/checkout", { items: [{ sku: "KPV-10", quantity: 1 }], email: "card@b.co", attest: true, pay_method: "card" })).json()).order_id;
  assert.equal((await fetch(base + "/admin")).status, 401);
  const adm = await (await fetch(base + "/admin", { headers: adminAuth })).text();
  assert.match(adm, /Paste Stripe link/);
  assert.equal((await adminPost(`/admin/order/${id}/link`, "link=" + encodeURIComponent("https://evil.example.com/pay"))).status, 400);
  assert.equal((await adminPost(`/admin/order/${id}/link`, "link=" + encodeURIComponent("https://buy.stripe.com/test_abc123"))).status, 303);
  assert.equal((await (await fetch(`${base}/api/order/${id}`)).json()).pay_link, "https://buy.stripe.com/test_abc123");
  assert.match(await page(`/order/${id}`), /href="https:\/\/buy\.stripe\.com\/test_abc123"/);
  assert.equal((await adminPost(`/admin/order/${id}/paid`)).status, 303);
  assert.equal((await (await fetch(`${base}/api/order/${id}`)).json()).status, "paid");
  assert.equal(orders.markPaid({ orderId: id }).already, true);
  assert.match(await page(`/order/${id}`), /Payment received/);
  assert.equal(orders.markPaid({ orderId: order.id, amountCents: 100 }).mismatch, "amount", "underpaid refused");
  assert.equal((await adminPost(`/admin/order/${order.id}/cancel`)).status, 303);
  assert.equal((await (await fetch(`${base}/api/order/${order.id}`)).json()).status, "cancelled");
});

test("no card input fields, and no PeptidePay left anywhere", async () => {
  for (const p of ["/", "/shop", "/cart", "/lab-box", "/product/retatrutide-20mg", `/order/${order.id}`, "/legal/terms", "/legal/privacy", "/faq"]) {
    const h = await page(p);
    assert.doesNotMatch(h, /name="(card|cc|cvc|cvv|card_?number|exp(iry)?)/i, p);
    assert.doesNotMatch(h, /autocomplete="cc-/i, p);
    assert.doesNotMatch(h, /peptide-?pay/i, p);
  }
  const cart = await page("/cart");
  for (const m of ["card", "zelle", "cashapp", "venmo"]) assert.match(cart, new RegExp(`name="pay_method" value="${m}"`));
  const js = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");
  assert.doesNotMatch(js, /peptide-?pay|sk_live|whsec/i);
});

test("Lab Box: 4 picks at 20% off, free delivery, renewal after payment", async () => {
  require("../routes/checkout")._resetRateLimit();
  const box = ["RETA-20", "KLOW-80", "SELANK-10", "SELANK-10"];
  const ship = { email: "box@lab.co", fulfillment: "ship", attest: true, box_terms: true, pay_method: "venmo", address: { line1: "1 A", city: "LB", zip: "90802" } };
  assert.equal((await post("/api/checkout", { ...ship, box: box.slice(0, 3) })).status, 400);
  assert.equal((await post("/api/checkout", { ...ship, box: ["NOPE-1", ...box.slice(1)] })).status, 400, "unknown SKU rejected");
  assert.equal((await post("/api/checkout", { ...ship, box, box_terms: undefined })).status, 400, "box terms required");
  const r = await post("/api/checkout", { ...ship, box, total: 1 });
  const d = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  const expected = Math.round(7999 * 0.8) + Math.round(8999 * 0.8) + 2 * Math.round(4999 * 0.8);
  assert.equal((await (await fetch(`${base}/api/order/${d.order_id}`)).json()).amount, expected, "20% off list, shipping free");
  const orders = require("../lib/orders");
  const { db } = require("../lib/db");
  orders.markPaid({ orderId: d.order_id, txid: "manual:venmo" });
  const boxId = db.prepare("SELECT box_id FROM orders WHERE id=?").get(d.order_id).box_id;
  assert.equal(orders.getBox(boxId).months_paid, 1);
  assert.equal(orders.getBox(boxId).status, "active");
  const renewal = orders.createBoxRenewal(boxId);
  assert.equal(renewal.total_cents, expected);
  assert.equal(renewal.pay_method, "venmo", "renewal keeps the box's payment method");
  assert.equal(orders.createBoxRenewal(boxId).id, renewal.id, "only one open invoice at a time");
});

test("BOGO 50%: second unit half off, picks the cheaper of BOGO vs bulk", () => {
  const { linePrice, bySku } = require("../lib/catalog");
  const kpv = bySku.get("KPV-10").variant;
  assert.equal(linePrice(kpv, 1).totalCents, 6499);
  assert.equal(linePrice(kpv, 2).totalCents, 6499 + 3250);
  assert.equal(linePrice(kpv, 3).totalCents, 6499 * 2 + 3250);
  assert.equal(linePrice(kpv, 2).label, "BOGO 50%");
});

test("Lab Box includes free bacteriostatic water line", async () => {
  const { priceBox } = require("../lib/orders");
  const q = priceBox(["KPV-10", "KPV-10", "SELANK-10", "KLOW-80"], { fulfillment: "pickup" });
  const w = q.items.find((i) => i.sku === "BACW-10");
  assert.ok(w); assert.equal(w.totalCents, 0); assert.equal(w.qty, 1);
});

test("homepage features most-viewed products once there is enough data", async () => {
  const popularity = require("../lib/popularity");
  const catalog = require("../lib/catalog");
  const before = popularity.ranked();
  const target = catalog.PRODUCTS[catalog.PRODUCTS.length - 1].slug;
  const mk = (ip, ua = "Mozilla/5.0") => ({ method: "GET", ip, get: (h) => (h === "user-agent" ? ua : undefined) });
  popularity.record(mk("1.1.1.1", "Googlebot/2.1"), target); // bots ignored
  for (let i = 0; i < 25; i++) popularity.record(mk(`10.0.0.${i}`), target);
  popularity.record(mk("10.0.0.1"), target); // same visitor within 6 h: not counted again
  assert.equal(popularity.counts().get(target) >= 25, true);
  const after = popularity.ranked();
  assert.equal(after.byViews, true);
  assert.equal(after.products[0].slug, target);
  assert.ok(before.products.length === after.products.length);
});
