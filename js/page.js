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
})();
