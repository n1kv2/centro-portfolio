// Versione a reel: segnala il reel attivo, aggiorna segmenti e contatore, avvia le animazioni del reel
(function () {
  var reels = Array.prototype.slice.call(document.querySelectorAll('[data-reel]'));
  var seg = document.getElementById('rseg');
  var count = document.getElementById('rcount');
  var bar = document.getElementById('rbar');
  var n = reels.length;
  var pad = function (k) { return (k < 10 ? '0' : '') + k; };

  seg.innerHTML = reels.map(function () { return '<i></i>'; }).join('');
  var bits = Array.prototype.slice.call(seg.children);
  var current = -1;

  function activate(i) {
    if (i === current) return;
    current = i;
    reels.forEach(function (r, k) { if (k === i) r.classList.add('on'); });
    bits.forEach(function (b, k) { b.classList.toggle('done', k < i); b.classList.toggle('now', k === i); });
    count.textContent = pad(i + 1) + ' / ' + pad(n);
    bar.classList.toggle('on-light', isLight(reels[i]));
    if (reels[i].classList.contains('r-feed')) sortFeed(reels[i]);
  }

  // Sfondo chiaro o scuro? Si guarda il colore reale (cambia con il tema)
  function isLight(el) {
    if (el.classList.contains('r-hero')) return false;
    var m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    var lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
    return lum > 0.6;
  }
  var themeObs = new MutationObserver(function () { if (current >= 0) bar.classList.toggle('on-light', isLight(reels[current])); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Il feed parte in ordine sparso e si riordina per affinità
  function sortFeed(reel) {
    var items = Array.prototype.slice.call(reel.querySelectorAll('.feed li'));
    if (!items.length || reel.dataset.sorted) return;
    reel.dataset.sorted = '1';
    var tops = items.map(function (li) { return li.offsetTop; });
    setTimeout(function () {
      items.forEach(function (li, k) {
        var target = parseInt(getComputedStyle(li).getPropertyValue('--o'), 10);
        li.style.transform = 'translateY(' + (tops[target] - tops[k]) + 'px)';
      });
    }, 900);
  }

  // Il reel attivo è quello che occupa la parte centrale dello schermo
  function check() {
    var mid = window.innerHeight / 2, best = 0;
    reels.forEach(function (r, k) {
      var b = r.getBoundingClientRect();
      if (b.top <= mid && b.bottom > mid) best = k;
    });
    activate(best);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { check(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', check);
  check();
})();
