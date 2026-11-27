(function () {
  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // 21+ / research-use entry screen, remembered for 30 days
  var gate = document.getElementById('gate');
  if (!gate) return;
  var KEY = 'lba_gate_ok';
  var ok = false;
  try {
    var t = Number(localStorage.getItem(KEY) || 0);
    ok = t && Date.now() - t < 30 * 864e5;
  } catch (e) {}
  if (!ok && document.cookie.indexOf(KEY + '=1') !== -1) ok = true;
  if (ok) return;
  gate.hidden = false;
  document.body.classList.add('locked');
  var yes = document.getElementById('gate-yes');
  if (yes) yes.focus();
  yes.addEventListener('click', function () {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    document.cookie = KEY + '=1; max-age=' + 30 * 86400 + '; path=/; SameSite=Lax';
    gate.hidden = true;
    document.body.classList.remove('locked');
  });
})();
