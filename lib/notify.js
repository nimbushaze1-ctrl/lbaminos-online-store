// Phone alerts for new orders via ntfy (https://ntfy.sh): free, no account.
// Install the ntfy app, subscribe to the topic in NTFY_TOPIC, and every new order pings your phone.
// Use a long random topic name: anyone who knows it can read the alerts.
const config = require("./config");

const money = (c) => `$${(c / 100).toFixed(2)}`;

function orderMessage(o, ref) {
  const pay = config.payments.methods[o.pay_method]?.label || o.pay_method || "?";
  const lines = o.items.map((i) => `• ${i.name} × ${i.qty}`).join("\n");
  const a = o.address || {};
  const where = o.fulfillment === "ship" || o.fulfillment === "delivery"
    ? `${o.fulfillment === "ship" ? "Ship" : "Deliver"} to ${[a.line1, a.city, a.zip].filter(Boolean).join(", ")}`
    : "Local pickup";
  return {
    title: `New order! ${money(o.total_cents)} · ${pay}`,
    body: [
      `${ref}${o.notes ? ` (${o.notes})` : ""}`,
      lines,
      `Total ${money(o.total_cents)} · pay by ${pay}`,
      where,
      [o.name, o.phone, o.email].filter(Boolean).join(" · "),
      o.pay_method === "card" ? "Next: send them a Stripe link from /admin." : `Next: watch for ${pay} with memo ${ref}.`,
    ].join("\n"),
  };
}

async function push({ title, body, click }) {
  const topic = (process.env.NTFY_TOPIC || "").trim();
  if (!topic) return false;
  const server = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/+$/, "");
  // JSON publish (POST to the server root with the topic in the body) keeps emoji and non-ASCII titles intact.
  const r = await fetch(`${server}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, title, message: body, priority: 4, tags: ["moneybag"], ...(click ? { click } : {}) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`ntfy HTTP ${r.status}`);
  return true;
}

module.exports = { orderMessage, push };
