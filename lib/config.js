// Store-wide settings. Money is in US cents. Values marked PLACEHOLDER need ant's sign-off.
const env = process.env;

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
  minOrderCents: 100, // PeptidePay minimum
};
