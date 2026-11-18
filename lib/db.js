// SQLite storage using Node's built-in driver (no native build step).
// On Railway, mount a volume and set DATA_DIR to its path so orders survive redeploys.
const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

const dir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(path.join(dir, "store.db"));

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | paid | fulfilled | cancelled
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  fulfillment TEXT NOT NULL,                     -- pickup | delivery | ship
  address TEXT,                                  -- JSON
  items TEXT NOT NULL,                           -- JSON, priced server-side
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  discount_code TEXT,
  session_id TEXT UNIQUE,
  session_url TEXT,
  txid TEXT,
  paid_amount_cents INTEGER,
  paid_at TEXT,
  last_poll_at INTEGER,
  referral_code TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS webhook_events (
  session_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  signed INTEGER NOT NULL,
  body TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  done_at TEXT
);
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  used_order TEXT
);
CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  owner_order TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS referral_uses (
  code TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  credited INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS pickup_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  preferred TEXT,
  order_id TEXT,
  note TEXT,
  handled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT, contact TEXT NOT NULL, topic TEXT, body TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0
);
`);

const now = () => new Date().toISOString();

module.exports = { db, now };
