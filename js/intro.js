// Introduzione: una schermata sovrapposta al sito con tante app sparse.
// 1) tocco o swipe: le app collassano al centro e compare CEnTRO;
// 2) swipe verso l'alto, rotella o tocco: la schermata scivola via e il sito resta in cima. Non ricompare.
(function () {
  var html = document.documentElement;
  var intro = document.getElementById('intro');
  var field = document.getElementById('apps');
  var tap = document.getElementById('introTap');
  var scrollCta = document.getElementById('introScroll');
  var appIcon = intro.querySelector('.app-icon');

  // Si parte sempre dall'introduzione, anche se il link contiene un #sezione
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { if (!merged) { window.scrollTo(0, 0); layout(); } });
  html.classList.add('locked');
  var state = 'apps'; // apps → merging → ready → gone
  var startY = null, wheelAt = 0;
  document.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (state === 'gone') return;
    e.preventDefault();
    if (startY === null) return;
    var dy = startY - e.touches[0].clientY;
    if (state === 'apps' && Math.abs(dy) > 24) merge();
    else if (state === 'ready' && dy > 30) leave();
  }, { passive: false });
  document.addEventListener('wheel', function (e) {
    if (state === 'gone') return;
    e.preventDefault();
    var now = Date.now();
    if (now - wheelAt < 400) return;
    wheelAt = now;
    if (state === 'apps') merge(); else if (state === 'ready' && e.deltaY > 0) leave();
  }, { passive: false });

  var apps = [
    ['Social', '#E1306C', '#F7A440'], ['Eventi', '#F06139', '#F59A5B'], ['Attività', '#2FB37A', '#7AD9A8'], ['Spotted', '#D43998', '#F27BC0'],
    ['Affitti', '#8B9AA8', '#C4CDD6'], ['Università', '#1E42BA', '#5C86F0'], ['Azienda 1', '#E0A82E', '#F5D27A'], ['Biglietti', '#BB2DCE', '#DE8BEA'],
    ['Gruppi', '#2E9BD6', '#86CDF2'], ['Bandi', '#47566B', '#8C9AAE'], ['Coinquilini', '#C4553A', '#EB9B85'], ['Concorsi', '#6A3FD1', '#A98CF2'],
    ['Mappe', '#3BAF9C', '#93DCCF'], ['Recensioni', '#F2B705', '#F9DD7A'], ['Chat', '#2F86EE', '#8EC2FF'], ['Azienda 2', '#7A5230', '#C29A72'],
    ['Sport', '#E2463F', '#F59490'], ['Corsi', '#4B9E3F', '#A3D896'], ['Locali', '#8B1EBA', '#C774E6'], ['Volontariato', '#1F8F8A', '#7FCFCB'],
    ['Annunci', '#E57A1F', '#F7B77A']
  ];

  // Generatore casuale con seme fisso: disposizione sparsa ma sempre uguale
  var seed = 7;
  var rnd = function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (var i = apps.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = apps[i]; apps[i] = apps[j]; apps[j] = tmp; }
  var shape = apps.map(function () { return { s: 48 + Math.round(rnd() * 20), jx: rnd(), jy: rnd(), r: (rnd() * 8 - 4).toFixed(1), d: (-rnd() * 6).toFixed(2) }; });

  field.innerHTML = apps.map(function (a, k) {
    var sh = shape[k];
    return '<div class="tile" style="--s:' + sh.s + 'px"><div class="tile-in" style="--r:' + sh.r + 'deg;--d:' + sh.d + 's">' +
      '<i style="--c:linear-gradient(145deg,' + a[1] + ',' + a[2] + ');transform:rotate(' + sh.r + 'deg)"></i><span>' + a[0] + '</span></div></div>';
  }).join('');
  var tiles = Array.prototype.slice.call(field.children);

  // Righe sfalsate da 4 e 3 app (4+3+4+3+4+3 = 21) con spostamenti casuali,
  // poi le app si allontanano finché nessuna tocca un'altra (etichetta compresa)
  function layout() {
    if (merged) return;
    var W = field.clientWidth;
    var H = Math.max(field.clientHeight, 300);
    var ch = H / 6, cw = W / 4, k = 0, box = [];
    for (var row = 0; row < 6; row++) {
      var n = row % 2 === 0 ? 4 : 3, x0 = row % 2 === 0 ? cw / 2 : cw;
      for (var col = 0; col < n; col++, k++) {
        var sh = shape[k];
        var size = Math.max(36, Math.min(sh.s, cw - 18, ch - 30));
        var label = tiles[k].querySelector('span');
        var w = Math.max(size, label.offsetWidth) + 8, h = size + 26;
        box.push({
          x: x0 + col * cw + (sh.jx - 0.5) * Math.max(0, cw - w) * 0.8,
          y: row * ch + ch / 2 + (sh.jy - 0.5) * Math.max(0, ch - h) * 0.8,
          w: w, h: h, size: size
        });
      }
    }
    // Separazione: fino a 80 passaggi, spingendo via le coppie che si sovrappongono
    for (var it = 0; it < 80; it++) {
      var moved = false;
      for (var i = 0; i < box.length; i++) for (var j = i + 1; j < box.length; j++) {
        var A = box[i], B = box[j];
        var ox = (A.w + B.w) / 2 - Math.abs(A.x - B.x), oy = (A.h + B.h) / 2 - Math.abs(A.y - B.y);
        if (ox > 0 && oy > 0) {
          moved = true;
          if (ox < oy) { var dx = (ox / 2 + 0.5) * (A.x < B.x ? -1 : 1); A.x += dx; B.x -= dx; }
          else { var dy = (oy / 2 + 0.5) * (A.y < B.y ? -1 : 1); A.y += dy; B.y -= dy; }
        }
      }
      box.forEach(function (b) {
        b.x = Math.max(b.w / 2, Math.min(W - b.w / 2, b.x));
        b.y = Math.max(b.h / 2, Math.min(H - b.h / 2, b.y));
      });
      if (!moved) break;
    }
    tiles.forEach(function (tile, i) {
      var b = box[i];
      tile.style.setProperty('--s', b.size + 'px');
      tile.style.left = Math.round(b.x - 42) + 'px';
      tile.style.top = Math.round(b.y - b.h / 2) + 'px';
    });
  }

  var merged = false;
  function merge() {
    if (state !== 'apps') return;
    state = 'merging';
    merged = true;
    intro.classList.add('merged');
    var t = appIcon.getBoundingClientRect();
    var cx = t.left + t.width / 2, cy = t.top + t.height / 2;
    tiles.forEach(function (tile) {
      var r = tile.querySelector('i').getBoundingClientRect();
      var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      tile.style.transitionDelay = Math.round(Math.sqrt(dx * dx + dy * dy) * 0.55) + 'ms';
      tile.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.25)';
      tile.style.opacity = '0';
    });
    tap.hidden = true;
    setTimeout(function () { intro.classList.add('ready'); }, 700);
    setTimeout(function () { state = 'ready'; scrollCta.hidden = false; }, 1100);
  }

  function leave() {
    if (state !== 'ready') return;
    state = 'gone';
    window.scrollTo(0, 0);
    html.classList.remove('locked');
    document.body.classList.add('entered');
    intro.classList.add('leave');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () { intro.hidden = true; }, reduce ? 0 : 750);
  }

  function act() { if (state === 'apps') merge(); else if (state === 'ready') leave(); }

  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('resize', layout);
  intro.addEventListener('click', act);
  intro.addEventListener('touchend', function () { if (startY !== null) act(); }, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (state !== 'gone' && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown')) { e.preventDefault(); act(); }
  });
})();
