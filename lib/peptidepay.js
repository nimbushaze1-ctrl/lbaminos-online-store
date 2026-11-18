// PeptidePay integration. Server-side only: never import this from browser code.
// Endpoints used (and no others):
//   POST {base}/api/v1/checkout/init
//   GET  {base}/api/v1/sessions/{id}
//   POST {SITE_URL}/api/peptidepay-webhook   (incoming, handled in routes/payments.js)
const crypto = require("node:crypto");

const BASE = (process.env.PEPTIDEPAY_API_BASE || "https://peptide-pay.com").replace(/\/$/, "");
const SIG_TOLERANCE_SECONDS = 300;
const CURRENCIES = new Set(["EUR", "USD", "GBP", "CAD", "CHF", "AUD"]);

function apiKey() {
  const k = process.env.PEPTIDEPAY_API_KEY || "";
  return k.startsWith("sk_live_") ? k : ""; // sk_test_ keys only work on the simulator, so ignore them
}

function wallet() {
  const w = process.env.PEPTIDEPAY_WALLET || "";
  return /^0x[0-9a-fA-F]{40}$/.test(w) ? w : "";
}

// Diagnostics shown on /admin and at startup. Never returns secret values.
function configStatus() {
  const raw = process.env.PEPTIDEPAY_API_KEY || "";
  return {
    base: BASE,
    mode: apiKey() ? "api-key" : wallet() ? "wallet-only" : "not-configured",
    walletSet: Boolean(wallet()),
    walletInvalid: Boolean(process.env.PEPTIDEPAY_WALLET) && !wallet(),
    apiKeySet: Boolean(apiKey()),
    apiKeyIsTest: raw.startsWith("sk_test_"),
    webhookSecretSet: Boolean(process.env.PEPTIDEPAY_WEBHOOK_SECRET),
  };
}

// fetch that refuses to silently drop the Authorization header on a redirect.
// If PeptidePay redirects to another host of its own (e.g. apex -> www), we re-issue
// the request there once, with the same headers; any other redirect is an error.
async function ppFetch(url, init) {
  let res = await fetch(url, { ...init, redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    const next = loc ? new URL(loc, url) : null;
    if (!next || next.protocol !== "https:" || !/(^|\.)peptide-pay\.com$/.test(next.hostname)) {
      throw new Error(`PeptidePay redirected to an unexpected location (${loc}). Set PEPTIDEPAY_API_BASE.`);
    }
    console.warn(`[peptidepay] ${url} redirected to ${next.origin}; set PEPTIDEPAY_API_BASE=${next.origin} to skip this hop`);
    res = await fetch(next, { ...init, redirect: "manual" });
  }
  return res;
}

function headers(idempotencyKey) {
  const h = { "Content-Type": "application/json", Accept: "application/json" };
  if (apiKey()) h.Authorization = `Bearer ${apiKey()}`;
  if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
  return h;
}

/**
 * Create a hosted checkout session.
 * The amount must already be computed server-side from the catalog.
 * idempotencyKey: pass a stable value (we use the order id) so retries never double-create.
 */
async function createPeptidePaySession({ amountCents, currency, metadata, successUrl, cancelUrl, customerEmail, productName, webhookUrl, idempotencyKey }) {
  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 10_000_000) {
    throw new Error("amountCents must be an integer between 100 and 10,000,000");
  }
  if (!CURRENCIES.has(currency)) throw new Error(`Unsupported currency ${currency}`);
  if (metadata && Object.keys(metadata).length > 10) throw new Error("metadata allows at most 10 keys");

  const body = { amount_cents: amountCents, currency };
  // Header is the identity in API-key mode, so `wallet` is only sent in wallet-only mode.
  if (!apiKey()) {
    if (!wallet()) throw new Error("PeptidePay is not configured: set PEPTIDEPAY_WALLET or PEPTIDEPAY_API_KEY (sk_live_)");
    body.wallet = wallet();
  }
  if (customerEmail) body.customer_email = customerEmail;
  if (metadata) body.metadata = Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)]));
  if (successUrl) body.success_url = successUrl;
  if (cancelUrl) body.cancel_url = cancelUrl;
  if (productName) body.product_name = String(productName).slice(0, 80);
  if (webhookUrl) body.webhook_url = webhookUrl;

  const key = idempotencyKey || crypto.randomUUID();
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await ppFetch(`${BASE}/api/v1/checkout/init`, {
        method: "POST",
        headers: headers(key), // same Idempotency-Key on every retry
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = null; }
      if (res.ok && json && json.id && json.url) {
        return { id: json.id, url: json.url, status: json.status, expiresAt: json.expires_at };
      }
      const err = new Error(`PeptidePay checkout/init failed: HTTP ${res.status} ${text.slice(0, 300)}`);
      err.status = res.status;
      if (res.status < 500 && res.status !== 429) throw err; // client errors are not retried
      lastErr = err;
    } catch (e) {
      if (e.status && e.status < 500 && e.status !== 429) throw e;
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
  }
  throw lastErr;
}

/** Poll a session's status (webhook fallback). */
async function getPeptidePaySession(id) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("bad session id");
  const res = await ppFetch(`${BASE}/api/v1/sessions/${encodeURIComponent(id)}`, { method: "GET", headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(`PeptidePay sessions/${id} failed: HTTP ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function parseSignatureHeader(header) {
  const out = {};
  for (const part of String(header || "").split(",")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

/**
 * Verify `x-peptidepay-signature: t=<unix>,v1=<hex>` against the RAW body.
 * HMAC-SHA256(PEPTIDEPAY_WEBHOOK_SECRET, `${t}.${rawBody}`), timing-safe compare,
 * rejects timestamps more than 300s from now.
 */
function verifyPeptidePaySignature(rawBody, signature, { secret = process.env.PEPTIDEPAY_WEBHOOK_SECRET, nowSeconds = Math.floor(Date.now() / 1000) } = {}) {
  if (!secret || !signature || typeof rawBody !== "string") return false;
  const { t, v1 } = parseSignatureHeader(signature);
  if (!t || !v1 || !/^\d+$/.test(t) || !/^[0-9a-fA-F]+$/.test(v1)) return false;
  if (Math.abs(nowSeconds - Number(t)) > SIG_TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest("hex");
  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { createPeptidePaySession, getPeptidePaySession, verifyPeptidePaySignature, configStatus, parseSignatureHeader };
