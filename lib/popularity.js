// Product popularity: counts product-page views per day so the homepage can feature
// the most-viewed compounds. One view per visitor (IP) per product every 6 hours; bots ignored.
const { db } = require("./db");
const catalog = require("./catalog");

db.exec(`CREATE TABLE IF NOT EXISTS product_views (
  slug TEXT NOT NULL,
  day TEXT NOT NULL,            -- YYYY-MM-DD (UTC)
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, day)
)`);

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget|python|node-fetch|axios|headless|lighthouse|monitor|uptime/i;
const WINDOW_MS = 6 * 60 * 60 * 1000;
const MIN_TOTAL = 20;   // below this many views in the window, keep the hand-picked order
const DAYS = 30;
const seen = new Map(); // `${ip}|${slug}` -> last counted time

const bump = db.prepare(`INSERT INTO product_views (slug, day, views) VALUES (?, ?, 1)
  ON CONFLICT(slug, day) DO UPDATE SET views = views + 1`);
const totals = db.prepare(`SELECT slug, SUM(views) AS n FROM product_views WHERE day >= ? GROUP BY slug`);

function record(req, slug) {
  if (req.method !== "GET") return;
  const ua = String(req.get("user-agent") || "");
  if (!ua || BOT.test(ua)) return;
  const ip = String(req.ip || "");
  const key = `${ip}|${slug}`, t = Date.now();
  if (t - (seen.get(key) || 0) < WINDOW_MS) return;
  seen.set(key, t);
  if (seen.size > 50000) for (const [k, v] of seen) if (t - v > WINDOW_MS) seen.delete(k);
  bump.run(slug, new Date(t).toISOString().slice(0, 10));
}

function counts(days = DAYS) {
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  return new Map(totals.all(since).map((r) => [r.slug, Number(r.n)]));
}

// Products ordered by views in the last 30 days. Falls back to catalog order until there is enough data.
function ranked() {
  const c = counts();
  const total = [...c.values()].reduce((a, b) => a + b, 0);
  const base = catalog.PRODUCTS.map((p, i) => ({ p, i, n: c.get(p.slug) || 0 }));
  if (total < MIN_TOTAL) return { products: base.map((x) => x.p), byViews: false };
  base.sort((a, b) => b.n - a.n || a.i - b.i);
  return { products: base.map((x) => x.p), byViews: true };
}

module.exports = { record, counts, ranked };
