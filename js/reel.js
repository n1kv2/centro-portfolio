// Versione a reel.
// - Ogni reel è una schermata intera; il box in alto mostra capitolo, avanzamento e indice.
// - Dopo l'introduzione si sceglie un profilo (utente, azienda, investitore): si vedono solo i suoi reel,
//   poi un reel di direzione per scegliere cosa vedere. Senza scelta, si vede tutto in ordine.
(function () {
  var all = Array.prototype.slice.call(document.querySelectorAll('[data-reel]'));
  var seg = document.getElementById('rseg');
  var count = document.getElementById('rcount');
  var chap = document.getElementById('rchap');
  var bar = document.getElementById('rbar');
  var router = document.getElementById('router');
  var routerPaths = document.getElementById('routerPaths');
  var TRACKS = { utente: 'Per chi usa l\'app', azienda: 'Per le aziende', investitore: 'Per chi investe' };
  var NAMES = { utente: 'Utente', azienda: 'Azienda', investitore: 'Investitore' };
  var mode = 'all';
  var visible = [], bits = [], current = -1;
  var pad = function (k) { return (k < 10 ? '0' : '') + k; };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Percorsi ----------
  function applyMode() {
    all.forEach(function (r) {
      var t = r.getAttribute('data-track');
      if (t) r.hidden = mode !== 'all' && t !== mode;
    });
    router.hidden = mode === 'all';
    if (mode !== 'all') {
      var last = all.filter(function (r) { return r.getAttribute('data-track') === mode; }).pop();
      last.parentNode.insertBefore(router, last.nextSibling);
      buildRouter();
    }
    all = Array.prototype.slice.call(document.querySelectorAll('[data-reel]'));
    visible = all.filter(function (r) { return !r.hidden; });
    seg.innerHTML = visible.map(function () { return '<i></i>'; }).join('');
    bits = Array.prototype.slice.call(seg.children);
    document.querySelectorAll('[data-go]').forEach(function (b) { b.classList.toggle('picked', b.getAttribute('data-go') === mode); });
    current = -1;
    check();
    renderIndex();
  }

  function firstOf(track) { return all.filter(function (r) { return r.getAttribute('data-track') === track; })[0]; }
  function go(reel, smooth) { window.scrollTo({ top: reel.offsetTop, behavior: smooth === false || reduce ? 'auto' : 'smooth' }); }

  function choose(track) {
    mode = track;
    applyMode();
    go(firstOf(track));
  }
  function showAll(target) {
    mode = 'all';
    applyMode();
    if (target) go(target);
  }

  function buildRouter() {
    var html = '';
    Object.keys(TRACKS).forEach(function (t) {
      if (t === mode) return;
      html += '<button type="button" class="path" data-route="' + t + '"><b>' + TRACKS[t] + '</b><span>Passa al percorso ' + NAMES[t].toLowerCase() + '.</span></button>';
    });
    html += '<button type="button" class="path" data-route="all"><b>Vedi tutto</b><span>Riparti dall\'inizio e scorri tutti i reel.</span></button>';
    html += '<button type="button" class="path" data-route="contact"><b>Parliamone</b><span>Vai ai contatti.</span></button>';
    routerPaths.innerHTML = html;
  }
  routerPaths.addEventListener('click', function (e) {
    var b = e.target.closest('[data-route]');
    if (!b) return;
    var r = b.getAttribute('data-route');
    if (r === 'all') showAll(all[0]);
    else if (r === 'contact') go(document.querySelector('.r-contact'));
    else choose(r);
  });
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { choose(b.getAttribute('data-go')); });
  });

  // ---------- Reel attivo ----------
  function isLight(el) {
    if (el.classList.contains('r-hero')) return false;
    var m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6;
  }
  function activate(i) {
    if (i === current) return;
    current = i;
    var r = visible[i];
    r.classList.add('on');
    bits.forEach(function (b, k) { b.classList.toggle('done', k < i); b.classList.toggle('now', k === i); });
    count.textContent = pad(i + 1) + ' / ' + pad(visible.length);
    chap.textContent = r.getAttribute('data-chapter');
    bar.classList.toggle('on-light', isLight(r));
    if (r.classList.contains('r-feed')) sortFeed(r);
    if (r.classList.contains('r-merge')) playMerge();
    renderIndex();
  }
  function check() {
    var mid = window.innerHeight / 2, best = 0;
    visible.forEach(function (r, k) {
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
  new MutationObserver(function () { if (current >= 0) bar.classList.toggle('on-light', isLight(visible[current])); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------- Feed che si ordina per affinità ----------
  function sortFeed(reel) {
    if (reel.dataset.sorted) return;
    reel.dataset.sorted = '1';
    var items = Array.prototype.slice.call(reel.querySelectorAll('.feed li'));
    var tops = items.map(function (li) { return li.offsetTop; });
    setTimeout(function () {
      items.forEach(function (li, k) {
        var target = parseInt(getComputedStyle(li).getPropertyValue('--o'), 10);
        li.style.transform = 'translateY(' + (tops[target] - tops[k]) + 'px)';
      });
    }, 900);
  }

  // ---------- Tante app, una sola ----------
  var merge = document.getElementById('merge');
  var field = document.getElementById('mergeField');
  var APPS = [
    ['Social', '#E1306C', '#F7A440'], ['Eventi', '#F06139', '#F59A5B'], ['Gruppi', '#2E9BD6', '#86CDF2'], ['Biglietti', '#BB2DCE', '#DE8BEA'],
    ['Affitti', '#8B9AA8', '#C4CDD6'], ['Coinquilini', '#C4553A', '#EB9B85'], ['Bandi', '#47566B', '#8C9AAE'], ['Corsi', '#4B9E3F', '#A3D896'],
    ['Spotted', '#D43998', '#F27BC0'], ['Mappe', '#3BAF9C', '#93DCCF'], ['Chat', '#2F86EE', '#8EC2FF'], ['Recensioni', '#E0A82E', '#F5D27A'],
    ['Sport', '#E2463F', '#F59490'], ['Locali', '#8B1EBA', '#C774E6']
  ];
  // Due anelli attorno al centro: 6 app vicine, 8 più lontane
  field.innerHTML = APPS.map(function (a, k) {
    var inner = k < 6, idx = inner ? k : k - 6, tot = inner ? 6 : 8;
    var ang = (idx / tot) * 360 + (inner ? 0 : 22.5);
    var rad = inner ? '30%' : '45%';
    var delay = (inner ? 0.25 : 0) + idx * 0.05;
    return '<span class="mt" style="--a:' + ang + 'deg;--r:calc(var(--fs) * ' + (inner ? 0.30 : 0.45) + ');--d:' + delay.toFixed(2) + 's">' +
      '<span><i style="--c:linear-gradient(145deg,' + a[1] + ',' + a[2] + ')"></i><em>' + a[0] + '</em></span></span>';
  }).join('');
  function sizeField() { field.style.setProperty('--fs', field.offsetWidth + 'px'); }
  sizeField();
  window.addEventListener('resize', sizeField);
  var mergeTimers = [];
  function playMerge() {
    mergeTimers.forEach(clearTimeout);
    merge.classList.remove('merged', 'done');
    void merge.offsetWidth;
    if (reduce) { merge.classList.add('merged', 'done'); return; }
    mergeTimers = [
      setTimeout(function () { merge.classList.add('merged'); }, 1100),
      setTimeout(function () { merge.classList.add('done'); }, 2500)
    ];
  }
  document.getElementById('mergeReplay').addEventListener('click', playMerge);

  // ---------- Folla: le persone affini si accendono ----------
  var crowd = document.getElementById('crowd');
  var aff = [3, 9, 12, 17, 22, 24, 30, 33];
  crowd.innerHTML = Array.apply(null, Array(35)).map(function (_, k) {
    return '<i' + (aff.indexOf(k) >= 0 ? ' class="aff"' : '') + ' style="--d:' + (0.4 + (k % 7) * 0.05 + Math.floor(k / 7) * 0.05).toFixed(2) + 's"></i>';
  }).join('');

  // ---------- Indice ----------
  var idx = document.getElementById('rindex');
  var list = document.getElementById('rindexList');
  var modeEl = document.getElementById('rindexMode');
  var idxBtn = document.getElementById('rindexBtn');
  // Indice a capitoli: ogni capitolo è una card che si apre e mostra i suoi reel
  var CHAPTER_DESC = {
    'Introduzione': 'Il problema e che cos\'è CEnTRO',
    'Per chi usa l\'app': 'Come funziona, Nia e le aree dell\'app',
    'Per le aziende': 'Raggiungere e capire il pubblico',
    'Per chi investe': 'Ricavi, crescita e prove',
    'Prossimo passo': 'Scegli cosa vedere ora',
    'Contatti': 'Parliamone'
  };
  var openChaps = {};
  function renderIndex() {
    var chaps = [], byName = {};
    all.forEach(function (r) {
      if (r === router && router.hidden) return;
      var c = r.getAttribute('data-chapter');
      if (!byName[c]) { byName[c] = { name: c, reels: [] }; chaps.push(byName[c]); }
      byName[c].reels.push(r);
    });
    var curChap = current >= 0 ? visible[current].getAttribute('data-chapter') : '';
    var html = '';
    chaps.forEach(function (ch, ci) {
      var off = ch.reels.every(function (r) { return r.hidden; });
      var isOpen = !!openChaps[ch.name];
      var here = ch.name === curChap;
      html += '<div class="rx-chap' + (isOpen ? ' open' : '') + (here ? ' here' : '') + (off ? ' off' : '') + '">' +
        '<button type="button" class="rx-head" data-chap="' + ch.name.replace(/"/g, '&quot;') + '" aria-expanded="' + isOpen + '">' +
          '<span class="rx-n">' + pad(ci + 1) + '</span>' +
          '<span class="rx-t"><b>' + ch.name + '</b><span>' + (CHAPTER_DESC[ch.name] || '') + (off ? ' · fuori dal percorso' : '') + '</span></span>' +
          '<span class="rx-c">' + ch.reels.length + '</span><i class="rx-chev" aria-hidden="true"></i>' +
        '</button><div class="rx-sub"><div class="rx-sub-in">';
      ch.reels.forEach(function (r) {
        var k = visible.indexOf(r);
        html += '<button type="button" class="rx-item' + (k === current ? ' now' : '') + (r.hidden ? ' off' : '') + '" data-i="' + all.indexOf(r) + '">' +
          '<b>' + r.getAttribute('data-title') + '</b><span>' + r.getAttribute('data-desc') + '</span></button>';
      });
      html += '</div></div></div>';
    });
    list.innerHTML = html;
    modeEl.innerHTML = mode === 'all'
      ? 'Stai vedendo tutto. Puoi scegliere un percorso dal reel «Chi sei?».'
      : 'Percorso: ' + NAMES[mode] + '. <button type="button" data-showall>Vedi tutto</button>';
  }
  list.addEventListener('click', function (e) {
    var h = e.target.closest('.rx-head');
    if (!h) return;
    e.stopPropagation();
    var name = h.getAttribute('data-chap');
    openChaps[name] = !openChaps[name];
    var box = h.parentNode;
    box.classList.toggle('open', openChaps[name]);
    h.setAttribute('aria-expanded', openChaps[name]);
  });
  function openIndex() {
    openChaps = {};
    if (current >= 0) openChaps[visible[current].getAttribute('data-chapter')] = true;
    renderIndex();
    idx.hidden = false; document.body.classList.add('lock');
  }
  function closeIndex() { idx.hidden = true; document.body.classList.remove('lock'); idxBtn.focus({ preventScroll: true }); }
  idxBtn.addEventListener('click', openIndex);
  idx.addEventListener('click', function (e) {
    if (e.target === idx || e.target.closest('[data-close]')) { closeIndex(); return; }
    if (e.target.closest('[data-showall]')) { closeIndex(); showAll(visible[current]); return; }
    var it = e.target.closest('.rx-item');
    if (!it) return;
    var r = all[parseInt(it.getAttribute('data-i'), 10)];
    closeIndex();
    if (r.hidden) showAll(r); else go(r);
  });

  // ---------- Strumenti Insights ----------
  document.querySelectorAll('[data-sheet]').forEach(function (btn) {
    var sheet = document.getElementById(btn.getAttribute('data-sheet'));
    btn.addEventListener('click', function () {
      sheet.hidden = false; sheet.scrollTop = 0; document.body.classList.add('lock');
      var cards = sheet.querySelectorAll('.feat');
      cards.forEach(function (c) { c.classList.remove('in'); });
      setTimeout(function () { cards.forEach(function (c) { c.classList.add('in'); }); }, 150);
    });
    sheet.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) { sheet.hidden = true; document.body.classList.remove('lock'); } });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!idx.hidden) closeIndex();
    document.querySelectorAll('.sheet').forEach(function (s) { if (!s.hidden) { s.hidden = true; document.body.classList.remove('lock'); } });
  });

  // ---------- Logo: torna all'inizio ----------
  document.getElementById('rhome').addEventListener('click', function () { go(visible[0]); });

  // ---------- Azioni sopra l'indice ----------
  idx.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (!a) return;
    var act = a.getAttribute('data-act');
    closeIndex();
    if (act === 'contact') go(document.querySelector('.r-contact'));
    else if (act === 'top') go(visible[0]);
  });

  // ---------- Aree dell'app: carosello orizzontale ----------
  var acar = document.getElementById('acarTrack');
  if (acar) {
    var acards = Array.prototype.slice.call(acar.children);
    var adots = document.getElementById('acarDots');
    adots.innerHTML = acards.map(function () { return '<i></i>'; }).join('');
    var dots = Array.prototype.slice.call(adots.children);
    var showCard = function () {
      var x = acar.scrollLeft, best = 0, bd = Infinity;
      acards.forEach(function (c, k) { var d = Math.abs(c.offsetLeft - acar.offsetLeft - 24 - x); if (d < bd) { bd = d; best = k; } });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === best); });
      if (acar.closest('.reel').classList.contains('on')) acards[best].classList.add('in');
    };
    acar.addEventListener('scroll', function () { requestAnimationFrame(showCard); }, { passive: true });
    new MutationObserver(showCard).observe(acar.closest('.reel'), { attributes: true, attributeFilter: ['class'] });
    showCard();
  }

  // ---------- Titoli parola per parola ----------
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement('span');
            w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = p;
            frag.appendChild(w);
          });
          ch.parentNode.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    })(el);
  }
  document.querySelectorAll('.reel .r-h1, .reel .r-h2, .reel .r-big').forEach(splitWords);

  applyMode();
})();
