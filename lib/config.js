// Store-wide settings. Money is in US cents. Values marked PLACEHOLDER need ant's sign-off.
const env = process.env;
// "$name" / "@name" with exactly one prefix, or "" when unset.
const tag = (v, prefix) => { const t = String(v || "").trim().replace(/^[$@]+/, ""); return t ? prefix + t : ""; };

module.exports = {
  siteUrl: (env.SITE_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/$/, ""),
  currency: "USD",
  checkoutEnabled: env.CHECKOUT_ENABLED === "true",
  brand: {
    name: "LB Aminos",
    city: "Long Beach, CA",
    email: env.CONTACT_EMAIL || "antwest2727@gmail.com",
    phone: env.CONTACT_PHONE || "(310) 810-2013",
  },
  fulfillment: {
    // PLACEHOLDER amounts
    pickup: { label: "Local pickup in Long Beach (by appointment)", feeCents: 0 },
    delivery: { label: "Local delivery (Long Beach area)", feeCents: 1000, freeOverCents: 15000 },
    ship: { label: "Shipping, USPS/UPS 2-day (US only)", feeCents: 1500, freeOverCents: 20000 },
  },
  discounts: {
    welcomePct: 10, // email signup, first order only
    referralPct: 10, // friend gets 10% off with a referral code
    referralCreditCents: 1000, // referrer earns store credit (tracked in admin)
  },
  minOrderCents: 100,
  // Manual payments: the customer picks a method at checkout and pays after the order is placed.
  // Card = ant sends a Stripe payment link by text/email. Handles come from Railway variables.
  payments: {
    order: ["card", "zelle", "cashapp", "venmo"],
    methods: {
      card: { label: "Card", blurb: "We text or email you a secure Stripe payment link." },
      zelle: { label: "Zelle", handle: (env.ZELLE_HANDLE || "").trim(), blurb: "Send from your bank app." },
      cashapp: { label: "Cash App", handle: tag(env.CASHAPP_HANDLE, "$"), blurb: "Send to our $cashtag." },
      venmo: { label: "Venmo", handle: tag(env.VENMO_HANDLE, "@"), blurb: "Send to our Venmo." },
    },
    zelleName: (env.ZELLE_NAME || "").trim(), // name the Zelle account shows, so buyers can confirm
    replyHours: Number(env.PAYMENT_REPLY_HOURS || 12),
  },
};
