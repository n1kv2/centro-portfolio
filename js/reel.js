// Versione a reel.
// - I reel stanno in un contenitore a schermo intero che scatta da uno all'altro (stabile anche su iPhone,
//   perché la pagina non scorre e le barre del browser non cambiano l'altezza).
// - Ogni volta che un reel diventa attivo le sue animazioni ripartono, come un video.
// - Dopo l'introduzione si sceglie un profilo: si vedono solo i suoi reel, poi un reel di direzione.
//   Senza scelta si vede tutto in ordine.
(function () {
  // Scorre la pagina vera: così Safari e Chrome riducono la loro barra mentre si scorre
  var scroller = document.scrollingElement || document.documentElement;
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
  var ss = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
             set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* niente memoria */ } },
             del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { /* niente memoria */ } } };

  // ---------- Percorsi ----------
  function applyMode(keepPos) {
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
    all.forEach(function (r) { if (r.hidden && r.classList.contains('on')) leave(r); });
    current = -1;
    if (!keepPos) check();
    renderIndex();
  }

  function firstOf(track) { return all.filter(function (r) { return r.getAttribute('data-track') === track; })[0]; }
  function go(reel, smooth) { window.scrollTo({ top: reel.offsetTop, behavior: smooth === false || reduce ? 'auto' : 'smooth' }); }

  function choose(track) { mode = track; applyMode(); go(firstOf(track)); }
  function showAll(target) { mode = 'all'; applyMode(); if (target) go(target); }

  function buildRouter() {
    var html = '';
    Object.keys(TRACKS).forEach(function (t) {
      if (t === mode) return;
      html += '<button type="button" class="path" data-route="' + t + '"><b>' + TRACKS[t] + '</b><span>Passa al percorso ' + NAMES[t].toLowerCase() + '.</span></button>';
    });
    html += '<button type="button" class="path" data-route="all"><b>Vedi tutto</b><span>Prosegui con gli altri momenti.</span></button>';
    html += '<button type="button" class="path" data-route="contact"><b>Parliamone</b><span>Vai ai contatti.</span></button>';
    routerPaths.innerHTML = html;
  }
  routerPaths.addEventListener('click', function (e) {
    var b = e.target.closest('[data-route]');
    if (!b) return;
    var r = b.getAttribute('data-route');
    if (r === 'all') {
      // Prosegue con ciò che viene dopo il percorso appena visto, non dall'inizio
      var lastSeen = all.filter(function (x) { return x.getAttribute('data-track') === mode; }).pop();
      showAll(null);
      var after = all.slice(all.indexOf(lastSeen) + 1).filter(function (x) { return !x.hidden; })[0] || all[0];
      go(after);
    }
    else if (r === 'contact') go(document.querySelector('.r-contact'));
    else choose(r);
  });
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { choose(b.getAttribute('data-go')); });
  });

  // ---------- Reel attivo: le animazioni ripartono a ogni visita ----------
  function isLight(el) {
    if (el.classList.contains('r-hero') || el.classList.contains('r-shot')) return false;
    var m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 > 0.6;
  }
  function leave(r) {
    r.classList.remove('on');
    var p = r.querySelector('.area-panel.open');
    if (p) closeArea(r);
    if (r.classList.contains('r-feed')) resetFeed(r);
    if (r.classList.contains('r-ins')) resetSearch();
    if (r.classList.contains('r-niamap')) resetMap();
    r.querySelectorAll('.feat.in').forEach(function (f) { f.classList.remove('in'); });
  }
  function activate(i) {
    if (i === current) return;
    if (current >= 0 && visible[current]) leave(visible[current]);
    current = i;
    var r = visible[i];
    void r.offsetWidth;
    r.classList.add('on');
    bits.forEach(function (b, k) { b.classList.toggle('done', k < i); b.classList.toggle('now', k === i); });
    count.textContent = pad(i + 1) + ' / ' + pad(visible.length);
    chap.textContent = r.getAttribute('data-chapter');
    bar.classList.toggle('on-light', isLight(r));
    if (r.classList.contains('r-feed')) sortFeed(r);
    if (r.classList.contains('r-merge')) { sizeField(); playMerge(); }
    if (r.classList.contains('r-ins')) playSearch();
    if (r.classList.contains('r-niamap')) demoMap();
    renderIndex();
  }
  function check() {
    var mid = window.innerHeight / 2, top = window.scrollY, best = 0;
    visible.forEach(function (r, k) { if (r.offsetTop <= top + mid && r.offsetTop + r.offsetHeight > top + mid) best = k; });
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
  var feedTimer = null;
  function sortFeed(reel) {
    var items = Array.prototype.slice.call(reel.querySelectorAll('.feed li'));
    resetFeed(reel);
    var tops = items.map(function (li) { return li.offsetTop; });
    feedTimer = setTimeout(function () {
      items.forEach(function (li, k) {
        var target = parseInt(getComputedStyle(li).getPropertyValue('--o'), 10);
        li.style.transform = 'translateY(' + (tops[target] - tops[k]) + 'px)';
      });
    }, 1100);
  }
  function resetFeed(reel) {
    clearTimeout(feedTimer);
    reel.querySelectorAll('.feed li').forEach(function (li) { li.style.transform = ''; });
  }

  // ---------- Tante app, una sola: prima si leggono i nomi, poi si uniscono ----------
  var merge = document.getElementById('merge');
  var field = document.getElementById('mergeField');
  var APPS = [
    ['Social', '#E1306C', '#F7A440'], ['Eventi', '#F06139', '#F59A5B'], ['Gruppi', '#2E9BD6', '#86CDF2'], ['Biglietti', '#BB2DCE', '#DE8BEA'],
    ['Affitti', '#8B9AA8', '#C4CDD6'], ['Coinquilini', '#C4553A', '#EB9B85'], ['Bandi', '#47566B', '#8C9AAE'], ['Corsi', '#4B9E3F', '#A3D896'],
    ['Spotted', '#D43998', '#F27BC0'], ['Mappe', '#3BAF9C', '#93DCCF'], ['Chat', '#2F86EE', '#8EC2FF'], ['Recensioni', '#E0A82E', '#F5D27A'],
    ['Sport', '#E2463F', '#F59490'], ['Locali', '#8B1EBA', '#C774E6']
  ];
  field.innerHTML = APPS.map(function (a, k) {
    var inner = k < 6, idx = inner ? k : k - 6, tot = inner ? 6 : 8;
    var ang = (idx / tot) * 360 + (inner ? 0 : 22.5);
    var delay = (inner ? 0.25 : 0) + idx * 0.05;
    return '<span class="mt" style="--a:' + ang + 'deg;--r:calc(var(--fs) * ' + (inner ? 0.27 : 0.45) + ');--d:' + delay.toFixed(2) + 's">' +
      '<span><i style="--c:linear-gradient(145deg,' + a[1] + ',' + a[2] + ')"></i><em>' + a[0] + '</em></span></span>';
  }).join('');
  // Le app si adattano allo spazio realmente disponibile (schermi bassi, barre del browser)
  function sizeField() {
    var box = merge.getBoundingClientRect();
    var size = Math.max(200, Math.min(box.width * 0.9, box.height - 40, 340));
    field.style.width = size + 'px';
    field.style.setProperty('--fs', size + 'px');
  }
  sizeField();
  window.addEventListener('resize', sizeField);
  var mergeTimers = [];
  function playMerge() {
    mergeTimers.forEach(clearTimeout);
    // Le app tornano al loro posto senza animazione, poi la scena riparte
    merge.classList.add('reset');
    merge.classList.remove('merged', 'done');
    void merge.offsetWidth;
    merge.classList.remove('reset');
    if (reduce) { merge.classList.add('merged', 'done'); return; }
    mergeTimers = [
      setTimeout(function () { merge.classList.add('merged'); }, 3200),
      setTimeout(function () { merge.classList.add('done'); }, 4700)
    ];
  }
  document.getElementById('mergeReplay').addEventListener('click', playMerge);

  // ---------- Folla: le persone affini si accendono ----------
  var crowd = document.getElementById('crowd');
  var aff = [3, 9, 12, 17, 22, 24, 30, 33];
  crowd.innerHTML = Array.apply(null, Array(35)).map(function (_, k) {
    return '<i' + (aff.indexOf(k) >= 0 ? ' class="aff"' : '') + ' style="--d:' + (0.4 + (k % 7) * 0.05 + Math.floor(k / 7) * 0.05).toFixed(2) + 's"></i>';
  }).join('');

  // ---------- Nia: la mappa che avvicina ciò che ti somiglia ----------
  var nmNodes = document.getElementById('nmNodes');
  var nmChips = document.getElementById('nmChips');
  var nmPick = document.getElementById('nmPick');
  var ITEMS = {
    arte:     { img: 'img/inaugurazione.jpg', title: "Inaugurazione di uno spazio d'arte", meta: 'Stasera · 19:30 · 0,6 km', angle: -100, why: ["Ami l'arte contemporanea", 'Stasera sei libero dopo le 19', '4 persone affini ci vanno'] },
    musica:   { img: 'img/discoteca.jpg', title: 'Serata in musica con un gruppo di sei', meta: 'Stasera · 23:00 · centro', angle: -40, why: ['Ti piace ballare', 'Gruppo con gusti simili', 'Rientro a piedi'] },
    calcetto: { img: 'img/calcetto.jpg', title: 'Calcetto, manca un giocatore', meta: 'Stasera · 20:00 · quartiere', angle: 10, why: ['Fai sport di squadra', 'Livello simile al tuo', 'Ti aspettano in 9'] },
    lingue:   { img: 'img/lingue.jpg', title: 'Conversazione in inglese sotto i portici', meta: 'Domani · 18:00 · centro', angle: 60, why: ['Ami i piccoli gruppi', "Vuoi migliorare l'inglese", '5 persone affini'] },
    ceramica: { img: 'img/ceramica.jpg', title: 'Laboratorio di ceramica per principianti', meta: 'Sabato · 10:00 · 1,2 km', angle: 110, why: ['Ami le attività manuali', 'Pensato per chi inizia', 'Sabato mattina'] },
    trekking: { img: 'img/trekking.jpg', title: "Escursione all'alba", meta: 'Domenica · 6:00 · 8 posti', angle: 160, why: ["Ti rigenera l'aria aperta", 'Intensità media', 'Gruppo affine'] },
    casa:     { img: 'img/area-casa.jpg', title: 'Stanza con coinquilini affini', meta: 'Centro · 3 coinquilini', angle: 205, why: ['Cerchi casa in centro', 'Convivenza compatibile', 'Nessun fumatore'] },
    bando:    { img: 'img/area-esplora.jpg', title: 'Bando per giovani creativi', meta: 'Opportunità · scade tra 12 giorni', angle: 245, why: ['Requisiti soddisfatti', 'In linea con la tua creatività', 'Ti avviso prima'] }
  };
  var INTENTS = [
    ['Uscire stasera',     { arte: 94, musica: 88, calcetto: 82, lingue: 60, ceramica: 45, trekking: 35, casa: 15, bando: 20 }],
    ['Conoscere persone',  { lingue: 95, calcetto: 87, trekking: 80, arte: 70, musica: 66, ceramica: 55, casa: 30, bando: 18 }],
    ['Imparare qualcosa',  { ceramica: 96, lingue: 88, bando: 70, arte: 66, trekking: 45, calcetto: 25, musica: 22, casa: 12 }],
    ["Stare all'aperto",   { trekking: 97, calcetto: 78, lingue: 40, ceramica: 30, arte: 25, bando: 22, musica: 20, casa: 10 }],
    ['Trovare casa',       { casa: 93, lingue: 30, bando: 25, ceramica: 22, arte: 20, trekking: 18, calcetto: 15, musica: 12 }],
    ['Opportunità',        { bando: 92, ceramica: 58, lingue: 55, arte: 50, trekking: 30, calcetto: 20, musica: 15, casa: 12 }]
  ];
  var ids = Object.keys(ITEMS), nodes = {}, scores = {}, activeIntent = null, mapTimer = null;
  for (var d = 0; d < 14; d++) {
    var sp = document.createElement('span'); sp.className = 'dust';
    var ang0 = (d * 137.5) * Math.PI / 180, rad0 = 22 + (d * 23 % 24);
    sp.style.left = (50 + rad0 * Math.cos(ang0)) + '%'; sp.style.top = (50 + rad0 * Math.sin(ang0)) + '%';
    nmNodes.appendChild(sp);
  }
  ids.forEach(function (id) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'node'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<img src="' + ITEMS[id].img + '" alt="">';
    nmNodes.appendChild(b); nodes[id] = b;
  });
  // Barra di ricerca: Nia scrive da sola cosa stai cercando, poi la mappa si aggiorna
  nmChips.innerHTML = '<div class="is-bar nm-bar"><span class="is-q" id="nmQ"></span><i class="is-caret"></i></div>';
  var nmQ = document.getElementById('nmQ');
  var typeT = [];
  var chipEls = [];
  function placeNodes() {
    ids.forEach(function (id, i) {
      var n = nodes[id], sc = activeIntent !== null ? scores[id] : 0, lit = activeIntent !== null && sc >= 55;
      var r = lit ? 16 + (100 - sc) * 0.42 : 36 + (i * 17 % 9);
      var a = ITEMS[id].angle * Math.PI / 180;
      n.style.left = (50 + r * Math.cos(a)) + '%'; n.style.top = (50 + r * Math.sin(a)) + '%';
      n.style.setProperty('--z', lit ? (sc >= 85 ? '54px' : sc >= 70 ? '46px' : '38px') : '14px');
      n.classList.toggle('lit', lit);
    });
  }
  function showIntent(k) {
    activeIntent = k; scores = INTENTS[k][1];
    placeNodes();
    pickNode(ids.slice().sort(function (a, b) { return scores[b] - scores[a]; })[0]);
  }
  function setIntent(k) {
    typeT.forEach(clearTimeout); typeT = [];
    var text = INTENTS[k][0];
    if (reduce) { nmQ.textContent = text; showIntent(k); return; }
    nmQ.textContent = '';
    // Mentre Nia scrive, le proposte tornano puntini grigi
    activeIntent = null;
    ids.forEach(function (x) { nodes[x].classList.remove('sel'); });
    placeNodes();
    nmPick.classList.add('empty');
    nmPick.innerHTML = '<p class="pick-hint">Nia sta cercando…</p>';
    for (var c = 1; c <= text.length; c++) {
      (function (n) { typeT.push(setTimeout(function () { nmQ.textContent = text.slice(0, n); }, n * 55)); })(c);
    }
    typeT.push(setTimeout(function () { showIntent(k); }, text.length * 55 + 250));
  }
  function pickNode(id) {
    if (activeIntent === null || scores[id] < 55) return;
    ids.forEach(function (k) { nodes[k].classList.toggle('sel', k === id); });
    var it = ITEMS[id], sc = scores[id];
    nmPick.classList.remove('empty');
    nmPick.innerHTML = '<img class="pick-img" src="' + it.img + '" alt="">' +
      '<div class="pick-main"><span class="pick-title">' + it.title + '</span><span class="pick-meta">' + it.meta + '</span>' +
      '<span class="aff"><i style="--a:' + sc + '%"></i>' + sc + '% affine</span></div>';
  }
  function resetMap() {
    clearTimeout(mapTimer); activeIntent = null;
    typeT.forEach(clearTimeout); typeT = []; nmQ.textContent = '';
    ids.forEach(function (k) { nodes[k].classList.remove('sel'); });
    placeNodes();
    nmPick.classList.add('empty');
    nmPick.innerHTML = '<p class="pick-hint">Nia sta leggendo il tuo profilo…</p>';
  }
  // Sequenza automatica: ogni scelta resta qualche secondo, poi passa alla successiva, all'infinito
  function demoMap() {
    resetMap();
    var k = 0;
    var step = function () { setIntent(k); k = (k + 1) % INTENTS.length; mapTimer = setTimeout(step, 4000); };
    mapTimer = setTimeout(step, 1000);
  }
  resetMap();

  // ---------- Aree: pannello "Approfondisci" ----------
  function openArea(reel) {
    var p = reel.querySelector('.area-panel');
    p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
    reel.classList.add('panel-open');
    bar.classList.toggle('on-light', isLight(p));
    var f = p.querySelector('.feat'); f.classList.remove('in'); void f.offsetWidth;
    setTimeout(function () { f.classList.add('in'); }, 250);
  }
  function closeArea(reel) {
    var p = reel.querySelector('.area-panel');
    p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
    reel.classList.remove('panel-open');
    if (visible[current] === reel) bar.classList.toggle('on-light', isLight(reel));
  }
  document.querySelectorAll('[data-area-open]').forEach(function (b) { b.addEventListener('click', function () { openArea(b.closest('.reel')); }); });
  // La scheda si chiude con un solo tocco, ovunque
  document.querySelectorAll('[data-area-close]').forEach(function (p) { p.addEventListener('click', function () { closeArea(p.closest('.reel')); }); });

  // ---------- Insights: la ricerca si scrive da sola ----------
  var isQ = document.getElementById('isQ');
  var insReel = document.querySelector('.r-ins');
  var QUERY = 'Corso di ceramica a L\'Aquila';
  var typeTimers = [];
  function resetSearch() { typeTimers.forEach(clearTimeout); typeTimers = []; isQ.textContent = ''; insReel.classList.remove('found'); }
  function playSearch() {
    resetSearch();
    if (reduce) { isQ.textContent = QUERY; insReel.classList.add('found'); return; }
    for (var c = 1; c <= QUERY.length; c++) {
      (function (n) { typeTimers.push(setTimeout(function () { isQ.textContent = QUERY.slice(0, n); }, 700 + n * 55)); })(c);
    }
    typeTimers.push(setTimeout(function () { insReel.classList.add('found'); }, 900 + QUERY.length * 55));
  }

  // ---------- Indice a capitoli ----------
  var idx = document.getElementById('rindex');
  var list = document.getElementById('rindexList');
  var modeEl = document.getElementById('rindexMode');
  var idxBtn = document.getElementById('rindexBtn');
  var CHAPTER_DESC = {
    'Introduzione': 'Il problema e che cos\'è CEnTRO',
    'Per chi usa l\'app': 'Come funziona e Nia',
    'Le aree dell\'app': 'Eventi, Community, Spotted, Esplora, Casa',
    'Per le aziende': 'Discover, strumenti e Insights',
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
      html += '<div class="rx-chap' + (isOpen ? ' open' : '') + (ch.name === curChap ? ' here' : '') + (off ? ' off' : '') + '">' +
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
      ? 'Stai vedendo tutto. Puoi scegliere un percorso dal momento «Chi sei?».'
      : 'Percorso: ' + NAMES[mode] + '. <button type="button" data-showall>Vedi tutto</button>';
  }
  list.addEventListener('click', function (e) {
    var h = e.target.closest('.rx-head');
    if (!h) return;
    e.stopPropagation();
    var name = h.getAttribute('data-chap');
    openChaps[name] = !openChaps[name];
    h.parentNode.classList.toggle('open', openChaps[name]);
    h.setAttribute('aria-expanded', openChaps[name]);
  });
  function openIndex() {
    openChaps = {};
    if (current >= 0) openChaps[visible[current].getAttribute('data-chapter')] = true;
    renderIndex();
    idx.hidden = false;
  }
  function closeIndex() { idx.hidden = true; idxBtn.focus({ preventScroll: true }); }
  idxBtn.addEventListener('click', openIndex);
  idx.addEventListener('click', function (e) {
    if (e.target === idx || e.target.closest('[data-close]')) { closeIndex(); return; }
    if (e.target.closest('[data-showall]')) { closeIndex(); showAll(visible[current]); return; }
    var a = e.target.closest('[data-act]');
    if (a) {
      closeIndex();
      if (a.getAttribute('data-act') === 'contact') go(document.querySelector('.r-contact'));
      else go(visible[0]);
      return;
    }
    var it = e.target.closest('.rx-item');
    if (!it) return;
    var r = all[parseInt(it.getAttribute('data-i'), 10)];
    closeIndex();
    if (r.hidden) showAll(r); else go(r);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!idx.hidden) closeIndex();
    document.querySelectorAll('.area-panel.open').forEach(function (p) { closeArea(p.closest('.reel')); });
  });

  // ---------- Logo: torna all'inizio ----------
  document.getElementById('rhome').addEventListener('click', function () { go(visible[0]); });

  // ---------- Pagine separate: al ritorno si riparte dallo stesso reel ----------
  document.querySelectorAll('[data-keep]').forEach(function (a) {
    a.addEventListener('click', function () { ss.set('reel-pos', JSON.stringify({ mode: mode, i: current })); });
  });

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

  // ---------- Altezza reale dello schermo ----------
  // Su iPhone (Safari) la pagina continua sotto la barra ridotta: lo schermo visibile è più alto
  // della misura standard. Ogni momento usa quindi l'altezza visibile più grande vista finora,
  // e finché la barra è aperta tiene i contenuti sopra di essa.
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:-9999px;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  var fullH = 0, lastW = window.innerWidth;
  function viewH() { return Math.round(window.visualViewport ? window.visualViewport.height : window.innerHeight); }
  function fitHeight() {
    if (window.innerWidth !== lastW) { fullH = 0; lastW = window.innerWidth; } // rotazione: si ricomincia
    var now = Math.max(viewH(), window.innerHeight);
    var prev = fullH;
    fullH = Math.max(fullH, now, probe.offsetHeight);
    var root = document.body.style;
    root.setProperty('--reel-h', fullH + 'px');
    root.setProperty('--bar-gap', Math.max(0, fullH - now) + 'px');
    if (fullH !== prev && current >= 0 && visible[current]) window.scrollTo(0, visible[current].offsetTop);
  }
  fitHeight();
  window.addEventListener('resize', fitHeight);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitHeight);
  window.addEventListener('scroll', function () { if (viewH() > fullH) fitHeight(); }, { passive: true });

  // ---------- Avvio ----------
  var saved = null;
  try { saved = JSON.parse(ss.get('reel-pos') || 'null'); } catch (e) { saved = null; }
  ss.del('reel-pos');
  if (saved && (saved.mode === 'all' || TRACKS[saved.mode])) {
    mode = saved.mode;
    applyMode(true);
    var target = visible[Math.min(saved.i, visible.length - 1)] || visible[0];
    window.scrollTo(0, target.offsetTop);
    check();
  } else {
    applyMode();
  }
})();
