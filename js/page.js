// Pagine separate: comparse allo scorrimento, foto profilo con iniziale di riserva
(function () {
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
