# LB Aminos store

Online store for LB Aminos (research use only), with PeptidePay hosted checkout.
Node 22 + Express, SQLite (built into Node), server-rendered pages. One dependency.

## Run locally
    npm install
    cp .env.example .env   # fill in values, then:
    node --env-file=.env server.js     # http://localhost:3000
    npm test                           # PeptidePay self-check (uses a local mock, no real payments)

## Where things live
- `lib/catalog.js` — products and **prices (placeholders until confirmed)**. Only source of truth for checkout totals.
- `lib/coas.js` — add one row per tested lot; put PDFs in `public/coa/`.
- `lib/config.js` — shipping/pickup fees, discount percentages.
- `lib/peptidepay.js` — `createPeptidePaySession`, `getPeptidePaySession`, `verifyPeptidePaySignature`.
- `routes/payments.js` — `POST /api/checkout`, `POST /api/peptidepay-webhook`, `GET /api/order/:id`.
- `/order/:id` — success page, polls every 3 s, "still processing" note after 90 s.
- `/admin` — orders, pickup requests, messages, referral credits (password = `ADMIN_PASSWORD`).

## Webhook security
- Signed webhooks (`x-peptidepay-signature`): raw body, 300 s replay window, HMAC-SHA256, `crypto.timingSafeEqual`. Bad → 401.
- Unsigned webhooks (PeptidePay's wallet-only mode sends these): the body is never trusted. The server
  asks PeptidePay's `GET /api/v1/sessions/{id}` for the real status and only marks paid if it says paid
  and the amount covers the order total.
- Idempotent on `session_id`: replays return 200 and change nothing.

## Deploy to Railway
1. New project → deploy this folder (GitHub repo or `railway up`).
2. Add a **Volume** mounted at `/data`, and set `DATA_DIR=/data` (otherwise orders are lost on redeploy).
3. Set variables from `.env.example`: `SITE_URL`, `PEPTIDEPAY_WALLET`, `PEPTIDEPAY_WEBHOOK_SECRET`,
   optional `PEPTIDEPAY_API_KEY` (sk_live_ only), `ADMIN_PASSWORD`. Leave `CHECKOUT_ENABLED=false` until prices are real.
4. Generate a domain (or add `shop.lbaminos.com` as a custom domain) and set `SITE_URL` to it.
5. In PeptidePay settings set the webhook URL to `https://<your-domain>/api/peptidepay-webhook` and press "Send test webhook".
6. Set `CHECKOUT_ENABLED=true`, run a $1 real payment and refund it to yourself.
