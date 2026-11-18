const express = require("express");
const { db, now } = require("../lib/db");
const config = require("../lib/config");
const orders = require("../lib/orders");
const { createPeptidePaySession, getPeptidePaySession, verifyPeptidePaySignature } = require("../lib/peptidepay");

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
 * Accepts either a "Buy now" body { product_slug, quantity } or a cart { items: [{ sku, quantity }], ... }.
 * Prices come ONLY from lib/catalog.js. Any client-sent price/total is ignored.
 * Responds JSON { url } for fetch calls, or 303 to the PeptidePay session url for form posts.
 */
router.post("/api/checkout", express.json({ limit: "32kb" }), express.urlencoded({ extended: false, limit: "32kb" }), rateLimit, async (req, res) => {
  const wantsJson = (req.get("accept") || "").includes("application/json") || req.is("application/json");
  const fail = (status, msg) => (wantsJson ? res.status(status).json({ error: msg }) : res.status(status).send(msg));
  try {
    if (!config.checkoutEnabled) return fail(503, "Online checkout opens soon. Call or email us to order for local pickup in the meantime.");

    const b = req.body || {};
    const lines = Array.isArray(b.items) ? b.items : b.product_slug ? [{ product_slug: b.product_slug, quantity: Number(b.quantity || 1) }] : [];
    const email = orders.normEmail(b.email);
    // Buy-now from a product page has no email yet: send the buyer to the cart to finish details.
    if (!email) {
      if (b.product_slug && !wantsJson) return res.redirect(303, `/cart?add=${encodeURIComponent(b.product_slug)}&qty=${Number(b.quantity || 1)}`);
      return fail(400, "Enter your email to check out.");
    }
    if (!orders.isEmail(email)) return fail(400, "Enter a valid email address.");
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

    const priced = orders.priceCart(lines, { fulfillment, discountCode: b.discount_code, email });
    if (priced.total < config.minOrderCents) return fail(400, "Order total is too small.");

    const order = orders.createOrder({ email, name: clean(b.name, 120), phone: clean(b.phone, 40), fulfillment, address, priced, notes: clean(b.notes, 500) });
    const session = await createPeptidePaySession({
      amountCents: order.total_cents, // authoritative, server-computed
      currency: order.currency,
      metadata: { order_id: order.id },
      successUrl: `${config.siteUrl}/order/${order.id}`,
      cancelUrl: `${config.siteUrl}/cart?cancelled=${order.id}`,
      customerEmail: email,
      productName: priced.items.length === 1 ? `${priced.items[0].name} ×${priced.items[0].qty}` : `LB Aminos order (${priced.items.length} items)`,
      webhookUrl: `${config.siteUrl}/api/peptidepay-webhook`,
      idempotencyKey: order.id,
    });
    orders.attachSession(order.id, session);
    return wantsJson ? res.json({ url: session.url, order_id: order.id }) : res.redirect(303, session.url);
  } catch (e) {
    if (e.userFacing) return fail(400, e.message);
    console.error("[checkout]", e.message);
    return fail(502, "We couldn't start checkout. Please try again in a moment.");
  }
});

/**
 * POST /api/peptidepay-webhook
 * Body is read RAW (express.raw) so the HMAC is computed over the exact bytes received.
 *  - Signed (x-peptidepay-signature present): must verify, or 401.
 *  - Unsigned (wallet-only mode sends these): the body is never trusted. We look up the
 *    session we created and ask PeptidePay's API for its real status; only that can mark it paid.
 */
router.post("/api/peptidepay-webhook", express.raw({ type: "*/*", limit: "64kb" }), async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  const sig = req.get("x-peptidepay-signature");

  if (sig) {
    if (!verifyPeptidePaySignature(raw, sig)) return res.status(401).json({ error: "invalid signature" });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).json({ error: "bad json" }); }
  const sessionId = typeof event.session_id === "string" ? event.session_id : "";
  const orderId = typeof event.order_id === "string" ? event.order_id : event.metadata?.order_id;

  // Must correspond to a session WE created.
  const known = sessionId ? db.prepare("SELECT id, status, session_id FROM orders WHERE session_id = ?").get(sessionId) : null;
  if (!known || (orderId && orderId !== known.id)) return res.status(sig ? 404 : 401).json({ error: "unknown session" });

  db.prepare("INSERT INTO webhook_events (session_id, received_at, signed, body) VALUES (?,?,?,?)").run(sessionId, now(), sig ? 1 : 0, raw.slice(0, 8000));
  if (known.status !== "pending") return res.json({ ok: true, duplicate: true }); // idempotent

  if (event.event !== "order.paid" || event.status !== "paid") return res.json({ ok: true, ignored: true });

  let paid = { amount: event.amount, currency: event.currency, txid: event.txid, paidAt: event.paid_at };
  if (!sig) {
    // Unsigned: confirm with PeptidePay before believing anything.
    try {
      const s = await getPeptidePaySession(sessionId);
      if (s.status !== "paid") return res.status(401).json({ error: "session not paid" });
      paid = { amount: s.amount ?? s.amount_cents, currency: s.currency, txid: s.txid || event.txid, paidAt: s.paid_at || event.paid_at };
    } catch (e) {
      console.error("[webhook] could not confirm unsigned event", e.message);
      return res.status(503).json({ error: "verification unavailable, retry" }); // PeptidePay will retry
    }
  }

  const r = orders.markPaid({ orderId: known.id, sessionId, txid: paid.txid, amountCents: Number(paid.amount), currency: paid.currency, paidAt: paid.paidAt });
  if (r.mismatch) {
    console.error(`[webhook] ${known.id} ${r.mismatch} mismatch`, raw.slice(0, 500));
    return res.status(422).json({ error: `${r.mismatch} mismatch` });
  }
  return res.json({ ok: true, duplicate: Boolean(r.already) });
});

/**
 * GET /api/order/:id -> { status: 'pending' | 'paid', amount, currency }
 * Also acts as the webhook fallback: if still pending, re-check the session with PeptidePay (at most every 10s).
 */
router.get("/api/order/:id", async (req, res) => {
  let o = orders.getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: "not found" });
  if (o.status === "pending" && o.session_id && (!o.last_poll_at || Date.now() - o.last_poll_at > 10_000)) {
    db.prepare("UPDATE orders SET last_poll_at = ? WHERE id = ?").run(Date.now(), o.id);
    try {
      const s = await getPeptidePaySession(o.session_id);
      if (s.status === "paid") {
        orders.markPaid({ orderId: o.id, sessionId: o.session_id, txid: s.txid, amountCents: Number(s.amount ?? s.amount_cents), currency: s.currency, paidAt: s.paid_at });
        o = orders.getOrder(o.id);
      }
    } catch (e) {
      console.warn("[order poll]", e.message);
    }
  }
  const status = o.status === "pending" || o.status === "cancelled" ? "pending" : "paid";
  res.set("Cache-Control", "no-store").json({ status, amount: o.total_cents, currency: o.currency });
});

module.exports = router;
