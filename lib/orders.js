const crypto = require("node:crypto");
const { db, now } = require("./db");
const catalog = require("./catalog");
const config = require("./config");

const rid = (prefix, bytes = 8) => `${prefix}${crypto.randomBytes(bytes).toString("hex")}`;
const code = (prefix) => `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const normEmail = (e) => String(e || "").trim().toLowerCase();
const isEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);

/**
 * Price a cart from the catalog. `lines` is [{ sku | product_slug, quantity }].
 * Returns authoritative items and totals; throws on anything invalid.
 */
function priceCart(lines, { fulfillment, discountCode, email }) {
  if (!Array.isArray(lines) || lines.length === 0) throw userErr("Your cart is empty.");
  if (lines.length > 30) throw userErr("Too many lines in the cart.");
  const merged = new Map();
  for (const l of lines) {
    let entry = l.sku ? catalog.bySku.get(String(l.sku)) : null;
    if (!entry && l.product_slug) {
      const p = catalog.bySlug.get(String(l.product_slug));
      if (p) entry = { product: p, variant: p.variants.find((v) => v.inStock) || p.variants[0] };
    }
    if (!entry) throw userErr("A product in your cart is no longer available.");
    if (!entry.variant.inStock) throw userErr(`${entry.product.name} ${entry.variant.size} is out of stock.`);
    const q = Number(l.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 50) throw userErr("Quantity must be between 1 and 50.");
    merged.set(entry.variant.sku, { entry, qty: (merged.get(entry.variant.sku)?.qty || 0) + q });
  }
  const items = [];
  let subtotal = 0;
  for (const { entry, qty } of merged.values()) {
    const q = Math.min(qty, 50);
    const lp = catalog.linePrice(entry.variant, q);
    items.push({
      sku: entry.variant.sku, slug: entry.product.slug, name: `${entry.product.name} ${entry.variant.size}`,
      qty: q, listUnitCents: entry.variant.priceCents, unitCents: lp.unitCents, totalCents: lp.totalCents, tierPct: lp.tierPct,
    });
    subtotal += lp.totalCents;
  }

  const disc = resolveDiscount(discountCode, email);
  const discount = disc ? Math.round((subtotal * disc.pct) / 100) : 0;
  const after = subtotal - discount;

  const f = config.fulfillment[fulfillment];
  if (!f) throw userErr("Choose pickup, local delivery or shipping.");
  const shipping = f.freeOverCents && after >= f.freeOverCents ? 0 : f.feeCents;
  const total = after + shipping;
  return { items, subtotal, discount, discountCode: disc?.code || null, discountLabel: disc?.label || null, shipping, total };
}

function resolveDiscount(raw, email) {
  const c = String(raw || "").trim().toUpperCase();
  if (!c) return null;
  const em = normEmail(email);
  const sub = db.prepare("SELECT * FROM subscribers WHERE code = ?").get(c);
  if (sub) {
    if (sub.used_order) throw userErr("That welcome code has already been used.");
    if (sub.email !== em) throw userErr("Welcome codes only work with the email they were sent to.");
    if (db.prepare("SELECT 1 FROM orders WHERE email = ? AND status IN ('paid','fulfilled')").get(em)) {
      throw userErr("Welcome codes are for a first order only.");
    }
    return { code: c, pct: config.discounts.welcomePct, label: `Welcome ${config.discounts.welcomePct}% off` };
  }
  const ref = db.prepare("SELECT * FROM referral_codes WHERE code = ?").get(c);
  if (ref) {
    if (ref.owner_email === em) throw userErr("You can't use your own referral code.");
    return { code: c, pct: config.discounts.referralPct, label: `Referral ${config.discounts.referralPct}% off` };
  }
  throw userErr("That discount code isn't valid.");
}

function userErr(msg) {
  const e = new Error(msg);
  e.userFacing = true;
  return e;
}

function createOrder({ email, name, phone, fulfillment, address, priced, notes }) {
  const id = rid("ord_");
  db.prepare(`INSERT INTO orders (id, created_at, email, name, phone, fulfillment, address, items, subtotal_cents, discount_cents,
      shipping_cents, total_cents, currency, discount_code, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, now(), normEmail(email), name || null, phone || null, fulfillment, address ? JSON.stringify(address) : null,
    JSON.stringify(priced.items), priced.subtotal, priced.discount, priced.shipping, priced.total, config.currency,
    priced.discountCode, notes || null);
  return getOrder(id);
}

function getOrder(id) {
  if (typeof id !== "string" || !/^ord_[0-9a-f]{16}$/.test(id)) return null;
  const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!o) return null;
  return { ...o, items: JSON.parse(o.items), address: o.address ? JSON.parse(o.address) : null };
}

function attachSession(orderId, session) {
  db.prepare("UPDATE orders SET session_id = ?, session_url = ? WHERE id = ?").run(session.id, session.url, orderId);
}

/**
 * Idempotent: a second call for the same order/session changes nothing and returns { already: true }.
 * Only marks paid when the amount paid covers the order total in the order's currency.
 */
function markPaid({ orderId, sessionId, txid, amountCents, currency, paidAt }) {
  db.exec("BEGIN IMMEDIATE");
  try {
    let o = orderId ? db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) : null;
    if (!o && sessionId) o = db.prepare("SELECT * FROM orders WHERE session_id = ?").get(sessionId);
    if (!o) { db.exec("ROLLBACK"); return { found: false }; }
    if (sessionId && o.session_id && o.session_id !== sessionId) { db.exec("ROLLBACK"); return { found: false, mismatch: "session" }; }
    if (o.status !== "pending") { db.exec("ROLLBACK"); return { found: true, already: true, order: o }; }
    if (currency && currency !== o.currency) { db.exec("ROLLBACK"); return { found: true, mismatch: "currency" }; }
    if (!Number.isInteger(amountCents) || amountCents < o.total_cents) { db.exec("ROLLBACK"); return { found: true, mismatch: "amount" }; }

    const ref = code("REF");
    db.prepare("UPDATE orders SET status='paid', txid=?, paid_amount_cents=?, paid_at=?, referral_code=? WHERE id=?")
      .run(txid || null, amountCents, paidAt || now(), ref, o.id);
    db.prepare("INSERT INTO referral_codes (code, owner_email, owner_order, created_at) VALUES (?,?,?,?)").run(ref, o.email, o.id, now());
    if (o.discount_code) {
      db.prepare("UPDATE subscribers SET used_order = ? WHERE code = ? AND used_order IS NULL").run(o.id, o.discount_code);
      if (o.discount_code.startsWith("REF-")) {
        db.prepare("INSERT OR IGNORE INTO referral_uses (code, order_id) VALUES (?,?)").run(o.discount_code, o.id);
      }
    }
    db.prepare("INSERT INTO jobs (kind, payload, created_at) VALUES ('order.paid', ?, ?)").run(JSON.stringify({ orderId: o.id }), now());
    db.exec("COMMIT");
    return { found: true, paid: true, order: getOrder(o.id) };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

// Background worker: fulfillment/notification jobs run off the webhook's request path.
// Notifications go to the server log and the /admin dashboard; plug an email provider in here later.
function startWorker() {
  const tick = () => {
    const jobs = db.prepare("SELECT * FROM jobs WHERE done_at IS NULL ORDER BY id LIMIT 20").all();
    for (const j of jobs) {
      try {
        const p = JSON.parse(j.payload);
        if (j.kind === "order.paid") {
          const o = getOrder(p.orderId);
          console.log(`[orders] PAID ${o.id} ${o.email} $${(o.total_cents / 100).toFixed(2)} via ${o.fulfillment} tx=${o.txid}`);
        }
        db.prepare("UPDATE jobs SET done_at = ? WHERE id = ?").run(now(), j.id);
      } catch (e) {
        console.error("[worker] job failed", j.id, e.message);
      }
    }
  };
  const t = setInterval(tick, 5000);
  t.unref();
  return tick;
}

function subscribe(email) {
  const em = normEmail(email);
  if (!isEmail(em)) throw userErr("Enter a valid email address.");
  const existing = db.prepare("SELECT * FROM subscribers WHERE email = ?").get(em);
  if (existing) return existing;
  const c = code("WELCOME");
  db.prepare("INSERT INTO subscribers (email, code, created_at) VALUES (?,?,?)").run(em, c, now());
  return { email: em, code: c };
}

module.exports = { priceCart, createOrder, getOrder, attachSession, markPaid, startWorker, subscribe, userErr, isEmail, normEmail };
