const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const config = require("./lib/config");
const catalog = require("./lib/catalog");
const views = require("./lib/views");
const orders = require("./lib/orders");
const { db, now } = require("./lib/db");
const { configStatus } = require("./lib/peptidepay");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; form-action 'self' https://peptide-pay.com https://www.peptide-pay.com; frame-ancestors 'none'; base-uri 'self'",
  });
  if (req.secure) res.set("Strict-Transport-Security", "max-age=31536000");
  next();
});

// Payment routes first: the webhook needs the raw body, so no global JSON parser.
const payments = require("./routes/payments");
app.use(payments);

app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));

const html = (res, s, code = 200) => res.status(code).type("html").send(s);

// ---------- pages ----------
app.get("/", (req, res) => html(res, views.home()));
app.get("/shop", (req, res) => html(res, views.shop(String(req.query.cat || ""))));
app.get("/product/:slug", (req, res) => {
  const p = catalog.bySlug.get(req.params.slug);
  return p ? html(res, views.product(p)) : html(res, views.notFound(), 404);
});
app.get("/cart", (req, res) => html(res, views.cart()));
app.get("/lab-box", (req, res) => html(res, views.labBox()));
app.get("/order/:id", (req, res) => {
  const o = orders.getOrder(req.params.id);
  res.set("Cache-Control", "no-store");
  return o ? html(res, views.orderPage(o)) : html(res, views.notFound(), 404);
});
app.get("/coa", (req, res) => html(res, views.coaPage()));
app.get("/pickup", (req, res) => html(res, views.pickupPage()));
app.get("/contact", (req, res) => html(res, views.contactPage(String(req.query.topic || ""))));
app.get("/track", (req, res) => html(res, views.trackPage()));
app.get("/research", (req, res) => html(res, views.researchPage()));
app.get("/help", (req, res) => html(res, views.helpPage()));
app.get("/faq", (req, res) => res.redirect(301, "/help"));
for (const [p, [title, body, eyebrow]] of Object.entries(views.PAGES)) {
  app.get(p, (req, res) => html(res, views.article(title, p, body, eyebrow)));
}

// ---------- public JSON ----------
// Prices here are for display only; checkout re-prices from the catalog on the server.
app.get("/api/catalog", (req, res) => {
  res.json({
    pricesConfirmed: catalog.PRICES_CONFIRMED,
    checkoutEnabled: config.checkoutEnabled,
    tiers: catalog.QTY_TIERS,
    box: catalog.BOX,
    boxBundle: catalog.BOX_BUNDLE,
    sale: catalog.SALE,
    fulfillment: config.fulfillment,
    products: catalog.PRODUCTS.map((p) => ({ slug: p.slug, name: p.name, img: p.img, color: p.color, variants: p.variants })),
  });
});

const jsonBody = express.json({ limit: "16kb" });
const clean = (s, n = 200) => (typeof s === "string" ? s.trim().slice(0, n) : "");

// Server-side quote for the cart page: same pricing function checkout uses.
app.post("/api/quote", jsonBody, (req, res) => {
  try {
    const b = req.body || {};
    const q = orders.priceCart(b.items, { fulfillment: clean(b.fulfillment, 20) || "pickup", discountCode: b.discount_code, email: b.email });
    res.json(q);
  } catch (e) {
    res.status(400).json({ error: e.userFacing ? e.message : "Couldn't price the cart." });
  }
});

app.post("/api/box-quote", jsonBody, (req, res) => {
  try {
    res.json(orders.priceBox(req.body?.box, { fulfillment: clean(req.body?.fulfillment, 20) || "pickup" }));
  } catch (e) {
    res.status(400).json({ error: e.userFacing ? e.message : "Couldn't price the box." });
  }
});

app.post("/api/subscribe", jsonBody, (req, res) => {
  try {
    const s = orders.subscribe(req.body?.email);
    res.json({ code: s.code });
  } catch (e) {
    res.status(400).json({ error: e.userFacing ? e.message : "Something went wrong." });
  }
});

app.post("/api/pickup", jsonBody, (req, res) => {
  const b = req.body || {};
  if (!clean(b.name) || !clean(b.contact)) return res.status(400).json({ error: "Name and phone or email are required." });
  db.prepare("INSERT INTO pickup_requests (created_at, name, contact, preferred, order_id, note) VALUES (?,?,?,?,?,?)")
    .run(now(), clean(b.name, 120), clean(b.contact, 120), clean(b.preferred, 120), clean(b.order_id, 40), clean(b.note, 1000));
  console.log("[pickup] new request from", clean(b.name, 120));
  res.json({ ok: true, message: "Got it. We’ll confirm your pickup time shortly." });
});

app.post("/api/contact", jsonBody, (req, res) => {
  const b = req.body || {};
  if (!clean(b.contact) || !clean(b.body)) return res.status(400).json({ error: "Add a way to reach you and a message." });
  db.prepare("INSERT INTO messages (created_at, name, contact, topic, body) VALUES (?,?,?,?,?)")
    .run(now(), clean(b.name, 120), clean(b.contact, 120), clean(b.topic, 20), clean(b.body, 4000));
  res.json({ ok: true, message: "Thanks, we’ll get back to you soon." });
});

// ---------- SEO ----------
app.get("/robots.txt", (req, res) => res.type("text").send(`User-agent: *\nDisallow: /admin\nDisallow: /order/\nDisallow: /api/\nSitemap: ${config.siteUrl}/sitemap.xml\n`));
app.get("/sitemap.xml", (req, res) => {
  const urls = ["/", "/shop", "/lab-box", "/coa", "/pickup", "/research", "/help", "/contact", ...Object.keys(views.PAGES), ...catalog.PRODUCTS.map((p) => `/product/${p.slug}`)];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${config.siteUrl}${u}</loc></url>`).join("")}</urlset>`);
});
app.get("/healthz", (req, res) => res.json({ ok: true }));

// ---------- admin (HTTP basic auth, ADMIN_PASSWORD env) ----------
function adminAuth(req, res, next) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return res.status(503).send("Set ADMIN_PASSWORD to enable the admin dashboard.");
  const [, b64] = (req.get("authorization") || "").split(" ");
  const given = Buffer.from(b64 || "", "base64").toString().split(":").slice(1).join(":");
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(pw).digest();
  if (!crypto.timingSafeEqual(a, b)) return res.set("WWW-Authenticate", 'Basic realm="LB Aminos admin"').status(401).send("Auth required");
  next();
}
app.get("/admin", adminAuth, (req, res) => {
  const e = views.esc;
  const m = views.money2;
  const os = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all();
  const pk = db.prepare("SELECT * FROM pickup_requests ORDER BY id DESC LIMIT 100").all();
  const ms = db.prepare("SELECT * FROM messages ORDER BY id DESC LIMIT 100").all();
  const subs = db.prepare("SELECT COUNT(*) n FROM subscribers").get().n;
  const refs = db.prepare("SELECT u.code, r.owner_email, COUNT(*) n FROM referral_uses u JOIN referral_codes r ON r.code=u.code JOIN orders o ON o.id=u.order_id WHERE o.status IN ('paid','fulfilled') GROUP BY u.code").all();
  const cs = configStatus();
  const body = `<section class="block"><div class="wrap admin">
  <h1>Admin</h1>
  <div class="note-box ${cs.mode === "not-configured" || !config.checkoutEnabled ? "warn" : ""}"><b>Payments:</b> mode ${e(cs.mode)} · wallet ${cs.walletSet ? "set" : cs.walletInvalid ? "INVALID" : "missing"} · sk_live key ${cs.apiKeySet ? "set" : cs.apiKeyIsTest ? "is sk_test (ignored)" : "not set"} · webhook secret ${cs.webhookSecretSet ? "set" : "missing"} · checkout ${config.checkoutEnabled ? "ENABLED" : "disabled"} · prices ${catalog.PRICES_CONFIRMED ? "confirmed" : "PLACEHOLDER"}</div>
  <p>${subs} email subscribers.</p>
  <form method="post" action="/admin/test-payment"><button class="btn btn-ghost btn-sm">Run a $1 live test payment</button> <span class="small muted">Real money: refund it to yourself afterwards.</span></form>
  <h2>Orders</h2><div class="table-scroll"><table class="ledger"><thead><tr><th>Created</th><th>Order</th><th>Status</th><th>Email / phone</th><th>Items</th><th>Total</th><th>How</th><th>Tx</th><th></th></tr></thead><tbody>
  ${os.map((o) => `<tr><td class="small">${e(o.created_at.slice(0, 16).replace("T", " "))}</td><td class="mono small"><a href="/order/${e(o.id)}">${e(o.id)}</a></td><td><b>${e(o.status)}</b></td><td class="small">${e(o.email)}<br>${e(o.phone || "")}</td>
  <td class="small">${JSON.parse(o.items).map((i) => `${e(i.name)} ×${i.qty}`).join("<br>")}</td><td class="mono">${m(o.total_cents)}${o.discount_code ? `<br><span class="small">${e(o.discount_code)}</span>` : ""}</td><td class="small">${e(o.fulfillment)}${o.address ? `<br>${e(Object.values(JSON.parse(o.address)).filter(Boolean).join(", "))}` : ""}</td>
  <td class="mono small">${o.txid ? e(o.txid.slice(0, 12)) + "…" : ""}</td><td>${o.status === "paid" ? `<form method="post" action="/admin/fulfill/${e(o.id)}"><button class="btn btn-ghost btn-sm">Mark fulfilled</button></form>` : ""}</td></tr>`).join("") || `<tr><td colspan="9" class="muted">No orders yet.</td></tr>`}
  </tbody></table></div>
  <h2 id="boxes">Lab Boxes</h2><p class="small muted">Each month, press “Create invoice” and send the customer the payment link. Minimum ${catalog.BOX.months} months.</p>
  <div class="table-scroll"><table class="ledger"><thead><tr><th>Started</th><th>Box</th><th>Status</th><th>Customer</th><th>Compounds</th><th>Months paid</th><th>Next invoice</th><th></th></tr></thead><tbody>
  ${db.prepare("SELECT * FROM boxes ORDER BY created_at DESC LIMIT 200").all().map((b) => {
    const open = db.prepare("SELECT id, session_url, total_cents FROM orders WHERE box_id = ? AND status = 'pending' ORDER BY created_at DESC").get(b.id);
    const names = JSON.parse(b.skus).map((k) => { const x = catalog.bySku.get(k); return x ? `${x.product.name} ${x.variant.size}` : k; });
    return `<tr><td class="small">${e(b.created_at.slice(0, 10))}</td><td class="mono small">${e(b.id)}</td><td><b>${e(b.status)}</b></td><td class="small">${e(b.email)}<br>${e(b.phone || "")}</td><td class="small">${names.map(e).join("<br>")}</td><td class="mono">${b.months_paid}</td>
    <td class="small">${open ? `${m(open.total_cents)} <a href="${e(open.session_url || "")}">payment link</a><br><span class="mono">${e(open.id)}</span>` : "—"}</td>
    <td>${b.status === "active" && !open ? `<form method="post" action="/admin/box/${e(b.id)}/invoice"><button class="btn btn-ghost btn-sm">Create invoice</button></form>` : ""}${b.status !== "cancelled" && b.months_paid >= catalog.BOX.months ? `<form method="post" action="/admin/box/${e(b.id)}/cancel"><button class="btn btn-ghost btn-sm">Cancel</button></form>` : ""}</td></tr>`;
  }).join("") || `<tr><td colspan="8" class="muted">No Lab Boxes yet.</td></tr>`}
  </tbody></table></div>
  <h2>Pickup requests</h2><table class="ledger"><tbody>${pk.map((p) => `<tr><td class="small">${e(p.created_at.slice(0, 16))}</td><td>${e(p.name)}</td><td>${e(p.contact)}</td><td>${e(p.preferred)}</td><td class="mono small">${e(p.order_id)}</td><td class="small">${e(p.note)}</td></tr>`).join("") || `<tr><td class="muted">None yet.</td></tr>`}</tbody></table>
  <h2>Messages</h2><table class="ledger"><tbody>${ms.map((p) => `<tr><td class="small">${e(p.created_at.slice(0, 16))}</td><td>${e(p.name)}</td><td>${e(p.contact)}</td><td>${e(p.topic)}</td><td class="small">${e(p.body)}</td></tr>`).join("") || `<tr><td class="muted">None yet.</td></tr>`}</tbody></table>
  <h2>Referral credits owed</h2><table class="ledger"><tbody>${refs.map((r) => `<tr><td class="mono">${e(r.code)}</td><td>${e(r.owner_email)}</td><td>${r.n} paid referral(s) = ${m(r.n * config.discounts.referralCreditCents)}</td></tr>`).join("") || `<tr><td class="muted">None yet.</td></tr>`}</tbody></table>
  </div></section>`;
  res.set("Cache-Control", "no-store");
  html(res, views.layout({ title: "Admin", path: "/admin", body }));
});
app.post("/admin/box/:id/invoice", adminAuth, async (req, res) => {
  try {
    const o = orders.createBoxRenewal(req.params.id);
    if (!o.session_url) {
      const b = orders.getBox(req.params.id);
      await payments.startSession(o, `LB Aminos Lab Box, month ${b.months_paid + 1}`, "/lab-box");
    }
    res.redirect(303, "/admin#boxes");
  } catch (e) {
    res.status(400).send(e.userFacing ? e.message : `Couldn't create the invoice: ${e.message}`);
  }
});
app.post("/admin/box/:id/cancel", adminAuth, (req, res) => {
  db.prepare("UPDATE boxes SET status='cancelled' WHERE id=?").run(req.params.id);
  res.redirect(303, "/admin#boxes");
});
// $1 live test payment (PeptidePay has no sandbox): creates a real $1.00 order and opens checkout.
app.post("/admin/test-payment", adminAuth, async (req, res) => {
  try {
    const priced = { items: [{ sku: "TEST-1", slug: null, name: "Test payment", qty: 1, listUnitCents: 100, unitCents: 100, totalCents: 100, tierPct: 0 }], subtotal: 100, discount: 0, discountCode: null, shipping: 0, total: 100 };
    const o = orders.createOrder({ email: config.brand.email, fulfillment: "pickup", priced, notes: "Admin $1 test payment" });
    const s = await payments.startSession(o, "LB Aminos test payment", "/admin");
    res.redirect(303, s.url);
  } catch (e) {
    res.status(502).send(`PeptidePay test failed: ${e.message}`);
  }
});
app.post("/admin/fulfill/:id", adminAuth, (req, res) => {
  db.prepare("UPDATE orders SET status='fulfilled' WHERE id=? AND status='paid'").run(req.params.id);
  res.redirect(303, "/admin");
});

app.use((req, res) => html(res, views.notFound(), 404));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Server error");
});

orders.startWorker();

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    const cs = configStatus();
    console.log(`LB Aminos store on :${port} · ${config.siteUrl}`);
    console.log(`[peptidepay] mode=${cs.mode} wallet=${cs.walletSet} live_key=${cs.apiKeySet} webhook_secret=${cs.webhookSecretSet} checkout_enabled=${config.checkoutEnabled}`);
    if (cs.apiKeyIsTest) console.warn("[peptidepay] PEPTIDEPAY_API_KEY is an sk_test_ key; it is ignored. Use sk_live_.");
    if (cs.walletInvalid) console.warn("[peptidepay] PEPTIDEPAY_WALLET is not a valid 0x address.");
    if (!catalog.PRICES_CONFIRMED) console.warn("[catalog] Prices are PLACEHOLDERS.");
  });
}

module.exports = app;
