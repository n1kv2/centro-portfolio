// Introduzione: tante app sparse sullo schermo. La pagina resta ferma finché non si tocca:
// allora le app collassano al centro, compare CEnTRO e solo dopo si può scorrere.
(function () {
  var html = document.documentElement;
  var intro = document.getElementById('intro');
  var field = document.getElementById('apps');
  var tap = document.getElementById('introTap');
  var scrollCta = document.getElementById('introScroll');
  var appIcon = intro.querySelector('.app-icon');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  html.classList.add('locked');
  var stopTouch = function (e) { if (html.classList.contains('locked')) e.preventDefault(); };
  document.addEventListener('touchmove', stopTouch, { passive: false });

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

  // Righe sfalsate da 4 e 3 app (4+3+4+3+4+3 = 21), con spostamenti e dimensioni casuali
  function layout() {
    if (merged) return;
    var W = field.clientWidth, H = field.clientHeight;
    var ch = H / 6, k = 0;
    for (var row = 0; row < 6; row++) {
      var n = row % 2 === 0 ? 4 : 3;
      var cw = W / 4, x0 = row % 2 === 0 ? cw / 2 : cw;
      for (var col = 0; col < n; col++, k++) {
        var tile = tiles[k], sh = shape[k];
        var size = Math.min(sh.s, cw - 16, ch - 30);
        tile.style.setProperty('--s', size + 'px');
        var cx = x0 + col * cw + (sh.jx - 0.5) * Math.max(0, cw - size) * 0.9;
        var y = row * ch + (ch - size - 22) / 2 + (sh.jy - 0.5) * Math.max(0, ch - size - 22) * 0.9;
        tile.style.left = Math.round(Math.max(38, Math.min(W - 38, cx)) - 42) + 'px';
        tile.style.top = Math.round(y) + 'px';
      }
    }
  }

  var merged = false;
  function merge() {
    if (merged) return;
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
    setTimeout(function () {
      html.classList.remove('locked');
      scrollCta.hidden = false;
    }, 1200);
  }

  layout();
  window.addEventListener('resize', layout);
  intro.addEventListener('click', merge);
  document.addEventListener('keydown', function (e) { if (!merged && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); merge(); } });
})();
