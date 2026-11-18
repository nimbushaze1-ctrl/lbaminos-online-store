// LB Aminos storefront script. No payment data is handled here: checkout posts the cart
// (SKUs + quantities only) to /api/checkout and the server redirects to PeptidePay's hosted page.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const money = (c) => `$${(c / 100).toFixed(2)}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---- 21+ / research-use gate ----
  const gate = $("[data-gate]");
  if (gate && !store.get("lb_gate", false)) {
    gate.hidden = false;
    document.body.classList.add("locked");
    $("[data-gate-yes]").addEventListener("click", () => { store.set("lb_gate", true); gate.hidden = true; document.body.classList.remove("locked"); });
  }

  // ---- mobile menu ----
  const mb = $("[data-menu]");
  if (mb) mb.addEventListener("click", () => { const n = $("#mnav"); n.hidden = !n.hidden; mb.setAttribute("aria-expanded", String(!n.hidden)); });

  // ---- toast ----
  let tt;
  const toast = (msg) => { const t = $("[data-toast]"); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2600); };

  // ---- cart (sku -> qty) ----
  const cart = () => store.get("lb_cart", {});
  const saveCart = (c) => { store.set("lb_cart", c); renderCount(); };
  const add = (sku, q = 1) => { const c = cart(); c[sku] = Math.min(50, (c[sku] || 0) + q); saveCart(c); toast("Added to cart"); };
  function renderCount() { const n = Object.values(cart()).reduce((a, b) => a + b, 0); $$("[data-cart-count]").forEach((el) => { el.textContent = n; el.classList.toggle("on", n > 0); }); }
  renderCount();

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (b) add(b.dataset.add, 1);
  });

  // ---- product page ----
  const buy = $("[data-buy]");
  if (buy) {
    const qty = $("input[name=quantity]", buy);
    const unit = Number(buy.dataset.unit), mg = Number(buy.dataset.mg) || 0;
    let tiers = [{ min: 10, pct: 15 }, { min: 5, pct: 10 }, { min: 3, pct: 5 }, { min: 1, pct: 0 }];
    fetch("/api/catalog").then((r) => r.json()).then((d) => { tiers = d.tiers; update(); }).catch(() => {});
    const update = () => {
      const q = Math.max(1, Math.min(50, parseInt(qty.value, 10) || 1));
      const t = tiers.find((x) => q >= x.min);
      const u = Math.round((unit * (100 - t.pct)) / 100);
      $("[data-price]").textContent = q > 1 ? `${money(u * q)} (${money(u)}/vial)` : money(u);
      $("[data-permg]").textContent = mg ? `${money(u / mg)}/mg` : "";
      $$("[data-tier]").forEach((el) => el.classList.toggle("on", Number(el.dataset.tier) === t.min));
    };
    $$("[data-step]", buy).forEach((b) => b.addEventListener("click", () => { qty.value = Math.max(1, Math.min(50, (parseInt(qty.value, 10) || 1) + Number(b.dataset.step))); update(); }));
    $$("[data-tier]").forEach((b) => b.addEventListener("click", () => { qty.value = b.dataset.tier; update(); }));
    qty.addEventListener("input", update);
    $("[data-add-qty]", buy).addEventListener("click", () => add(buy.dataset.sku, Math.max(1, parseInt(qty.value, 10) || 1)));
    // "Buy now" posts { product_slug, quantity } to /api/checkout; the server sends us to the cart to add email + fulfillment.
    update();
  }

  // ---- cart page ----
  const lines = $("[data-cart-lines]");
  if (lines) {
    const params = new URLSearchParams(location.search);
    let catalog = null;
    const form = $("[data-checkout]");
    const msg = $("[data-msg]", form);

    fetch("/api/catalog").then((r) => r.json()).then((d) => {
      catalog = d;
      if (params.get("add")) {
        const p = d.products.find((x) => x.slug === params.get("add"));
        const v = p && (p.variants.find((x) => x.inStock) || p.variants[0]);
        if (v) { const c = cart(); c[v.sku] = Math.min(50, Math.max(1, parseInt(params.get("qty"), 10) || 1)); saveCart(c); }
        history.replaceState(null, "", "/cart");
      }
      if (params.get("cancelled")) msg.textContent = "Payment was cancelled. Your cart is still here.";
      draw();
    });

    const variant = (sku) => { for (const p of catalog.products) for (const v of p.variants) if (v.sku === sku) return { p, v }; return null; };
    const items = () => Object.entries(cart()).filter(([sku]) => variant(sku)).map(([sku, quantity]) => ({ sku, quantity }));

    function draw() {
      const c = cart();
      const rows = Object.entries(c).map(([sku, q]) => {
        const x = variant(sku);
        if (!x) return "";
        return `<div class="line" style="--pc:${x.p.color}"><img src="${x.p.img}" alt="" width="60" height="128"><div><b><a href="/product/${x.p.slug}">${esc(x.p.name)}</a></b> <span class="muted">${esc(x.v.size)}</span><div class="qty small"><button type="button" data-q="${sku}" data-d="-1" aria-label="Fewer">−</button><span class="mono">${q}</span><button type="button" data-q="${sku}" data-d="1" aria-label="More">+</button><button type="button" class="link" data-rm="${sku}">Remove</button></div></div><div class="mono" data-line="${sku}"></div></div>`;
      }).join("");
      lines.innerHTML = rows || `<p class="muted">Your cart is empty. <a href="/shop">Browse the catalog</a>.</p>`;
      quote();
    }

    lines.addEventListener("click", (e) => {
      const c = cart();
      const q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]");
      if (q) { c[q.dataset.q] = Math.max(1, Math.min(50, (c[q.dataset.q] || 1) + Number(q.dataset.d))); saveCart(c); draw(); }
      if (rm) { delete c[rm.dataset.rm]; saveCart(c); draw(); }
    });

    const fd = () => Object.fromEntries(new FormData(form));
    function toggleAddr() { const f = fd().fulfillment; $("[data-addr]").hidden = f === "pickup"; }
    form.addEventListener("change", (e) => { toggleAddr(); if (e.target.name === "fulfillment") quote(); });
    $("[data-apply]").addEventListener("click", () => quote(true));
    toggleAddr();

    let qseq = 0;
    async function quote(explicit) {
      const its = items();
      const tot = $("[data-totals]");
      if (!its.length) { tot.innerHTML = ""; return; }
      const f = fd();
      const seq = ++qseq;
      const r = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: its, fulfillment: f.fulfillment, discount_code: f.discount_code, email: f.email }) });
      const d = await r.json();
      if (seq !== qseq) return;
      if (!r.ok) { msg.textContent = d.error; if (f.discount_code) { /* show totals without the code */ } return; }
      msg.textContent = explicit && d.discountCode ? `${d.discountLabel} applied.` : "";
      for (const i of d.items) { const el = $(`[data-line="${i.sku}"]`); if (el) el.innerHTML = `${money(i.totalCents)}${i.tierPct ? `<br><span class="pill">−${i.tierPct}% bulk</span>` : ""}`; }
      tot.innerHTML = `<dt>Subtotal</dt><dd>${money(d.subtotal)}</dd>${d.discount ? `<dt>${esc(d.discountLabel)}</dt><dd>−${money(d.discount)}</dd>` : ""}<dt>${f.fulfillment === "ship" ? "Shipping" : f.fulfillment === "delivery" ? "Delivery" : "Pickup"}</dt><dd>${d.shipping ? money(d.shipping) : "Free"}</dd><dt class="t">Total</dt><dd class="t">${money(d.total)}</dd>`;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = fd();
      if (!items().length) return (msg.textContent = "Your cart is empty.");
      if (!f.email) return (msg.textContent = "Enter your email.");
      if (!f.attest) return (msg.textContent = "Please confirm the research-use and 21+ statement.");
      const btn = $("button[type=submit]", form);
      btn.disabled = true; msg.textContent = "Starting secure checkout…";
      try {
        const r = await fetch("/api/checkout", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ items: items(), email: f.email, name: f.name, phone: f.phone, fulfillment: f.fulfillment, discount_code: f.discount_code, attest: true,
            address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, zip: f.zip } }),
        });
        const d = await r.json();
        if (!r.ok || !d.url) throw new Error(d.error || "Checkout failed.");
        store.set("lb_last_order", d.order_id);
        location.href = d.url; // PeptidePay hosted checkout
      } catch (err) { msg.textContent = err.message; btn.disabled = false; }
    });
  }

  // ---- order confirmation polling: every 3s; after 90s show the "still processing" note and keep polling ----
  const ord = $("[data-order]");
  if (ord && ord.dataset.status === "pending") {
    const id = ord.dataset.order;
    const started = Date.now();
    const show = (s) => $$("[data-state]", ord).forEach((el) => (el.hidden = el.dataset.state !== s));
    const poll = async () => {
      try {
        const r = await fetch(`/api/order/${id}`, { cache: "no-store" });
        const d = await r.json();
        if (d.status === "paid") {
          show("paid");
          store.set("lb_cart", {}); renderCount();
          // Reload once to pick up the referral code rendered server-side.
          if (!sessionStorage.getItem(`lb_paid_${id}`)) { sessionStorage.setItem(`lb_paid_${id}`, "1"); location.reload(); }
          return;
        }
      } catch {}
      if (Date.now() - started > 90_000) { $("[data-wait]", ord).hidden = true; $("[data-slow]", ord).hidden = false; }
      setTimeout(poll, 3000);
    };
    poll();
  } else if (ord) { store.set("lb_cart", {}); renderCount(); }

  // ---- email signup ----
  $$("[data-subscribe]").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const m = $("[data-msg]", f);
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email.value }) });
    const d = await r.json();
    m.innerHTML = r.ok ? `Your code: <b class="mono">${esc(d.code)}</b>. Use it at checkout with this email.` : esc(d.error);
  }));

  // ---- generic JSON forms (pickup, contact) ----
  $$("[data-form]").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const m = $("[data-msg]", f);
    const r = await fetch(f.dataset.form, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
    const d = await r.json();
    m.textContent = r.ok ? d.message : d.error;
    if (r.ok) f.reset();
  }));

  // ---- track ----
  const tr = $("[data-track]");
  if (tr) tr.addEventListener("submit", (e) => { e.preventDefault(); location.href = `/order/${encodeURIComponent(tr.elements.order.value.trim())}`; });

  // ---- table filter ----
  $$("[data-filter]").forEach((inp) => inp.addEventListener("input", () => {
    const q = inp.value.toLowerCase();
    $$(`${inp.dataset.filter} tr`).forEach((tr) => (tr.hidden = q && !tr.textContent.toLowerCase().includes(q)));
  }));
})();
