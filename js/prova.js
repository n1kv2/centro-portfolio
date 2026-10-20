// Pagina di prova: barra trasparente sopra la foto, comparse allo scorrimento, settimana che si accende
(function () {
  var bar = document.getElementById('topbar');
  var hero = document.getElementById('hero');
  var week = document.getElementById('ndWeek');
  var days = week ? Array.prototype.slice.call(week.children) : [];

  // Comparse
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-nd]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Settimana: la linea si riempie scorrendo e ogni giorno si accende quando la linea lo raggiunge
  function renderWeek() {
    if (!week) return;
    var r = week.getBoundingClientRect();
    var mark = window.innerHeight * 0.6;
    var fill = Math.max(0, Math.min(1, (mark - r.top) / r.height));
    week.style.setProperty('--fill', fill.toFixed(3));
    days.forEach(function (d) {
      var dr = d.getBoundingClientRect();
      d.classList.toggle('on', dr.top + 8 < mark);
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var hb = hero.getBoundingClientRect().bottom;
      bar.classList.toggle('over', hb > bar.offsetHeight + 10);
      bar.classList.toggle('is-scrolled', hb <= bar.offsetHeight + 10);
      renderWeek();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
