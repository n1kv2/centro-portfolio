// Pagine separate: comparse allo scorrimento, foto profilo con iniziale di riserva
(function () {
  // Fondo pagina: copyright e freccia per tornare in cima
  var main = document.querySelector('main');
  if (main && !document.querySelector('.pg-copy')) {
    var cp = document.createElement('p');
    cp.className = 'pg-copy';
    cp.innerHTML = '© <span class="cn">CEnTRO</span> 2026';
    main.appendChild(cp);
  }
  var up = document.createElement('button');
  up.type = 'button'; up.className = 'pg-top'; up.setAttribute('aria-label', 'Torna in cima');
  up.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 15L12 9L5 15"/></svg>';
  document.body.appendChild(up);
  up.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  var onScroll = function () { up.classList.toggle('on', window.scrollY > window.innerHeight * .8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Chi sono: "Scrivimi" apre un riquadro con richiesta ed email, come nei contatti
  var wr = document.querySelector('[data-write]');
  if (wr) {
    var box = document.getElementById('wrBox'), form = document.getElementById('wrForm'), note = document.getElementById('wrNote');
    wr.addEventListener('click', function () {
      var open = box.classList.toggle('open');
      wr.setAttribute('aria-expanded', open);
      if (open) setTimeout(function () { document.getElementById('wrText').focus({ preventScroll: true }); }, 450);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = document.getElementById('wrText').value.trim(), mail = document.getElementById('wrEmail').value.trim();
      form.classList.remove('err', 'ok');
      if (!text) { form.classList.add('err'); note.textContent = 'Scrivi due righe sulla tua richiesta.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { form.classList.add('err'); note.textContent = 'Serve un’email valida per risponderti.'; return; }
      if (!form.querySelector('.hp').value) {
        var fd = new FormData();
        fd.append('richiesta', text); fd.append('email', mail); fd.append('_subject', 'CEnTRO · richiesta da Chi sono');
        fd.append('_captcha', 'false'); fd.append('_template', 'table');
        var url = form.getAttribute('data-endpoint').replace('/ajax/', '/');
        if (!(navigator.sendBeacon && navigator.sendBeacon(url, fd))) fetch(url, { method: 'POST', body: fd, mode: 'no-cors' }).catch(function () {});
      }
      form.classList.add('ok'); note.textContent = 'Grazie! Ti ricontatto io a breve.';
      form.reset();
    });
  }
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-pg]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }
  var photo = document.getElementById('mePhoto');
  if (photo) {
    var ok = function () { photo.parentNode.classList.add('has-photo'); };
    var ko = function () { photo.hidden = true; };
    if (photo.complete) { photo.naturalWidth ? ok() : ko(); }
    photo.addEventListener('load', ok); photo.addEventListener('error', ko);
  }
  // CEnTRO con la n minuscola anche nelle scritte in maiuscolo
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), list = [];
  while (w.nextNode()) if (w.currentNode.nodeValue.indexOf('CEnTRO') >= 0) list.push(w.currentNode);
  list.forEach(function (t) {
    var el = t.parentNode;
    if (!el || getComputedStyle(el).textTransform !== 'uppercase') return;
    var parts = t.nodeValue.split('CEnTRO'), frag = document.createDocumentFragment();
    parts.forEach(function (part, i) {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) { var sp = document.createElement('span'); sp.className = 'cn'; sp.textContent = 'CEnTRO'; frag.appendChild(sp); }
    });
    el.replaceChild(frag, t);
  });
})();
