// Schede, comparse allo scorrimento, menu, foto profilo, ciclo degli organizzatori e copia dell'email
(function () {
  // Comparsa allo scorrimento: gli elementi [data-reveal] entrano quando diventano visibili
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window) {
    // Elementi in sequenza dentro lo stesso gruppo: piccolo ritardo a scalare
    reveals.forEach(function (el) {
      var sib = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.hasAttribute('data-reveal'); });
      if (sib.length > 1) el.style.setProperty('--dl', (sib.indexOf(el) * 0.08) + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Menu a tutto schermo
  var menu = document.getElementById('menu');
  var menuOpen = document.getElementById('menuOpen');
  var menuClose = document.getElementById('menuClose');
  function closeMenu() { menu.hidden = true; document.body.classList.remove('lock'); }
  menuOpen.addEventListener('click', function () { menu.hidden = false; document.body.classList.add('lock'); menuClose.focus({ preventScroll: true }); });
  menuClose.addEventListener('click', function () { closeMenu(); menuOpen.focus({ preventScroll: true }); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });

  // Aspetto: automatico (alba-tramonto), chiaro, scuro
  var opts = Array.prototype.slice.call(document.querySelectorAll('[data-theme-opt]'));
  var note = document.getElementById('themeNote');
  function showTheme() {
    if (!window.centroTheme) return;
    var cur = window.centroTheme.get(), t = window.centroTheme.times();
    opts.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-theme-opt') === cur ? 'true' : 'false'); });
    note.textContent = cur === 'auto'
      ? 'Chiaro dall\'alba al tramonto, scuro la sera. Oggi all\'Aquila: alba ' + t.rise + ', tramonto ' + t.set + '.'
      : cur === 'light' ? 'Sempre chiaro.' : 'Sempre scuro.';
  }
  opts.forEach(function (b) { b.addEventListener('click', function () { window.centroTheme.set(b.getAttribute('data-theme-opt')); showTheme(); }); });
  showTheme();

  // Foto profilo: se img/nicholas.jpg non c'è, resta l'iniziale
  var photo = document.getElementById('mePhoto');
  if (photo) {
    var ok = function () { photo.parentNode.classList.add('has-photo'); };
    var ko = function () { photo.hidden = true; };
    if (photo.complete) { photo.naturalWidth ? ok() : ko(); }
    photo.addEventListener('load', ok);
    photo.addEventListener('error', ko);
  }

  // Schede: ogni contenitore [data-tabs] gestisce i suoi pulsanti e pannelli
  Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    function show(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
    tabs.forEach(function (t, i) {
      t.type = 'button';
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length];
        n.focus(); show(n);
      });
    });
  });

  // Ciclo: le cinque tappe si accendono una dopo l'altra quando il ciclo è visibile
  var cycle = document.getElementById('cycle');
  if (cycle) {
    var steps = Array.prototype.slice.call(cycle.querySelectorAll('.cycle-steps li'));
    var run = document.getElementById('cycleRun');
    var k = 0, timer = null;
    var tick = function () {
      steps.forEach(function (s, i) { s.classList.toggle('on', i === k); });
      run.style.strokeDashoffset = String(1 - (k + 1) / steps.length);
      k = (k + 1) % steps.length;
    };
    tick();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !timer) timer = setInterval(tick, 1600);
          if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: 0.4 }).observe(cycle);
    }
  }

  // Copia dell'indirizzo email
  var copy = document.getElementById('copyMail');
  var mail = document.getElementById('mail');
  if (copy && mail) {
    copy.addEventListener('click', function () {
      var done = function () { copy.textContent = 'Copiato'; setTimeout(function () { copy.textContent = 'Copia indirizzo'; }, 1800); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(mail);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        copy.textContent = 'Selezionato';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail.textContent.trim()).then(done, fallback);
      } else { fallback(); }
    });
  }
})();
