// Server-rendered HTML. All copy is original to LB Aminos.
const catalog = require("./catalog");
const coas = require("./coas");
const config = require("./config");
const orders = require("./orders");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (c) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
const money2 = (c) => `$${(c / 100).toFixed(2)}`;
const B = config.brand;
const F = config.fulfillment;

const logo = (cls = "") => `<img class="logo ${cls}" src="/img/lb-aminos.svg" alt="LB Aminos" width="95" height="46">`;

const ICON = {
  flask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13l2 2 4-4"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/></svg>`,
};

function layout({ title, description, path = "/", body, jsonLd }) {
  const full = title ? `${title} · LB Aminos` : "LB Aminos · Research peptides, Long Beach CA";
  const desc = description || "Research-grade lyophilized peptides with lot-level certificates of analysis. Local pickup in Long Beach, CA and US shipping. For laboratory research use only.";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(config.siteUrl + path)}">
<meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="${esc(config.siteUrl + path)}">
<meta property="og:image" content="${esc(config.siteUrl)}/img/coastal-lineup.jpg">
<meta name="theme-color" content="#151515">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,800&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/styles.css?v=9">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${gate()}
<div class="ruo-bar">FOR LABORATORY RESEARCH USE ONLY · NOT FOR HUMAN OR VETERINARY USE</div>
<div class="promo-bar"><div class="wrap">${catalog.SALE.bogo ? `<b>Sale: buy one, get one 50% off any item</b> · ` : ""}Free US shipping over ${money(F.ship.freeOverCents)} · Same-day pickup in Long Beach by appointment · ${config.discounts.welcomePct}% off your first order with email signup</div></div>
<header class="site">
  <div class="wrap">
    <a class="brand" href="/" aria-label="LB Aminos home">${logo()}</a>
    <nav class="main" aria-label="Main">
      <a href="/shop">Shop</a><a href="/lab-box">Lab Box</a><a href="/coa">COA</a><a href="/research">Research</a><a href="/pickup">Pickup</a><a href="/help">Help</a>
    </nav>
    <div class="head-actions">
      <a class="cart-link" href="/cart" aria-label="Cart">${ICON.cart}<span class="cart-count" data-cart-count>0</span></a>
      <a class="btn btn-primary btn-sm hide-sm" href="/shop">Shop now</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" data-menu>Menu</button>
    </div>
  </div>
  <nav class="mobile-nav" id="mnav" hidden aria-label="Mobile">
    <a href="/shop">Shop all</a><a href="/lab-box">Build a Lab Box</a><a href="/coa">Certificates (COA)</a><a href="/research">Research library</a><a href="/pickup">Local pickup</a>
    <a href="/help">Help center</a><a href="/track">Track an order</a><a href="/cart">Cart</a><a href="/legal/research-use">Research-use policy</a>
  </nav>
</header>
<main id="main">${body}</main>
${footer()}
<div class="toast" role="status" aria-live="polite" hidden data-toast></div>
<script src="/app.js?v=3" defer></script>
</body></html>`;
}

function gate() {
  return `<div class="gate" data-gate hidden role="dialog" aria-modal="true" aria-labelledby="gate-title">
  <div class="gate-card">
    ${logo()}
    <h2 id="gate-title">Before you enter</h2>
    <p>LB Aminos sells peptides strictly for laboratory and in-vitro research. To continue, confirm that:</p>
    <ul><li>You are 21 years of age or older.</li><li>You are purchasing for legitimate research purposes only.</li><li>You will not use, or allow others to use, these products in humans or animals.</li></ul>
    <div class="row-btns"><button class="btn btn-primary" type="button" data-gate-yes>I confirm, enter</button><a class="btn btn-ghost" href="https://www.google.com">Leave</a></div>
  </div></div>`;
}

function footer() {
  return `<footer class="site-foot">
  <div class="wrap foot-grid">
    <div class="foot-brand">${logo()}<p>Research-grade peptides from ${esc(B.city)}, documented lot by lot.</p>
      <p class="mono small">${esc(B.email)}<br>${esc(B.phone)}</p>
      <p class="small muted">Pickup by appointment. No unsolicited sales calls.</p></div>
    <div><h4>Shop</h4><a href="/shop">All peptides</a><a href="/lab-box">Build a Lab Box</a><a href="/shop#boxes">Research boxes</a>${Object.entries(catalog.CATEGORIES).map(([k, c]) => `<a href="/shop?cat=${k}">${esc(c.name)}</a>`).join("")}<a href="/coa">Certificates (COA)</a><a href="/pickup">Local pickup</a></div>
    <div><h4>Learn</h4><a href="/about">About</a><a href="/research">Research library</a><a href="/learn/peptide-basics">Peptide fundamentals</a><a href="/learn/handling-storage">Handling &amp; storage</a><a href="/learn/reading-a-coa">Reading a COA</a></div>
    <div><h4>Help</h4><a href="/help">Help center &amp; FAQ</a><a href="/track">Track an order</a><a href="/contact">Contact us</a><a href="/shipping">Shipping</a><a href="/refunds">Returns &amp; refunds</a><a href="/referral">Referral program</a></div>
    <div><h4>Legal</h4><a href="/legal/terms">Terms</a><a href="/legal/privacy">Privacy</a><a href="/legal/research-use">Research-use policy</a><a href="/legal/disclaimer">Disclaimer</a></div>
  </div>
  <div class="wrap foot-legal">
    <p>All products sold by LB Aminos are intended for laboratory research use only. They are not drugs, supplements, foods or cosmetics, are not for human or veterinary use, and are not intended to diagnose, treat, cure or prevent any disease. Statements on this site have not been evaluated by the FDA. Buyers must be 21 or older.</p>
    <p class="mono small">© ${new Date().getFullYear()} LB Aminos · ${esc(B.city)} · Pay by card, Zelle, Cash App or Venmo</p>
  </div>
</footer>`;
}

// ---------- components ----------
function priceFrom(p) {
  const v = p.variants.find((x) => x.inStock) || p.variants[0];
  return v;
}
function samplePill(v) {
  return catalog.PRICES_CONFIRMED && !(v && v.placeholder) ? "" : `<span class="pill pill-warn" title="Placeholder price until launch">Sample price</span>`;
}
function perMg(v, cents = v.priceCents) {
  const mg = catalog.mgOf(v);
  return mg ? `${money2(cents / mg)}/mg` : "";
}
function purityOf(p) {
  const rows = coas.filter((c) => c.slug === p.slug);
  return rows.length ? rows[rows.length - 1].purity : null;
}

function productCard(p) {
  const v = priceFrom(p);
  const pur = purityOf(p);
  return `<article class="card" style="--pc:${p.color}">
    <a class="card-img" href="/product/${p.slug}"><img src="${v.img}" alt="${esc(p.name)} ${esc(v.size)} research vial" loading="lazy" width="600" height="900"></a>
    <div class="card-body">
      <h3><a href="/product/${p.slug}">${esc(p.name)}</a> <span class="muted">${p.variants.length > 1 ? esc(p.variants.map((x) => x.size.replace(" mg", "")).join(" / ") + " mg") : esc(v.size)}</span></h3>
      <p class="mono small muted">${pur ? `HPLC ${esc(pur)}` : "Lot COA pending"} · ${v.inStock ? `<span class="in">In stock</span>` : "Out of stock"}</p>
      <div class="card-price">${p.variants.length > 1 ? `<span class="small muted">From</span> <b>${money2(Math.min(...p.variants.map((x) => x.priceCents)))}</b>` : `<b>${money2(v.priceCents)}</b> <span class="mono small muted">${perMg(v)}</span>`} ${samplePill(v)}</div>
      <div class="card-actions">
        <a class="btn btn-ghost btn-sm" href="/product/${p.slug}">Details</a>
        <button class="btn btn-primary btn-sm" type="button" data-add="${v.sku}" ${v.inStock ? "" : "disabled"}>Add to cart</button>
      </div>
    </div></article>`;
}

function sectionHead(eyebrow, h, p, extra = "") {
  return `<div class="section-head"><div>${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<h2>${h}</h2>${p ? `<p>${p}</p>` : ""}</div>${extra}</div>`;
}

const FAQ = [
  ["What does “research use only” mean?", "Every product we sell is intended solely for in-vitro laboratory research and analytical use. Nothing here is a drug, supplement, food or cosmetic, and nothing is intended to diagnose, treat, cure or prevent any condition. Products are not for human or animal use of any kind."],
  ["Do you give dosing or preparation instructions?", "No. We don’t provide dosing, administration or preparation guidance for any purpose, and we decline orders that mention human or animal use. Researchers should follow their own protocols and the published literature."],
  ["How do I know the vial matches the report?", "Each vial carries a lot number. Find that lot in our COA library and check the purity, identity and measured content on the report. Each report includes a code you can check with the testing lab directly."],
  ["How do I pay?", "Place your order and choose card, Zelle, Cash App or Venmo. Your order page shows exactly what to send and the code to put in the memo. For card, we text or email you a secure Stripe payment link. We never see or store your card details."],
  ["How does local pickup work?", "Choose “Local pickup” at checkout. Once your payment arrives we text or email you to set a time, usually same day. Bring your order number; we confirm lot numbers at handoff."],
  ["How fast do you ship?", `Paid orders ship within one business day by 2-day service. Shipping is ${money(F.ship.feeCents)}, free over ${money(F.ship.freeOverCents)}. US addresses only for now.`],
  ["Do you offer bulk pricing?", "Yes. The per-vial price drops automatically at 3, 5 and 10 vials of the same item. The 10-vial research box carries the deepest discount."],
  ["Who can buy?", "Adults 21 and over purchasing for legitimate research. We may cancel and refund any order at our discretion."],
];

function faqList(items = FAQ) {
  return `<div class="faq-list">${items.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;
}

function emailSignup() {
  return `<section class="block signup"><div class="wrap signup-grid">
    <div><span class="eyebrow">Members</span><h2>${config.discounts.welcomePct}% off your first order</h2><p>Join the list for restock alerts and new lot reports. Your welcome code arrives right here on screen, tied to your email.</p></div>
    <form class="inline-form" data-subscribe>
      <label class="sr" for="sub-email">Email</label>
      <input id="sub-email" type="email" name="email" placeholder="you@lab.org" required autocomplete="email">
      <button class="btn btn-primary" type="submit">Get my code</button>
      <p class="form-msg" data-msg aria-live="polite"></p>
    </form></div></section>`;
}

function referralBlock() {
  return `<section class="block"><div class="wrap two-col">
    <div><span class="eyebrow">Referral program</span><h2>Give ${config.discounts.referralPct}%, get ${money(config.discounts.referralCreditCents)}</h2>
    <p>Every paid order comes with a personal referral code on its confirmation page. A colleague who uses it saves ${config.discounts.referralPct}% on their order, and you earn ${money(config.discounts.referralCreditCents)} in store credit once it’s paid.</p>
    <a class="btn btn-ghost" href="/referral">How it works</a></div>
    <ol class="flow"><li><b>01</b><span>Place an order and find your code on the confirmation page.</span></li><li><b>02</b><span>Share it with a colleague.</span></li><li><b>03</b><span>They save ${config.discounts.referralPct}% at checkout.</span></li><li><b>04</b><span>You get ${money(config.discounts.referralCreditCents)} credit toward your next order.</span></li></ol>
  </div></section>`;
}

function coaGuide() {
  return `<ol class="steps">
    <li><h3>Match the lot</h3><p>The lot number printed on your vial must match the report exactly. One lot, one report.</p></li>
    <li><h3>Check purity</h3><p>HPLC purity is the share of the sample that is the target peptide, read from the main chromatogram peak.</p></li>
    <li><h3>Confirm identity</h3><p>Mass spectrometry confirms the measured molecular mass matches the expected mass for the sequence.</p></li>
    <li><h3>Verify with the lab</h3><p>Use the verification code on the report to confirm with the testing lab that it is genuine and unaltered.</p></li>
  </ol>`;
}

function trustBadges() {
  return `<ul class="trust">
    <li>${ICON.flask}<div><b>Third-party tested</b><span>HPLC purity and MS identity from an independent lab</span></div></li>
    <li>${ICON.doc}<div><b>A COA for every lot</b><span>Lot on the vial matches the published report</span></div></li>
    <li>${ICON.snow}<div><b>Cold-stored, sealed</b><span>Kept at −20 °C in flip-off sealed vials</span></div></li>
    <li>${ICON.shield}<div><b>Flexible payment</b><span>Card via Stripe, Zelle, Cash App or Venmo</span></div></li>
  </ul>`;
}

function pickupCard() {
  return `<div class="pickup-card">
    <div class="pc-head">${ICON.pin}<div><b>Long Beach counter</b><span class="muted small">Exact address sent with your confirmed appointment</span></div></div>
    <dl class="hours"><dt>Mon–Fri</dt><dd>10 am – 7 pm</dd><dt>Sat</dt><dd>11 am – 5 pm</dd><dt>Sun</dt><dd>By request</dd></dl>
    <p class="small muted">Hours are a placeholder until confirmed.</p>
    <div class="row-btns"><a class="btn btn-primary btn-sm" href="/pickup">Book a pickup</a><a class="btn btn-ghost btn-sm" href="tel:${B.phone.replace(/\D/g, "")}">${esc(B.phone)}</a></div>
  </div>`;
}

// ---------- pages ----------
function home() {
  const featured = require("./popularity").ranked();
  const body = `
  <section class="hero"><div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">Long Beach, California</span>
      <h1>Research<br>compounds.</h1>
      <p class="lede">Explore the LB Aminos catalog of lyophilized research compounds. Shop online for US shipping or pickup by appointment in Long Beach.</p>
      <div class="ctas"><a class="btn btn-primary" href="/shop">Shop the catalog <span aria-hidden="true">↗</span></a><a class="btn btn-ghost" href="/coa">View lot reports</a></div>
    </div>
    <figure class="hero-art">
      <img src="/img/coastal-lineup.jpg" srcset="/img/coastal-lineup-small.jpg 840w, /img/coastal-lineup.jpg 1536w" sizes="(max-width: 800px) 100vw, 60vw" alt="LB Aminos Retatrutide, Tirzepatide, KLOW, NAD+ and MOTS-C vials together on sunlit travertine" width="1536" height="1024" fetchpriority="high">
      <figcaption>Packaging illustration</figcaption>
    </figure>
  </div></section>

  <div class="store-links"><div class="wrap">
    <a href="/coa">${ICON.doc}<span>Certificates of analysis</span></a>
    <a href="/pickup">${ICON.pin}<span>Long Beach pickup</span></a>
    <a href="/shipping">${ICON.truck}<span>US shipping</span></a>
  </div></div>

  <section class="block featured"><div class="wrap">
    ${sectionHead("", "Featured compounds", featured.byViews ? "Our most-viewed compounds this month." : "", `<a class="btn btn-ghost btn-sm" href="/shop">Shop all compounds <span aria-hidden="true">↗</span></a>`)}
    <div class="grid">${featured.products.slice(0, 8).map(productCard).join("")}</div>
  </div></section>

  <section class="block box-promo"><div class="wrap two-col">
    <div><span class="eyebrow">Monthly Lab Box</span><h2>Pick any ${catalog.BOX.slots}. Save ${catalog.BOX.pct}% every month.</h2>
      <p>Choose ${catalog.BOX.slots} compounds and we pack them into one box each month at ${catalog.BOX.pct}% off list, with free delivery or shipping. ${catalog.BOX.months} months to start, then change or cancel anytime.</p>
      <a class="btn btn-primary" href="/lab-box">Build your Lab Box</a></div>
    <ul class="box-facts"><li><b>${catalog.BOX.pct}%</b><span>off list price, every month</span></li><li><b>Free</b><span>delivery or 2-day shipping</span></li><li><b>COA</b><span>on every lot in the box</span></li><li><b>${catalog.BOX.months} mo</b><span>minimum, then cancel anytime</span></li></ul>
  </div></section>

  <section class="block alt" id="boxes"><div class="wrap two-col">
    <div><span class="eyebrow">Bulk pricing</span><h2>Research boxes save up to 15%</h2><p>Buy more of the same compound and the per-vial price drops automatically in your cart. No codes needed.</p></div>
    <table class="tiers"><thead><tr><th>Quantity</th><th>Per-vial discount</th></tr></thead><tbody>
      ${[...catalog.QTY_TIERS].reverse().map((t) => `<tr><td>${t.min === 1 ? "1–2 vials" : t.min === 3 ? "3–4 vials" : t.min === 5 ? "5–9 vials" : "10+ (research box)"}</td><td class="mono">${t.pct ? `−${t.pct}%` : "List price"}</td></tr>`).join("")}
    </tbody></table>
  </div></section>

  <section class="block"><div class="wrap two-col">
    <div><span class="eyebrow">Local pickup</span><h2>Pick up today in Long Beach</h2>
      <p>Order online, choose local pickup, and we’ll confirm a time by text or email. Most orders are ready the same day.</p>
      <div class="qa"><h3>Is this legit?</h3><p>Every lot we sell has an independent lab report you can check against the vial in your hand before you leave.</p>
      <h3>Who tests the peptides?</h3><p>Independent analytical labs run HPLC purity and mass-spec identity. The lab, date and verification code are printed on each report.</p></div>
    </div>${pickupCard()}
  </div></section>

  ${emailSignup()}

  ${referralBlock()}

  <section class="block alt"><div class="wrap">
    ${sectionHead("Quality", "How to read a COA in four steps", "")}${coaGuide()}
  </div></section>

  <section class="block"><div class="wrap faq-grid">
    <div>${sectionHead("FAQ", "Straight answers", "Anything else? <a href=\"/contact\">Send us a message</a>.")}</div>${faqList()}
  </div></section>

  <section class="block alt"><div class="wrap">${trustBadges()}</div></section>

  <section class="block"><div class="wrap">
    ${sectionHead("Research areas", "Browse by research area", "")}
    <div class="areas">${Object.entries(catalog.CATEGORIES).map(([k, c]) => {
      const n = catalog.PRODUCTS.filter((p) => p.cat === k).length;
      return `<a class="area" href="/shop?cat=${k}"><b>${esc(c.name)}</b><span>${esc(c.blurb)}</span><em class="mono">${n} compound${n === 1 ? "" : "s"}</em></a>`;
    }).join("")}</div>
  </div></section>

  <section class="block alt"><div class="wrap">
    ${sectionHead("Learn", "About peptides", "")}
    <div class="learn-cards">
      <a href="/learn/peptide-basics"><b>Peptide fundamentals</b><span>What peptides are, how they’re made and why purity matters.</span></a>
      <a href="/learn/handling-storage"><b>Handling &amp; storage</b><span>Keeping lyophilized material stable from delivery to bench.</span></a>
      <a href="/learn/reading-a-coa"><b>Reading a COA</b><span>Purity, identity, content and verification codes explained.</span></a>
    </div>
  </div></section>

  <section class="block"><div class="wrap founder">
    ${logo("big")}
    <div><span class="eyebrow">From the founder</span><h2>Why LB Aminos</h2>
    <p>We started LB Aminos in Long Beach because researchers deserve to know exactly what is in the vial. That means an independent report for every lot, honest labeling, and someone local you can actually talk to. We’re building this one verified lot at a time.</p></div>
  </div></section>`;
  return layout({
    path: "/", body,
    jsonLd: { "@context": "https://schema.org", "@type": "Store", name: "LB Aminos", url: config.siteUrl, email: B.email, telephone: B.phone, address: { "@type": "PostalAddress", addressLocality: "Long Beach", addressRegion: "CA", addressCountry: "US" } },
  });
}

function shop(cat) {
  const list = cat && catalog.CATEGORIES[cat] ? catalog.PRODUCTS.filter((p) => p.cat === cat) : catalog.PRODUCTS;
  const chips = [`<a class="chip ${!cat ? "on" : ""}" href="/shop">All</a>`, ...Object.entries(catalog.CATEGORIES).map(([k, c]) => `<a class="chip ${cat === k ? "on" : ""}" href="/shop?cat=${k}">${esc(c.name)}</a>`)].join("");
  const body = `<section class="block shop"><div class="wrap">
    ${sectionHead("Shop", cat && catalog.CATEGORIES[cat] ? esc(catalog.CATEGORIES[cat].name) : "All research peptides", `${list.length} compound${list.length === 1 ? "" : "s"}. Every lot ships with a published COA.`)}
    <div class="chips">${chips}</div>
    <div class="grid">${list.map(productCard).join("")}</div>
    <div class="note-box" id="boxes"><b>Bulk pricing:</b> per-vial prices drop ${catalog.QTY_TIERS.filter((t) => t.pct).reverse().map((t) => `${t.pct}% at ${t.min}+`).join(", ")} vials of the same item, applied automatically.</div>
  </div></section>`;
  return layout({ title: "Shop research peptides", path: "/shop", body });
}

function product(p) {
  const v = priceFrom(p);
  const lots = coas.filter((c) => c.slug === p.slug);
  const tiers = [...catalog.QTY_TIERS].reverse().map((t) => {
    const lp = catalog.linePrice(v, t.min);
    return `<button type="button" class="tier" data-tier="${t.min}"><b>${t.min === 10 ? "10-vial box" : t.min === 1 ? "1 vial" : `${t.min} vials`}</b><span data-tier-unit>${money2(lp.unitCents)}/vial</span><em data-tier-label>${lp.label || "List price"}</em></button>`;
  }).join("");
  const tiersHtml = catalog.SALE.bogo ? tiers.replace('<button type="button" class="tier" data-tier="3"', `<button type="button" class="tier" data-tier="2"><b>2 vials</b><span data-tier-unit>${money2(catalog.linePrice(v, 2).unitCents)}/vial</span><em data-tier-label>BOGO 50%</em></button><button type="button" class="tier" data-tier="3"`) : tiers;
  const body = `<section class="block pdp" style="--pc:${p.color}"><div class="wrap">
    <nav class="crumbs small"><a href="/shop">Shop</a> / <a href="/shop?cat=${p.cat}">${esc(catalog.CATEGORIES[p.cat].name)}</a> / ${esc(p.name)}</nav>
    <div class="pdp-grid">
      <figure class="pdp-img"><img src="${v.img}" alt="${esc(p.name)} ${esc(v.size)} research vial" width="600" height="900" data-pdp-img><figcaption>Packaging illustration</figcaption></figure>
      <div class="pdp-info">
        <div class="card-tags">${p.bestSeller ? `<span class="pill pill-dark">Best seller</span>` : ""}<span class="pill" data-dot style="--pc:${p.color}">${esc(catalog.CATEGORIES[p.cat].name)}</span>${v.inStock ? `<span class="pill pill-ok">In stock</span>` : `<span class="pill">Out of stock</span>`}</div>
        <h1>${esc(p.name)} <span class="muted" data-size-label>${esc(v.size)}</span></h1>
        <p class="muted">${esc(p.cls)}</p>
        <div class="pdp-price"><b data-price>${money2(v.priceCents)}</b><span class="mono muted" data-permg>${perMg(v)}</span>${samplePill(v)}</div>
        ${p.variants.length > 1 ? `<div class="sizes" role="radiogroup" aria-label="Size"><span class="sizes-label">Size</span>${p.variants.map((x) => `<button type="button" role="radio" class="size ${x.sku === v.sku ? "on" : ""}" aria-checked="${x.sku === v.sku}" data-variant="${x.sku}" data-unit="${x.priceCents}" data-mg="${catalog.mgOf(x) || ""}" data-size="${esc(x.size)}" data-img="${x.img}" data-img-alt="${esc(p.name)} ${esc(x.size)} research vial" data-stock="${x.inStock ? 1 : 0}"><b>${esc(x.size)}</b><span>${money2(x.priceCents)}</span>${x.inStock ? "" : "<em>Sold out</em>"}</button>`).join("")}</div>` : ""}
        ${catalog.SALE.bogo ? `<div class="sale-note"><b>Sale:</b> buy one, get the second 50% off. Applied automatically to any item.</div>` : ""}
        <div class="tiers-pick" role="group" aria-label="Quantity pricing">${tiersHtml}</div>
        <form class="buy" method="post" action="/api/checkout" data-buy data-sku="${v.sku}" data-unit="${v.priceCents}" data-mg="${catalog.mgOf(v) || ""}">
          <input type="hidden" name="product_slug" value="${p.slug}"><input type="hidden" name="sku" value="${v.sku}">
          <label class="qty"><span class="sr">Quantity</span><button type="button" data-step="-1" aria-label="Fewer">−</button><input name="quantity" type="number" min="1" max="50" value="1" inputmode="numeric"><button type="button" data-step="1" aria-label="More">+</button></label>
          <button class="btn btn-ghost" type="button" data-add-qty data-needs-stock ${v.inStock ? "" : "disabled"}>Add to cart</button>
          <button class="btn btn-primary" type="submit" data-needs-stock ${v.inStock ? "" : "disabled"}>Buy now</button>
        </form>
        <p class="secured small">${ICON.shield}<span>Pay by card (secure Stripe link), Zelle, Cash App or Venmo</span></p>
        <ul class="mini-trust small"><li>${ICON.pin}Same-day Long Beach pickup</li><li>${ICON.truck}Free US shipping over ${money(F.ship.freeOverCents)}</li><li>${ICON.doc}${lots.length ? `${lots.length} lot report${lots.length > 1 ? "s" : ""} published` : "Lot COA posts before release"}</li></ul>
        <div class="ruo-box small"><b>Research use only.</b> Not for human or veterinary use. Not a drug, food, supplement or cosmetic. No dosing or preparation guidance is provided. Buyer must be 21+.</div>
      </div>
    </div>

    <section class="pdp-details" aria-label="Product details">
      <div><h2>${p.researchFindings ? "What is Retatrutide (LY3437943)?" : `About ${esc(p.name)}`}</h2><p>${esc(p.overview)}</p>
        ${p.comp ? `<h3>Blend composition (per vial)</h3><table class="spec">${p.comp.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table>` : ""}
        ${p.researchFindings ? `<h3>Key research applications</h3>
          <p class="small muted">These studies evaluated investigational retatrutide in controlled research settings.</p>
          <ul>${p.researchFindings.map(({ topic, finding, sources }) => `<li><p><strong>${esc(topic)}.</strong> ${esc(finding)} ${sources.map(([name, url]) => `<a href="${esc(url)}">${esc(name)}</a>`).join(" · ")}</p></li>`).join("")}</ul>` : ""}
        <h3>What researchers study</h3><ul>${p.research.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
        ${p.refs.length ? `<h3>Selected references</h3><ul class="refs small">${p.refs.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
        <p class="small muted">Literature is cited for scientific context only and does not imply any product claim.</p>
      </div>
      <div><h2>Vial specifications</h2><table class="spec"><tr><td>Available sizes</td><td>${p.variants.map((variant) => esc(variant.size)).join(", ")}</td></tr>${p.spec.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}<tr><td>Storage</td><td>−20 °C, dry, protected from light</td></tr></table>
        <h2 style="margin-top:2rem">Certificates of analysis</h2>
        ${lots.length ? `<table class="spec">${lots.map((c) => `<tr><td>${esc(c.lot)}</td><td>${esc(c.purity)} · ${esc(c.lab)} · ${c.file ? `<a href="/coa/${esc(c.file)}">PDF</a>` : ""}</td></tr>`).join("")}</table>` : `<p class="muted">The independent report for the current lot will be posted here before release.</p>`}
      </div>
    </section>
  </div></section>`;
  return layout({
    title: `${p.name} ${v.size}`, path: `/product/${p.slug}`,
    description: `${p.name} ${v.size}, ${p.cls}. Lot-level COA, Long Beach pickup and US shipping. Research use only.`,
    body,
    jsonLd: { "@context": "https://schema.org", "@type": "Product", name: `${p.name} ${v.size}`, sku: v.sku, image: config.siteUrl + v.img, description: p.overview, brand: { "@type": "Brand", name: "LB Aminos" },
      offers: { "@type": "Offer", priceCurrency: "USD", price: (v.priceCents / 100).toFixed(2), availability: v.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${config.siteUrl}/product/${p.slug}` } },
  });
}

function payPicker(prefix) {
  const P = config.payments;
  return `<fieldset class="pay-methods"><legend>How would you like to pay?</legend>${P.order.map((k, i) => `<label class="radio"><input type="radio" name="pay_method" value="${k}" ${i === 0 ? "checked" : ""}><span><b>${esc(P.methods[k].label)}</b><em class="small muted">${esc(P.methods[k].blurb)}</em></span></label>`).join("")}</fieldset>
    <p class="small muted">You’ll get payment instructions right after you place your order. Nothing is charged now.</p>`;
}

function cart() {
  const ff = Object.entries(F).map(([k, f], i) => `<label class="radio"><input type="radio" name="fulfillment" value="${k}" ${i === 0 ? "checked" : ""}><span><b>${esc(f.label)}</b><em class="small muted">${f.feeCents ? `${money(f.feeCents)}${f.freeOverCents ? `, free over ${money(f.freeOverCents)}` : ""}` : "Free"}</em></span></label>`).join("");
  const body = `<section class="block"><div class="wrap">
    ${sectionHead("Cart", "Your cart", "")}
    ${config.checkoutEnabled ? "" : `<div class="note-box warn">Online ordering opens soon. You can still build a cart and contact us at ${esc(B.phone)} to order for pickup.</div>`}
    <div class="cart-grid">
      <div><div data-cart-lines class="cart-lines"><p class="muted">Loading…</p></div></div>
      <form class="checkout" data-checkout novalidate>
        <h3>Checkout</h3>
        <fieldset><legend>How would you like it?</legend>${ff}</fieldset>
        <div class="addr" data-addr hidden>
          <div class="field"><label for="a1">Address</label><input id="a1" name="line1" autocomplete="address-line1"></div>
          <div class="field"><label for="a2">Apt, suite <span class="muted">(optional)</span></label><input id="a2" name="line2" autocomplete="address-line2"></div>
          <div class="three"><div class="field"><label for="ac">City</label><input id="ac" name="city" autocomplete="address-level2"></div><div class="field"><label for="as">State</label><input id="as" name="state" autocomplete="address-level1" value="CA"></div><div class="field"><label for="az">ZIP</label><input id="az" name="zip" autocomplete="postal-code" inputmode="numeric"></div></div>
        </div>
        <div class="two"><div class="field"><label for="ce">Email</label><input id="ce" name="email" type="email" required autocomplete="email"></div><div class="field"><label for="cp">Phone <span class="muted">(for payment link &amp; pickup)</span></label><input id="cp" name="phone" type="tel" autocomplete="tel"></div></div>
        <div class="field"><label for="cn">Name</label><input id="cn" name="name" autocomplete="name"></div>
        <div class="field"><label for="cd">Discount or referral code</label><div class="inline"><input id="cd" name="discount_code" autocomplete="off"><button type="button" class="btn btn-ghost btn-sm" data-apply>Apply</button></div></div>
        <dl class="totals" data-totals></dl>
        ${payPicker("c")}
        <label class="attest"><input type="checkbox" name="attest" required><span>I am 21 or older and I’m buying these products for laboratory research only, not for human or animal use. I agree to the <a href="/legal/terms">terms</a> and <a href="/legal/research-use">research-use policy</a>.</span></label>
        <button class="btn btn-primary btn-block" type="submit" ${config.checkoutEnabled ? "" : "disabled"}>Place order</button>
        <p class="form-msg" data-msg aria-live="polite"></p>
        <p class="secured small">${ICON.shield}<span>We never ask for card details on this site. Card payments go through a secure Stripe link we send you.</span></p>
      </form>
    </div>
  </div></section>`;
  return layout({ title: "Cart", path: "/cart", body });
}

function labBox() {
  const B2 = catalog.BOX;
  const cards = catalog.PRODUCTS.map((p) => {
    const def = p.variants.find((x) => x.inStock) || p.variants[0];
    return `<article class="bx-card" style="--pc:${p.color}" data-bx-product="${p.slug}">
      <div class="bx-img"><img src="${def.img}" alt="${esc(p.name)} ${esc(def.size)} research vial" loading="lazy" data-bx-img width="600" height="900"></div>
      <div class="bx-body"><h3>${esc(p.name)}</h3>
        <div class="bx-sizes">${p.variants.map((v) => `<button type="button" class="bx-size ${v.sku === def.sku ? "on" : ""}" data-bx-size="${v.sku}" ${v.inStock ? "" : "disabled"}><span>${esc(v.size)}</span><b>${money2(Math.round((v.priceCents * (100 - B2.pct)) / 100))}</b></button>`).join("")}</div>
        <p class="bx-price"><b data-bx-price>${money2(Math.round((def.priceCents * (100 - B2.pct)) / 100))}</b> <s class="muted small" data-bx-list>${money2(def.priceCents)}</s> <span class="small muted">in box</span></p>
        <button type="button" class="btn btn-primary btn-sm btn-block" data-bx-add="${def.sku}" ${def.inStock ? "" : "disabled"}>+ Add to box</button>
      </div></article>`;
  }).join("");
  const ff = Object.entries(F).map(([k, f], i) => `<label class="radio"><input type="radio" name="fulfillment" value="${k}" ${i === 0 ? "checked" : ""}><span><b>${esc(f.label)}</b><em class="small muted">Free with a Lab Box</em></span></label>`).join("");
  const body = `<section class="block bx"><div class="wrap">
    <span class="eyebrow">Monthly Lab Box</span>
    <h1>Build your Lab Box</h1>
    <p class="lede muted">Pick any ${B2.slots} research compounds. We pack them into one box every month at ${B2.pct}% off list, invoiced monthly, with free pickup, local delivery or 2-day shipping. ${B2.months} months to start, then swap compounds or cancel anytime.</p>
    <ul class="bx-facts"><li class="f1"><b>${B2.pct}%</b><span>off list price, every month</span></li><li class="f2"><b>Free</b><span>${esc(catalog.BOX_BUNDLE.name.toLowerCase())} in every box, plus free delivery</span></li><li class="f3"><b>COA</b><span>independent report on every lot</span></li><li class="f4"><b>${B2.months} months</b><span>to start, then cancel anytime</span></li></ul>
    ${config.checkoutEnabled ? "" : `<div class="note-box warn">Lab Box ordering opens with the rest of the store. You can plan your box now.</div>`}
    <div class="bx-grid">
      <div><input class="search bx-search" type="search" placeholder="Search compounds" data-bx-search aria-label="Search compounds"><div class="bx-cards">${cards}</div></div>
      <aside class="bx-panel">
        <form data-bx-form novalidate>
          <h3>Your box <span class="small muted" data-bx-count>0 of ${B2.slots} selected</span></h3>
          <ol class="bx-slots" data-bx-slots>${Array.from({ length: B2.slots }, (_, i) => `<li class="empty"><span>${i + 1}</span><em>${i === 0 ? "Select your first compound" : "Empty slot"}</em></li>`).join("")}</ol>
          <div class="bx-bundle"><div><b>${esc(catalog.BOX_BUNDLE.name)}</b><span>Included in every box</span></div><div><b>Free</b><s>${money2(catalog.BOX_BUNDLE.listCents)}</s></div></div>
          <div class="bx-months"><span>Month 1</span><span>Month 2</span><span>Month 3</span><span class="more">4+</span></div>
          <p class="small muted">${B2.months} monthly boxes to start, invoiced month by month. Change your compounds anytime after the first box ships. Cancel anytime after month ${B2.months}. Paid invoices are non-refundable once packed.</p>
          <dl class="totals" data-bx-totals></dl>
          <div data-bx-checkout hidden>
            <fieldset><legend>How would you like it?</legend>${ff}</fieldset>
            <div class="addr" data-addr hidden>
              <div class="field"><label for="ba1">Address</label><input id="ba1" name="line1" autocomplete="address-line1"></div>
              <div class="three"><div class="field"><label for="bac">City</label><input id="bac" name="city" autocomplete="address-level2"></div><div class="field"><label for="bas">State</label><input id="bas" name="state" value="CA"></div><div class="field"><label for="baz">ZIP</label><input id="baz" name="zip" inputmode="numeric"></div></div>
            </div>
            <div class="field"><label for="be">Email</label><input id="be" name="email" type="email" autocomplete="email" required></div>
            <div class="two"><div class="field"><label for="bn">Name</label><input id="bn" name="name" autocomplete="name"></div><div class="field"><label for="bp">Phone</label><input id="bp" name="phone" type="tel" autocomplete="tel"></div></div>
            ${payPicker("b")}
            <label class="attest"><input type="checkbox" name="box_terms"><span>I agree to ${B2.months} monthly boxes, invoiced each month, and can cancel after month ${B2.months}.</span></label>
            <label class="attest"><input type="checkbox" name="attest"><span>I am 21 or older and buying for laboratory research only, not for human or animal use. I agree to the <a href="/legal/terms">terms</a> and <a href="/legal/research-use">research-use policy</a>.</span></label>
          </div>
          <button class="btn btn-primary btn-block" type="submit" data-bx-submit disabled>Add ${B2.slots} compounds to start</button>
          <p class="form-msg" data-msg aria-live="polite"></p>
          <p class="secured small">${ICON.shield}<span>Month 1 is paid after you order, using the method you pick. We send payment instructions for each following month.</span></p>
        </form>
      </aside>
    </div>
  </div></section>`;
  return layout({ title: "Build your Lab Box", path: "/lab-box", description: `Pick any ${B2.slots} research compounds and save ${B2.pct}% every month with the LB Aminos Lab Box.`, body });
}

function payInstructions(o) {
  const P = config.payments;
  const m = P.methods[o.pay_method];
  const ref = orders.payRef(o);
  const amt = money2(o.total_cents);
  const memo = `<p class="small">Put <b class="mono">${esc(ref)}</b> in the memo, and nothing else. That’s how we match your payment to your order.</p>`;
  const later = `<p class="small muted">We’ll text or email you our ${m ? esc(m.label) : ""} details within ${P.replyHours} hours. You can also reach us at ${esc(B.phone)}.</p>`;
  if (!m) return `<p>We’ll contact you at ${esc(o.email)} with payment details.</p>`;
  if (o.pay_method === "card") {
    return o.pay_link
      ? `<p>Your secure card payment link is ready.</p><p><a class="btn btn-primary" href="${esc(o.pay_link)}" rel="noopener">Pay ${amt} by card</a></p><p class="small muted">Payments are processed by Stripe. We never see your card number.</p>`
      : `<p>We’ll text or email you a secure Stripe payment link for <b>${amt}</b> within ${P.replyHours} hours${o.phone ? ` (to ${esc(o.phone)} or ${esc(o.email)})` : ` (to ${esc(o.email)})`}. It will also appear on this page.</p><p class="small muted">Card payments are processed by Stripe. We never see your card number.</p>`;
  }
  const pay = (label, handle, extra = "") => `<div class="pay-box"><div><span class="small muted">Send</span><b>${amt}</b></div><div><span class="small muted">${esc(label)} to</span><b class="mono">${esc(handle)}</b>${extra}</div></div>`;
  if (o.pay_method === "zelle") return P.methods.zelle.handle ? pay("Zelle", P.methods.zelle.handle, P.zelleName ? `<span class="small muted">Name shown: ${esc(P.zelleName)}</span>` : "") + memo : later;
  if (o.pay_method === "cashapp") {
    const h = P.methods.cashapp.handle;
    return h ? pay("Cash App", h) + `<p><a class="btn btn-ghost btn-sm" href="https://cash.app/${encodeURIComponent(h)}/${(o.total_cents / 100).toFixed(2)}" rel="noopener">Open Cash App</a></p>` + memo : later;
  }
  if (o.pay_method === "venmo") {
    const h = P.methods.venmo.handle;
    return h ? pay("Venmo", h) + `<p><a class="btn btn-ghost btn-sm" href="https://venmo.com/u/${encodeURIComponent(h.replace(/^@/, ""))}" rel="noopener">Open Venmo</a></p>` + memo : later;
  }
  return later;
}

function orderPage(o) {
  const P = config.payments;
  const methodLabel = P.methods[o.pay_method]?.label || "";
  const next = o.fulfillment === "pickup" ? `We’ll text or email you to set your pickup time in Long Beach.` : o.fulfillment === "delivery" ? `We’ll contact you to confirm a local delivery window.` : `Your order ships within one business day. Tracking goes to ${esc(o.email)}.`;
  const body = `<section class="block"><div class="wrap narrow" data-order="${esc(o.id)}" data-status="${esc(o.status)}">
    <span class="eyebrow">Order ${esc(orders.payRef(o))}</span>
    ${o.status === "pending" ? `
      <h1>Order received. Next: payment</h1>
      <p class="muted">Thanks${o.name ? `, ${esc(o.name.split(" ")[0])}` : ""}! Your order is reserved. ${methodLabel ? `You chose <b>${esc(methodLabel)}</b>.` : ""} Bookmark this page; it updates when your payment is confirmed.</p>
      <div class="pay-steps">${payInstructions(o)}</div>
      <p class="small muted">Once we confirm your payment: ${next}</p>`
    : o.status === "cancelled" ? `<h1>This order was cancelled</h1><p class="muted">Questions? Contact us below.</p>`
    : `<h1>Payment received. Thank you!</h1>
      <p>${next}</p>
      <div class="ref-box" ${o.referral_code ? "" : "hidden"}><b>Your referral code</b><span class="mono">${esc(o.referral_code || "")}</span><span class="small muted">Colleagues save ${config.discounts.referralPct}%, you earn ${money(config.discounts.referralCreditCents)} credit.</span></div>`}
    <table class="spec order-items">${o.items.map((i) => `<tr><td>${esc(i.name)} × ${i.qty}${i.label ? ` <span class="pill">${esc(i.label)}</span>` : i.tierPct ? ` <span class="pill">−${i.tierPct}%</span>` : ""}</td><td>${money2(i.totalCents)}</td></tr>`).join("")}
      ${o.discount_cents ? `<tr><td>Discount (${esc(o.discount_code)})</td><td>−${money2(o.discount_cents)}</td></tr>` : ""}
      <tr><td>${esc(F[o.fulfillment]?.label || o.fulfillment)}</td><td>${o.shipping_cents ? money2(o.shipping_cents) : "Free"}</td></tr>
      <tr class="total"><td>Total</td><td>${money2(o.total_cents)} ${esc(o.currency)}</td></tr></table>
    <p class="small muted">Questions? ${esc(B.email)} · ${esc(B.phone)}</p>
  </div></section>`;
  return layout({ title: "Order status", path: `/order/${o.id}`, body });
}

function coaPage() {
  const rows = coas.length
    ? coas.map((c) => `<tr><td>${esc(catalog.bySlug.get(c.slug)?.name || c.slug)}</td><td class="mono">${esc(c.lot)}</td><td>${esc(c.labeled)}</td><td>${esc(c.measured || "—")}</td><td>${esc(c.purity)}</td><td>${esc(c.identity)}</td><td>${esc(c.lab)}</td><td>${esc(c.tested)}</td><td class="mono">${esc(c.verify || "—")}</td><td>${c.file ? `<a href="/coa/${esc(c.file)}">PDF</a>` : "—"}</td></tr>`).join("")
    : `<tr><td colspan="10" class="muted">Reports for the current lots are being finalized and will be posted here before release.</td></tr>`;
  const body = `<section class="block"><div class="wrap">
    ${sectionHead("Certificates of analysis", "COA library", "Search by product or the lot number printed on your vial.", `<input class="search" type="search" placeholder="Search product or lot" data-filter="#coa-body">`)}
    <div class="table-scroll"><table class="ledger"><thead><tr><th>Product</th><th>Lot</th><th>Labeled</th><th>Measured</th><th>Purity</th><th>Identity</th><th>Lab</th><th>Tested</th><th>Verify code</th><th>Report</th></tr></thead><tbody id="coa-body">${rows}</tbody></table></div>
  </div></section>
  <section class="block alt"><div class="wrap">${sectionHead("Guide", "Reading a COA", "")}${coaGuide()}</div></section>`;
  return layout({ title: "Certificates of analysis", path: "/coa", body });
}

function pickupPage() {
  const body = `<section class="block"><div class="wrap two-col">
    <div><span class="eyebrow">Local pickup</span><h1>Same-day pickup in Long Beach</h1>
      <p>Order online and choose “Local pickup” at checkout, or request a time below if you’ve already ordered. We confirm by text or email. Pickup is by appointment only.</p>
      <ol class="flow"><li><b>01</b><span>Order online and choose local pickup.</span></li><li><b>02</b><span>We confirm your time and send the address.</span></li><li><b>03</b><span>Show your order number. We check the lot numbers with you at handoff.</span></li></ol>
      ${pickupCard()}
    </div>
    <form class="panel" data-form="/api/pickup">
      <h3>Request a pickup time</h3>
      <div class="field"><label for="pn">Name</label><input id="pn" name="name" required autocomplete="name"></div>
      <div class="field"><label for="pc">Phone or email</label><input id="pc" name="contact" required></div>
      <div class="field"><label for="po">Order number <span class="muted">(if you have one)</span></label><input id="po" name="order_id" placeholder="ord_…"></div>
      <div class="field"><label for="pt">Preferred day and time</label><input id="pt" name="preferred" placeholder="e.g. Today after 4 pm"></div>
      <div class="field"><label for="pm">Note <span class="muted">(optional)</span></label><textarea id="pm" name="note" rows="3"></textarea></div>
      <button class="btn btn-primary" type="submit">Send request</button><p class="form-msg" data-msg aria-live="polite"></p>
    </form>
  </div></section>`;
  return layout({ title: "Local pickup in Long Beach", path: "/pickup", body });
}

function contactPage(topic) {
  const body = `<section class="block"><div class="wrap two-col">
    <div><span class="eyebrow">Contact</span><h1>Talk to a real person</h1><p>We’re local and we answer our own messages, usually within a few hours.</p>
      <p class="mono">${esc(B.email)}<br>${esc(B.phone)}</p><p class="small muted">We can’t answer questions about human use, dosing or preparation.</p></div>
    <form class="panel" data-form="/api/contact">
      <div class="field"><label for="mn">Name</label><input id="mn" name="name" autocomplete="name"></div>
      <div class="field"><label for="mc">Email or phone</label><input id="mc" name="contact" required></div>
      <div class="field"><label for="mt">Topic</label><select id="mt" name="topic">${["order", "pickup", "coa", "review", "wholesale", "other"].map((t) => `<option value="${t}" ${t === topic ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select></div>
      <div class="field"><label for="mb">Message</label><textarea id="mb" name="body" rows="5" required></textarea></div>
      <button class="btn btn-primary" type="submit">Send</button><p class="form-msg" data-msg aria-live="polite"></p>
    </form></div></section>`;
  return layout({ title: "Contact", path: "/contact", body });
}

function trackPage() {
  const body = `<section class="block"><div class="wrap narrow">
    <span class="eyebrow">Orders</span><h1>Track an order</h1><p>Enter the order number from your confirmation page or email.</p>
    <form class="inline-form" data-track><label class="sr" for="tid">Order number</label><input id="tid" name="order" placeholder="ord_…" required pattern="ord_[0-9a-f]{16}"><button class="btn btn-primary" type="submit">Look up</button><p class="form-msg" data-msg></p></form>
  </div></section>`;
  return layout({ title: "Track an order", path: "/track", body });
}

function article(title, path, html, eyebrow = "Learn") {
  return layout({ title, path, body: `<section class="block"><div class="wrap prose"><span class="eyebrow">${eyebrow}</span><h1>${esc(title)}</h1>${html}</div></section>` });
}

function researchPage() {
  const html = `<p>Background reading on every compound we carry, written for researchers. Literature is cited for scientific context only.</p>
  <div class="learn-cards">${catalog.PRODUCTS.map((p) => `<a href="/product/${p.slug}" style="--pc:${p.color}"><b>${esc(p.name)}</b><span>${esc(p.cls)}</span></a>`).join("")}</div>
  <h2>Guides</h2><ul><li><a href="/learn/peptide-basics">Peptide fundamentals</a></li><li><a href="/learn/handling-storage">Handling &amp; storage</a></li><li><a href="/learn/reading-a-coa">Reading a COA</a></li></ul>`;
  return article("Research library", "/research", html, "Research");
}

function helpPage() {
  const html = `<p>Quick answers to the most common questions. Can’t find yours? <a href="/contact">Contact us</a> or call ${esc(B.phone)}.</p>
  ${faqList()}
  <div class="learn-cards" style="margin-top:2rem"><a href="/track"><b>Track an order</b><span>Look up a payment or order status.</span></a><a href="/shipping"><b>Shipping</b><span>Rates, speed and where we ship.</span></a><a href="/refunds"><b>Returns &amp; refunds</b><span>What we can take back and how.</span></a></div>`;
  return article("Help center", "/help", html, "Help");
}

const PAGES = {
  "/about": ["About LB Aminos", `<p>LB Aminos is a Long Beach, California supplier of research-grade peptides. We stock a focused catalog, test every lot with an independent lab, and publish the full report before a lot goes on sale.</p><p>We keep things local: you can pick up in person, check lot numbers against the report at handoff, and talk to the people who run the business.</p><h2>What we don’t do</h2><p>We don’t provide dosing or preparation guidance, we don’t sell for human or veterinary use, and we don’t make health claims about any product.</p>`, "About"],
  "/learn/peptide-basics": ["Peptide fundamentals", `<p>Peptides are short chains of amino acids joined by peptide bonds, typically between 2 and 50 residues. Research peptides are usually made by solid-phase peptide synthesis (SPPS), purified by preparative HPLC and freeze-dried (lyophilized) into a stable powder.</p><h2>Why purity matters</h2><p>Synthesis can leave truncated or deletion sequences and residual reagents. In an assay, these impurities can confound results, so purity (HPLC) and identity (mass spectrometry) should be confirmed for every lot.</p><h2>Blends</h2><p>Some products, like KLOW, combine several peptides in one vial. Each component’s labeled amount is listed on the product page and the lot report.</p>`],
  "/learn/handling-storage": ["Handling & storage", `<p>Lyophilized peptides are most stable sealed, dry, cold and dark.</p><ul><li><b>Long-term:</b> −20 °C or colder, sealed, protected from light.</li><li><b>Short-term:</b> 2–8 °C is acceptable for a few weeks.</li><li><b>Before opening:</b> let a sealed vial reach room temperature to limit moisture uptake.</li><li><b>Avoid:</b> repeated freeze–thaw cycles, humidity and direct light.</li></ul><p>We store all inventory at −20 °C until pickup or shipment. Shipped orders travel sealed; lyophilized material tolerates normal transit times.</p>`],
  "/learn/reading-a-coa": ["Reading a COA", `<p>A certificate of analysis (COA) is the lab’s report on a specific lot. Here’s what to check.</p><ol><li><b>Lot number</b> must match your vial exactly.</li><li><b>Purity (HPLC)</b> is the share of the sample that is the target peptide.</li><li><b>Identity (MS)</b> confirms the measured mass matches the sequence.</li><li><b>Measured content</b> compares actual peptide in the vial with the labeled amount.</li><li><b>Verification code</b> lets you confirm with the lab that the report is genuine.</li></ol><p>See every published report in our <a href="/coa">COA library</a>.</p>`],
  "/shipping": ["Shipping", `<ul><li><b>Local pickup</b> in Long Beach: free, by appointment, usually same day.</li><li><b>Local delivery</b> in the Long Beach area: ${money(F.delivery.feeCents)}, free over ${money(F.delivery.freeOverCents)}.</li><li><b>US shipping</b> by 2-day service: ${money(F.ship.feeCents)}, free over ${money(F.ship.freeOverCents)}. Orders paid by 1 pm Pacific ship the same business day.</li></ul><p>We currently ship to US addresses only. International shipping is planned.</p><p class="muted small">Rates are placeholders until launch.</p>`, "Help"],
  "/refunds": ["Returns & refunds", `<p>Because research materials must stay sealed and cold to remain reliable, we can’t accept returns of opened or used product.</p><ul><li><b>Damaged or wrong item:</b> contact us within 7 days of receipt with your order number and a photo. We’ll replace it or refund it.</li><li><b>Lost shipment:</b> we’ll work with the carrier and reship or refund.</li><li><b>Cancelled orders:</b> unpaid orders expire automatically. Paid orders can be cancelled before they ship or are picked up.</li></ul><p>Refunds go back through the original payment method where possible.</p>`, "Help"],
  "/referral": ["Referral program", `<p>Every paid order gets a personal referral code, shown on its confirmation page.</p><ol><li>Share your code with a colleague.</li><li>They enter it at checkout and save ${config.discounts.referralPct}%.</li><li>Once their order is paid, you earn ${money(config.discounts.referralCreditCents)} in store credit, applied to your next order when you contact us.</li></ol><p class="small muted">Codes can’t be used on your own orders or combined with other discounts.</p>`, "Help"],
  "/legal/terms": ["Terms of sale", `<p>By purchasing from LB Aminos you confirm that you are at least 21 years old and that all products are purchased for lawful laboratory research use only.</p><ul><li>Products are not for human or veterinary use, and are not drugs, foods, supplements or cosmetics.</li><li>You are responsible for handling products safely and in compliance with applicable laws and regulations.</li><li>We may refuse or cancel any order, including any order that references human or animal use.</li><li>Product information is provided for research context only and is not a claim of safety or efficacy.</li><li>Orders are confirmed once payment is received. Card payments are processed by Stripe; Zelle, Cash App and Venmo payments are subject to those services’ terms.</li><li>Our liability is limited to the purchase price of the product.</li></ul><p class="small muted">Template text. Have a lawyer review before launch.</p>`, "Legal"],
  "/legal/privacy": ["Privacy policy", `<p>We collect only what we need to process and deliver your order: your name, email, phone, delivery address and order details. Card payments are handled by Stripe through a payment link; we never receive or store card details. For Zelle, Cash App or Venmo we see only what those services show us, such as your name and the amount.</p><p>We use your email to send order updates and, if you sign up, restock and lot-report emails. We don’t sell your information. Contact ${esc(B.email)} to request access to or deletion of your data.</p><p class="small muted">Template text. Have a lawyer review before launch.</p>`, "Legal"],
  "/legal/research-use": ["Research-use policy", `<p>All LB Aminos products are sold strictly for in-vitro laboratory research and analytical use.</p><ul><li>Not for human consumption, injection or any use in humans or animals.</li><li>We do not provide dosing, administration, reconstitution or preparation guidance.</li><li>We do not make health, therapeutic or weight-related claims about any product.</li><li>Orders or messages that reference personal or animal use will be cancelled and refunded.</li><li>Buyers must be 21 or older.</li></ul>`, "Legal"],
  "/legal/disclaimer": ["Disclaimer", `<p>The information on this website is provided for educational and research reference only. Literature citations are for scientific context and do not imply that any product is safe or effective for any purpose. Statements on this site have not been evaluated by the Food and Drug Administration. Products are not intended to diagnose, treat, cure or prevent any disease.</p>`, "Legal"],
};

function notFound() {
  return layout({ title: "Not found", body: `<section class="block"><div class="wrap narrow"><h1>Page not found</h1><p><a href="/shop">Browse the catalog</a> or <a href="/">go home</a>.</p></div></section>` });
}

module.exports = { labBox, layout, home, shop, product, cart, orderPage, coaPage, pickupPage, contactPage, trackPage, researchPage, helpPage, article, PAGES, notFound, esc, money2 };
