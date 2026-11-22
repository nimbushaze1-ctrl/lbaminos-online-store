# LB Aminos store

Online store for LB Aminos (research use only). Payments are manual: the customer picks Card, Zelle, Cash App or Venmo,
and you confirm each payment in /admin. No card data ever touches this site.
Node 22 + Express, SQLite (built into Node), server-rendered pages. One dependency.

## Run locally
    npm install
    cp .env.example .env   # fill in values, then:
    node --env-file=.env server.js     # http://localhost:3000
    npm test                           # self-check, no money moves

## Where things live
- `lib/catalog.js` — products and **prices (placeholders until confirmed)**. Only source of truth for checkout totals.
- `lib/coas.js` — add one row per tested lot; put PDFs in `public/coa/`.
- `lib/config.js` — shipping/pickup fees, discount percentages.
- `routes/checkout.js` — `POST /api/checkout` (validates, prices server-side, stores `pay_method`), `GET /api/order/:id`.
- `/order/:id` — order page with payment instructions for the chosen method and the memo code (`LB-XXXXXX`).
- `/admin` — orders, pickup requests, messages, referral credits (password = `ADMIN_PASSWORD`).

## Taking payment
- **Card:** create a Stripe payment link for the exact total (Stripe dashboard → Payment links), paste it into
  the order's "Paste Stripe link" box in /admin, and text the customer their order page. When Stripe shows it paid, press **Mark paid**.
- **Zelle / Cash App / Venmo:** the order page shows your handle, the amount and the memo code. When the money
  arrives with that code, press **Mark paid**. Mark paid issues the referral code and activates Lab Boxes.
- **Cancel** releases an unpaid order. New orders also appear in the logs as `[orders] NEW ...`.

## Deploy to Railway
1. New project → deploy this folder (GitHub repo or `railway up`).
2. Add a **Volume** mounted at `/data`, and set `DATA_DIR=/data` (otherwise orders are lost on redeploy).
3. Set variables from `.env.example`: `SITE_URL`, `ADMIN_PASSWORD`, `ZELLE_HANDLE`, `ZELLE_NAME`, `CASHAPP_HANDLE`,
   `VENMO_HANDLE`. Leave `CHECKOUT_ENABLED=false` until prices are real.
4. Generate a domain (or add `shop.lbaminos.com` as a custom domain) and set `SITE_URL` to it.
5. Set `CHECKOUT_ENABLED=true` and place a test order to check the instructions page.
