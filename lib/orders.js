const crypto = require("node:crypto");
const { db, now } = require("./db");
const catalog = require("./catalog");
const config = require("./config");
const notify = require("./notify");

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
      qty: q, listUnitCents: entry.variant.priceCents, unitCents: lp.unitCents, totalCents: lp.totalCents, tierPct: lp.tierPct, label: lp.label,
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

/** Price a Lab Box: exactly BOX.slots in-stock SKUs, each at BOX.pct off list, delivery/shipping free. */
function priceBox(skus, { fulfillment }) {
  const { BOX } = catalog;
  if (!Array.isArray(skus) || skus.length !== BOX.slots) throw userErr(`Pick ${BOX.slots} compounds for your Lab Box.`);
  if (!config.fulfillment[fulfillment]) throw userErr("Choose pickup, local delivery or shipping.");
  const counts = new Map();
  for (const raw of skus) {
    const e = catalog.bySku.get(String(raw));
    if (!e) throw userErr("A compound in your box is no longer available.");
    if (!e.variant.inStock) throw userErr(`${e.product.name} ${e.variant.size} is out of stock.`);
    counts.set(e.variant.sku, { e, qty: (counts.get(e.variant.sku)?.qty || 0) + 1 });
  }
  const items = [];
  let subtotal = 0, list = 0;
  for (const { e, qty } of counts.values()) {
    const unit = Math.round((e.variant.priceCents * (100 - BOX.pct)) / 100);
    items.push({ sku: e.variant.sku, slug: e.product.slug, name: `${e.product.name} ${e.variant.size}`, qty, listUnitCents: e.variant.priceCents, unitCents: unit, totalCents: unit * qty, tierPct: BOX.pct, label: `Lab Box −${BOX.pct}%` });
    subtotal += unit * qty;
    list += e.variant.priceCents * qty;
  }
  const W = catalog.BOX_BUNDLE;
  items.push({ sku: W.sku, slug: null, name: `${W.name} (bundled)`, qty: 1, listUnitCents: W.listCents, unitCents: 0, totalCents: 0, tierPct: 0, label: "Free" });
  return { items, subtotal, discount: 0, discountCode: null, discountLabel: null, shipping: 0, total: subtotal, listTotal: list, box: true };
}

function createBox({ email, name, phone, fulfillment, address, skus }) {
  const id = rid("box_");
  db.prepare("INSERT INTO boxes (id, created_at, email, name, phone, fulfillment, address, skus) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, now(), normEmail(email), name || null, phone || null, fulfillment, address ? JSON.stringify(address) : null, JSON.stringify(skus));
  return getBox(id);
}

function getBox(id) {
  if (typeof id !== "string" || !/^box_[0-9a-f]{16}$/.test(id)) return null;
  const b = db.prepare("SELECT * FROM boxes WHERE id = ?").get(id);
  return b ? { ...b, skus: JSON.parse(b.skus), address: b.address ? JSON.parse(b.address) : null } : null;
}

/** Create the next month's invoice (order) for an active box, priced from the current catalog. */
function createBoxRenewal(boxId) {
  const b = getBox(boxId);
  if (!b || b.status !== "active") throw userErr("That box isn't active.");
  const open = db.prepare("SELECT id FROM orders WHERE box_id = ? AND status = 'pending'").get(b.id);
  if (open) return getOrder(open.id);
  const priced = priceBox(b.skus, { fulfillment: b.fulfillment });
  const first = db.prepare("SELECT pay_method FROM orders WHERE box_id = ? ORDER BY created_at LIMIT 1").get(b.id);
  return createOrder({ email: b.email, name: b.name, phone: b.phone, fulfillment: b.fulfillment, address: b.address, priced, notes: `Lab Box month ${b.months_paid + 1}`, boxId: b.id, payMethod: first?.pay_method });
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

function createOrder({ email, name, phone, fulfillment, address, priced, notes, boxId, payMethod }) {
  const id = rid("ord_");
  db.prepare(`INSERT INTO orders (id, created_at, email, name, phone, fulfillment, address, items, subtotal_cents, discount_cents,
      shipping_cents, total_cents, currency, discount_code, notes, box_id, pay_method) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, now(), normEmail(email), name || null, phone || null, fulfillment, address ? JSON.stringify(address) : null,
    JSON.stringify(priced.items), priced.subtotal, priced.discount, priced.shipping, priced.total, config.currency,
    priced.discountCode, notes || null, boxId || null, payMethod || null);
  db.prepare("INSERT INTO jobs (kind, payload, created_at) VALUES ('order.placed', ?, ?)").run(JSON.stringify({ orderId: id }), now());
  return getOrder(id);
}

function getOrder(id) {
  if (typeof id !== "string" || !/^ord_[0-9a-f]{16}$/.test(id)) return null;
  const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!o) return null;
  return { ...o, items: JSON.parse(o.items), address: o.address ? JSON.parse(o.address) : null };
}

/** Short code buyers put in the Zelle / Cash App / Venmo memo, e.g. LB-3F9A1C. */
const payRef = (o) => `LB-${String(o.id).slice(4, 10).toUpperCase()}`;

/** Card orders: ant pastes the Stripe payment link here; the order page then shows a Pay button. */
function setPayLink(orderId, raw) {
  const url = String(raw || "").trim();
  if (url && !/^https:\/\/(buy|checkout|pay|invoice)\.stripe\.com\/[\w\-./?=&%#]+$/.test(url)) {
    throw userErr("Paste a Stripe link (https://buy.stripe.com/..., checkout.stripe.com or invoice.stripe.com).");
  }
  db.prepare("UPDATE orders SET pay_link = ? WHERE id = ? AND status = 'pending'").run(url || null, orderId);
  return getOrder(orderId);
}

function cancelOrder(orderId) {
  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'").run(orderId);
  return getOrder(orderId);
}

/**
 * Marks an order paid after ant confirms the money arrived (admin "Mark paid").
 * Idempotent: a second call changes nothing and returns { already: true }.
 * amountCents defaults to the order total; less than the total is refused.
 */
function markPaid({ orderId, txid, amountCents, paidAt }) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const o = orderId ? db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) : null;
    if (!o) { db.exec("ROLLBACK"); return { found: false }; }
    if (o.status !== "pending") { db.exec("ROLLBACK"); return { found: true, already: true, order: o }; }
    if (amountCents == null) amountCents = o.total_cents;
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
    if (o.box_id) {
      db.prepare("UPDATE boxes SET status = CASE WHEN status = 'cancelled' THEN status ELSE 'active' END, months_paid = months_paid + 1, last_paid_at = ? WHERE id = ?").run(now(), o.box_id);
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
          console.log(`[orders] PAID ${o.id} ${o.email} $${(o.total_cents / 100).toFixed(2)} via ${o.fulfillment} ref=${o.txid}`);
        } else if (j.kind === "order.placed") {
          const o = getOrder(p.orderId);
          if (o) {
            console.log(`[orders] NEW ${o.id} (${payRef(o)}) ${o.email} ${o.phone || ""} $${(o.total_cents / 100).toFixed(2)} pay=${o.pay_method} ${o.fulfillment}`);
            const msg = notify.orderMessage(o, payRef(o));
            notify.push({ ...msg, click: `${config.siteUrl}/admin` }).catch((e) => console.error("[notify] failed", o.id, e.message));
          }
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

module.exports = { priceBox, createBox, getBox, createBoxRenewal, priceCart, createOrder, getOrder, setPayLink, cancelOrder, payRef, markPaid, startWorker, subscribe, userErr, isEmail, normEmail };
