const express = require("express");
const config = require("../lib/config");
const orders = require("../lib/orders");

const router = express.Router();

// ---------- simple per-IP rate limit for checkout ----------
const hits = new Map();
function rateLimit(req, res, next) {
  const k = req.ip;
  const t = Date.now();
  const arr = (hits.get(k) || []).filter((x) => t - x < 60_000);
  arr.push(t);
  hits.set(k, arr);
  if (arr.length > 15) return res.status(429).json({ error: "Too many checkout attempts. Try again in a minute." });
  next();
}

const clean = (s, n = 200) => (typeof s === "string" ? s.trim().slice(0, n) : "");

/**
 * POST /api/checkout
 * Places an order with manual payment. Accepts a cart { items: [{ sku, quantity }] }, a "Buy now"
 * { product_slug, sku, quantity } or a Lab Box { box: [sku x4] }, plus pay_method (card | zelle | cashapp | venmo).
 * Prices come ONLY from lib/catalog.js. Any client-sent price/total is ignored.
 * Responds JSON { url, order_id } where url is the order page with payment instructions.
 * No payment data is collected here: card buyers get a Stripe link from ant afterwards.
 */
router.post("/api/checkout", express.json({ limit: "32kb" }), express.urlencoded({ extended: false, limit: "32kb" }), rateLimit, async (req, res) => {
  const wantsJson = (req.get("accept") || "").includes("application/json") || req.is("application/json");
  const fail = (status, msg) => (wantsJson ? res.status(status).json({ error: msg }) : res.status(status).send(msg));
  try {
    if (!config.checkoutEnabled) return fail(503, "Online ordering opens soon. Call or email us to order for local pickup in the meantime.");

    const b = req.body || {};
    const lines = Array.isArray(b.items) ? b.items : b.product_slug ? [{ sku: b.sku, product_slug: b.product_slug, quantity: Number(b.quantity || 1) }] : [];
    const email = orders.normEmail(b.email);
    // Buy-now from a product page has no contact details yet: send the buyer to the cart to finish.
    if (!email) {
      if (b.product_slug && !wantsJson) return res.redirect(303, `/cart?add=${encodeURIComponent(b.product_slug)}&sku=${encodeURIComponent(b.sku || "")}&qty=${Number(b.quantity || 1)}`);
      return fail(400, "Enter your email to place your order.");
    }
    if (!orders.isEmail(email)) return fail(400, "Enter a valid email address.");
    const payMethod = clean(b.pay_method, 20);
    if (!config.payments.methods[payMethod]) return fail(400, "Choose how you'd like to pay: card, Zelle, Cash App or Venmo.");
    if (b.attest !== true && b.attest !== "on" && b.attest !== "true") {
      return fail(400, "Please confirm the research-use-only and 21+ statement to continue.");
    }
    const fulfillment = clean(b.fulfillment, 20) || "pickup";
    let address = null;
    if (fulfillment === "ship" || fulfillment === "delivery") {
      const a = b.address || {};
      address = { line1: clean(a.line1), line2: clean(a.line2), city: clean(a.city, 80), state: clean(a.state, 40), zip: clean(a.zip, 12) };
      if (!address.line1 || !address.city || !address.zip) return fail(400, "Enter a delivery address.");
      if (fulfillment === "ship" && !/^\d{5}(-\d{4})?$/.test(address.zip)) return fail(400, "We ship to US addresses only for now.");
    }

    const isBox = Array.isArray(b.box);
    if (isBox && b.box_terms !== true) return fail(400, "Please confirm the Lab Box terms: 3 monthly shipments, invoiced monthly.");
    const priced = isBox ? orders.priceBox(b.box, { fulfillment }) : orders.priceCart(lines, { fulfillment, discountCode: b.discount_code, email });
    if (priced.total < config.minOrderCents) return fail(400, "Order total is too small.");

    const contact = { email, name: clean(b.name, 120), phone: clean(b.phone, 40), fulfillment, address };
    const box = isBox ? orders.createBox({ ...contact, skus: b.box.map(String) }) : null;
    const order = orders.createOrder({ ...contact, priced, notes: box ? "Lab Box month 1" : clean(b.notes, 500), boxId: box?.id, payMethod });
    const url = `/order/${order.id}`;
    return wantsJson ? res.json({ url, order_id: order.id }) : res.redirect(303, url);
  } catch (e) {
    if (e.userFacing) return fail(400, e.message);
    console.error("[checkout]", e.message);
    return fail(500, "We couldn't place your order. Please try again, or call us.");
  }
});

/** GET /api/order/:id -> { status: 'pending' | 'paid' | 'cancelled', amount, currency, pay_link } */
router.get("/api/order/:id", (req, res) => {
  const o = orders.getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: "not found" });
  const status = o.status === "pending" || o.status === "cancelled" ? o.status : "paid";
  res.set("Cache-Control", "no-store").json({ status, amount: o.total_cents, currency: o.currency, pay_link: o.pay_link || null });
});

router._resetRateLimit = () => hits.clear();
module.exports = router;
