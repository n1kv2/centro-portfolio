// Versione a reel.
// - I reel stanno in un contenitore a schermo intero che scatta da uno all'altro (stabile anche su iPhone,
//   perché la pagina non scorre e le barre del browser non cambiano l'altezza).
// - Ogni volta che un reel diventa attivo le sue animazioni ripartono, come un video.
// - Dopo l'introduzione si sceglie un profilo: si vedono solo i suoi reel, poi un reel di direzione.
//   Senza scelta si vede tutto in ordine.
(function () {
  // I momenti scorrono dentro un contenitore alto quanto l'area visibile: l'altezza non cambia mai,
  // quindi lo scatto è fluido anche quando Safari apre o chiude la sua barra.
  var scroller = document.getElementById('reels');
  var all = Array.prototype.slice.call(document.querySelectorAll('[data-reel]'));
  var seg = document.getElementById('rseg');
  var chap = document.getElementById('rchap');
  var bar = document.getElementById('rbar');
  var router = document.getElementById('router');
  var routerPaths = document.getElementById('routerPaths');
  var TRACKS = { utente: 'Per chi usa l\'app', azienda: 'Per le aziende', investitore: 'Per chi investe' };
  var NAMES = { utente: 'Utente', azienda: 'Azienda', investitore: 'Investitore' };
  var mode = 'all';
  var visible = [], bits = [], chapters = [], current = -1;
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
    // Sei segmenti fissi, uno per sezione: non cambiano mai, anche quando si sceglie un percorso.
    // Le sezioni saltate restano vuote; "Prossimo passo" conta come parte del percorso scelto.
    var names = [];
    all.forEach(function (r) { var c = r.getAttribute('data-chapter'); if (c !== 'Prossimo passo' && names.indexOf(c) < 0) names.push(c); });
    chapters = names.map(function (n) { return { name: n, reels: visible.filter(function (r) { return r.getAttribute('data-chapter') === n; }) }; });
    if (!bits.length) {
      seg.innerHTML = chapters.map(function (c) { return '<i title="' + c.name.replace(/"/g, '&quot;') + '"></i>'; }).join('');
      bits = Array.prototype.slice.call(seg.children);
    }
    document.querySelectorAll('[data-go]').forEach(function (b) { b.classList.toggle('picked', b.getAttribute('data-go') === mode); });
    all.forEach(function (r) { if (r.hidden && r.classList.contains('on')) leave(r); });
    current = -1;
    if (typeof fitAll === 'function') fitAll();
    if (!keepPos) check();
    renderIndex();
  }

  function firstOf(track) { return all.filter(function (r) { return r.getAttribute('data-track') === track; })[0]; }
  // Spostamento animato (rotella, frecce, indice, logo): lo scatto si sospende un istante, poi torna
  var goTimer = null;
  function go(reel, smooth) {
    var target = reel.offsetTop, h = scroller.clientHeight || 1;
    // Un momento più in là: scorrimento morbido. Salti lunghi (menu, scelte): spostamento diretto, niente attese
    var instant = smooth === false || reduce || Math.abs(target - scroller.scrollTop) > h * 1.5;
    clearTimeout(goTimer);
    cancelAnimationFrame(goRaf);
    scroller.style.scrollSnapType = 'none';
    scroller.scrollTo({ top: target, behavior: instant ? 'auto' : 'smooth' });
    var t0 = Date.now();
    var done = function () { cancelAnimationFrame(goRaf); scroller.style.scrollSnapType = ''; };
    var watch = function () {
      if (Math.abs(scroller.scrollTop - target) < 1 || Date.now() - t0 > 1200) { done(); return; }
      goRaf = requestAnimationFrame(watch);
    };
    goRaf = requestAnimationFrame(watch);
  }
  var goRaf = 0;

  function choose(track) { mode = track; applyMode(); go(firstOf(track)); }
  function showAll(target) { mode = 'all'; applyMode(); if (target) go(target); }

  function buildRouter() {
    var html = '';
    Object.keys(TRACKS).forEach(function (t) {
      if (t === mode) return;
      html += '<button type="button" class="path" data-route="' + t + '"><b>' + TRACKS[t] + '</b><span>Passa al percorso ' + NAMES[t].toLowerCase() + '.</span></button>';
    });
    html += '<button type="button" class="path" data-route="contact"><b>Il prossimo passo</b><span>Prova l\'app o contattami.</span></button>';
    routerPaths.innerHTML = html;
  }
  routerPaths.addEventListener('click', function (e) {
    var b = e.target.closest('[data-route]');
    if (!b) return;
    var r = b.getAttribute('data-route');
    if (r === 'contact') go(document.querySelector('.r-contact'));
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
    if (r.classList.contains('r-tools')) resetTools();
    if (r.classList.contains('r-overview') && deck) stopDeck();
    if (r.classList.contains('r-contact') && cbox) contactTab('');
    r.querySelectorAll('.feat.in').forEach(function (f) { f.classList.remove('in'); });
  }
  function activate(i) {
    if (i === current) return;
    if (current >= 0 && visible[current]) leave(visible[current]);
    current = i;
    var r = visible[i];
    void r.offsetWidth;
    r.classList.add('on');
    // Ogni sezione si riempie man mano che scorri i suoi momenti
    var ci = 0, isRouter = r === router;
    chapters.forEach(function (c, k) { if (c.reels.indexOf(r) >= 0 || (isRouter && c.name === TRACKS[mode])) ci = k; });
    bits.forEach(function (b, k) {
      var c = chapters[k];
      var p = k < ci ? 1 : k > ci ? 0 : isRouter ? 1 : (c.reels.indexOf(r) + 1) / Math.max(1, c.reels.length);
      b.style.setProperty('--p', p.toFixed(3));
      b.classList.toggle('now', k === ci);
    });
    chap.textContent = r.getAttribute('data-chapter');
    bar.classList.toggle('on-light', isLight(r));
    if (r.classList.contains('r-feed')) sortFeed(r);
    if (r.classList.contains('r-merge')) { sizeField(); playMerge(); }
    if (r.classList.contains('r-ins')) playSearch();
    if (r.classList.contains('r-niamap')) demoMap();
    if (r.classList.contains('r-tools')) playTools();
    if (r.classList.contains('r-overview') && deck) playDeck();

    if (navOpen) renderIndex();
  }
  function check() {
    var mid = scroller.clientHeight / 2, top = scroller.scrollTop, best = 0;
    visible.forEach(function (r, k) { if (r.offsetTop <= top + mid && r.offsetTop + r.offsetHeight > top + mid) best = k; });
    activate(best);
  }
  var ticking = false;
  scroller.addEventListener('scroll', function () {
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
      // Si uniscono quasi subito, così si vede prima di scorrere oltre
      setTimeout(function () { merge.classList.add('merged'); }, 900),
      setTimeout(function () { merge.classList.add('done'); }, 2000)
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
    arte:     { img: 'img/inaugurazione.jpg', title: "Inaugurazione di uno spazio d'arte", meta: 'Stasera · 19:30 · 0,6 km', angle: -150, why: ["Ami l'arte contemporanea", 'Stasera sei libero dopo le 19', '4 persone affini ci vanno'] },
    musica:   { img: 'img/discoteca.jpg', title: 'Serata in musica con un gruppo di sei', meta: 'Stasera · 23:00 · centro', angle: -30, why: ['Ti piace ballare', 'Gruppo con gusti simili', 'Rientro a piedi'] },
    calcetto: { img: 'img/calcetto.jpg', title: 'Calcetto, manca un giocatore', meta: 'Stasera · 20:00 · quartiere', angle: 10, why: ['Fai sport di squadra', 'Livello simile al tuo', 'Ti aspettano in 9'] },
    lingue:   { img: 'img/lingue.jpg', title: 'Conversazione in inglese sotto i portici', meta: 'Domani · 18:00 · centro', angle: 60, why: ['Ami i piccoli gruppi', "Vuoi migliorare l'inglese", '5 persone affini'] },
    ceramica: { img: 'img/ceramica.jpg', title: 'Laboratorio di ceramica per principianti', meta: 'Sabato · 10:00 · 1,2 km', angle: 110, why: ['Ami le attività manuali', 'Pensato per chi inizia', 'Sabato mattina'] },
    trekking: { img: 'img/trekking.jpg', title: "Escursione all'alba", meta: 'Domenica · 6:00 · 8 posti', angle: 160, why: ["Ti rigenera l'aria aperta", 'Intensità media', 'Gruppo affine'] },
    casa:     { img: 'img/area-casa.jpg', title: 'Stanza con coinquilini affini', meta: 'Centro · 3 coinquilini', angle: 205, why: ['Cerchi casa in centro', 'Convivenza compatibile', 'Nessun fumatore'] },
    bando:    { img: 'img/area-esplora.jpg', title: 'Bando per giovani creativi', meta: 'Opportunità · scade tra 12 giorni', angle: 215, why: ['Requisiti soddisfatti', 'In linea con la tua creatività', 'Ti avviso prima'] }
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
  ids.forEach(function (id) {
    var b = document.createElement('span');
    b.className = 'node'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<img src="' + ITEMS[id].img + '" alt="">';
    nmNodes.appendChild(b); nodes[id] = b;
  });
  // Barra di ricerca: Nia scrive da sola cosa stai cercando, poi la mappa si aggiorna
  nmChips.innerHTML = '<div class="is-bar nm-bar"><span class="is-q" id="nmQ"></span><i class="is-caret"></i></div>';
  var nmQ = document.getElementById('nmQ');
  var typeT = [];
  function placeNodes() {
    ids.forEach(function (id, i) {
      var n = nodes[id], sc = activeIntent !== null ? scores[id] : 0, lit = activeIntent !== null && sc >= 55;
      // Ogni proposta finisce nella zona della sua affinità: dentro "molto affine" (≥85), "affine" (70–84), "da esplorare" (55–69)
      var r = !lit ? 40 + (i * 17 % 6)
        : sc >= 85 ? 12 + (100 - sc) * 0.35
        : sc >= 70 ? 20.5 + (84 - sc) * 0.6
        : 34 + (69 - sc) * 0.55;
      var a = ITEMS[id].angle * Math.PI / 180;
      n.style.left = (50 + r * Math.cos(a)) + '%'; n.style.top = (50 + r * Math.sin(a)) + '%';
      n.style.setProperty('--z', lit ? (sc >= 85 ? '36px' : sc >= 70 ? '31px' : '27px') : '8px');
      n.classList.toggle('lit', lit);
    });
  }
  // Il radar resta sempre visibile e fermo; in basso "Sto cercando" lascia il posto alla proposta scelta
  var nmStage = document.getElementById('nmStage');
  var nmMap = document.getElementById('nmMap');
  var nmSlot = document.getElementById('nmSlot');
  function sizeNia() {
    var side = Math.floor(Math.min(nmStage.clientWidth, nmStage.clientHeight));
    if (side > 0) nmMap.style.setProperty('--sq', side + 'px');
  }
  window.addEventListener('resize', sizeNia);
  function hidePick() { nmSlot.classList.remove('found'); }
  function showIntent(k) {
    activeIntent = k; scores = INTENTS[k][1];
    placeNodes();
    pickNode(ids.slice().sort(function (a, b) { return scores[b] - scores[a]; })[0]);
  }
  function collapseMap() {
    activeIntent = null;
    ids.forEach(function (x) { nodes[x].classList.remove('sel'); });
    placeNodes();
    hidePick();
  }
  function setIntent(k) {
    typeT.forEach(clearTimeout); typeT = [];
    var text = INTENTS[k][0];
    sizeNia();
    if (reduce) { nmQ.textContent = text; showIntent(k); return; }
    collapseMap();
    nmQ.textContent = '';
    for (var c = 1; c <= text.length; c++) {
      (function (n) { typeT.push(setTimeout(function () { nmQ.textContent = text.slice(0, n); }, 200 + n * 55)); })(c);
    }
    typeT.push(setTimeout(function () { showIntent(k); }, 200 + text.length * 55 + 450));
  }
  function pickNode(id) {
    if (activeIntent === null || scores[id] < 55) return;
    ids.forEach(function (k) { nodes[k].classList.toggle('sel', k === id); });
    var it = ITEMS[id], sc = scores[id];
    nmPick.innerHTML = '<img class="pick-img" src="' + it.img + '" alt="">' +
      '<div class="pick-main"><span class="pick-title">' + it.title + '</span><span class="pick-meta">' + it.meta + '</span>' +
      '<span class="aff"><i style="--a:' + sc + '%"></i>' + sc + '% affine</span></div>';
    nmSlot.classList.add('found');
  }
  function resetMap() {
    clearTimeout(mapTimer); clearTimeout(introTimer);
    if (niaReel) niaReel.classList.remove('intro-done');
    typeT.forEach(clearTimeout); typeT = []; nmQ.textContent = '';
    collapseMap();
  }
  // Sequenza automatica: ogni ricerca resta qualche secondo, poi si richiude e parte la successiva
  var niaReel = document.querySelector('.r-niamap'), introTimer = null;
  function demoMap() {
    resetMap();
    // Prima il titolo al centro, poi sfuma e lascia il posto al radar
    niaReel.classList.remove('intro-done');
    clearTimeout(introTimer);
    introTimer = setTimeout(function () { niaReel.classList.add('intro-done'); sizeNia(); }, reduce ? 0 : 1900);
    var k = 0;
    var step = function () { setIntent(k); k = (k + 1) % INTENTS.length; mapTimer = setTimeout(step, 6000); };
    mapTimer = setTimeout(step, reduce ? 0 : 2600);
  }
  resetMap();

  // ---------- Le aree in breve: toccando un'area si va al suo momento ----------
  document.querySelectorAll('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-goto');
      var r = all.filter(function (x) { return x.getAttribute('data-title') === t; })[0];
      if (!r) return;
      if (r.hidden) showAll(r); else go(r);
    });
  });

  // ---------- Le aree come un mazzo di card ----------
  // Un giro automatico: la card davanti viene scartata e avanza la successiva. Finito il giro le card
  // si dissolvono e restano i nomi delle aree, disposti con calma attorno all'icona di CEnTRO.
  var deck = document.getElementById('deck2');
  var deckCards = deck ? Array.prototype.slice.call(deck.querySelectorAll('.dc')) : [];
  var deckTimer = null, deckEnd = null, deckOrder = deckCards.slice(), DECK_STEP = 2100;
  function deckLayout() {
    deck.classList.remove('done');
    deckOrder.forEach(function (c, k) { c.setAttribute('data-pos', Math.min(k, 3)); c.classList.remove('out', 'back'); });
  }
  function deckNext() {
    var top = deckOrder[0];
    top.classList.add('out');
    deckOrder.push(deckOrder.shift());
    deckOrder.slice(0, -1).forEach(function (c, k) { c.setAttribute('data-pos', Math.min(k, 3)); });
    // finita l'uscita, la card scartata torna in fondo al mazzo senza farsi vedere
    setTimeout(function () { top.classList.add('back'); top.classList.remove('out'); top.setAttribute('data-pos', 3); void top.offsetWidth; top.classList.remove('back'); }, 650);
  }
  function stopDeck() { clearInterval(deckTimer); clearTimeout(deckEnd); deckTimer = null; }
  function playDeck() {
    stopDeck();
    deckOrder = deckCards.slice(); deckLayout();
    if (reduce) { deck.classList.add('done'); return; }
    var n = 0;
    deckTimer = setInterval(function () {
      deckNext();
      // arrivati all'ultima card (Spotted) si resta un attimo, poi il finale: niente ritorno alla prima
      if (++n >= deckCards.length - 1) {
        clearInterval(deckTimer); deckTimer = null;
        deckEnd = setTimeout(function () { deck.classList.add('done'); }, DECK_STEP);
      }
    }, DECK_STEP);
  }
  if (deck) deckLayout();

  // ---------- Strumenti per le aziende: le spunte si completano una dopo l'altra, ogni voce si apre ----------
  var tks = document.getElementById('tks');
  var tkTimers = [];
  function resetTools() {
    tkTimers.forEach(clearTimeout); tkTimers = [];
    tks.querySelectorAll('.tk').forEach(function (t) { t.classList.remove('ok', 'open'); t.querySelector('.tk-h').setAttribute('aria-expanded', 'false'); });
  }
  function playTools() {
    resetTools();
    tks.querySelectorAll('.tk').forEach(function (t, k) {
      if (reduce) { t.classList.add('ok'); return; }
      tkTimers.push(setTimeout(function () { t.classList.add('ok'); }, 700 + k * 420));
    });
  }
  tks.addEventListener('click', function (e) {
    var h = e.target.closest('.tk-h');
    if (!h) return;
    var t = h.parentNode, open = !t.classList.contains('open');
    tks.querySelectorAll('.tk.open').forEach(function (x) { x.classList.remove('open'); x.querySelector('.tk-h').setAttribute('aria-expanded', 'false'); });
    t.classList.toggle('open', open); t.classList.add('ok');
    h.setAttribute('aria-expanded', open);
  });

  // ---------- Spotted: richieste diverse nello stesso riquadro (in blu quelle dell'utente) ----------
  var vizSpot = document.getElementById('vizSpot');
  var SPOT = [
    [['q', 'Qualcuno ha perso le chiavi a Coppito?'], ['a', 'Sì, sono mie! Dove le trovo?'], ['q', 'In portineria, all’ingresso.'], 'Risolto in pochi minuti dalla community'],
    [['a', 'Cerco un passaggio per Pescara sabato.'], ['q', 'C’è un gruppo per Pescara: chiedi lì!'], ['q', 'Partiamo in tre, c’è posto.'], 'La richiesta trova il gruppo giusto'],
    [['q', 'Una pasticceria per una torta di laurea?'], ['a', 'Quella sotto i portici: la mia era perfetta!'], ['q', 'Grazie, ci passo domani.'], 'Un consiglio dato a chi lo chiedeva']
  ];
  var spotK = 0, spotTimer = null;
  function renderSpot(k) {
    var c = SPOT[k];
    vizSpot.innerHTML = c.slice(0, 3).map(function (m) { return '<p class="vs-' + m[0] + '">' + m[1] + '</p>'; }).join('') + '<p class="vf-cap">' + c[3] + '</p>';
  }
  function stopSpot() { clearInterval(spotTimer); spotTimer = null; }
  // Il riquadro prende l'altezza della conversazione più lunga: niente spazio vuoto, niente scatti al cambio
  function sizeSpot() {
    vizSpot.style.height = '';
    var h = 0;
    for (var i = 0; i < SPOT.length; i++) { renderSpot(i); h = Math.max(h, vizSpot.offsetHeight); }
    vizSpot.style.boxSizing = 'border-box'; vizSpot.style.height = h + 'px';
  }
  function playSpot() {
    stopSpot();
    sizeSpot();
    spotK = 0; renderSpot(0);
    vizSpot.classList.add('cyc'); vizSpot.classList.remove('go'); void vizSpot.offsetWidth;
    setTimeout(function () { vizSpot.classList.add('go'); }, 300);
    spotTimer = setInterval(function () {
      vizSpot.classList.remove('go');
      setTimeout(function () { spotK = (spotK + 1) % SPOT.length; renderSpot(spotK); void vizSpot.offsetWidth; vizSpot.classList.add('go'); }, 380);
    }, 5200);
  }
  if (vizSpot) renderSpot(0);

  // ---------- Aree: pannello "Approfondisci" ----------
  function openArea(reel) {
    var p = reel.querySelector('.area-panel');
    p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
    reel.classList.add('panel-open');
    bar.classList.toggle('on-light', isLight(p));
    var f = p.querySelector('.feat'); f.classList.remove('in'); void f.offsetWidth;
    setTimeout(function () { f.classList.add('in'); }, 250);
    if (p.contains(vizSpot)) playSpot();
  }
  function closeArea(reel) {
    var p = reel.querySelector('.area-panel');
    p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
    reel.classList.remove('panel-open');
    if (p.contains(vizSpot)) stopSpot();
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
    typeTimers.push(setTimeout(function () { insReel.classList.add('found'); }, 1400 + QUERY.length * 55));
  }

  // ---------- Sezioni: la barra in alto si allarga al tocco ----------
  var navList = document.getElementById('rnavList');
  var toggle = document.getElementById('rtoggle');
  var navOpen = false, openTop = 0;
  var navChaps = [];
  // Icone delle sezioni (tratto sottile, del colore del testo)
  var ICON_PATHS = {
    'Introduzione': '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',
    'Per chi usa l\'app': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    'Le aree dell\'app': '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
    'Per le aziende': '<path d="M4 10l1.5-5h13L20 10"/><path d="M4 10c0 1.7 1.3 2.5 2.7 2.5S9.3 11.7 9.3 10c0 1.7 1.3 2.5 2.7 2.5s2.7-.8 2.7-2.5c0 1.7 1.3 2.5 2.7 2.5S20 11.7 20 10"/><path d="M5.5 12.5V20h13v-7.5"/>',
    'Per chi investe': '<path d="M4 19h16"/><path d="M5 15l4.5-4.5 3.5 3L19 7.5"/><path d="M14.5 7.5H19V12"/>',
    'Prossimo passo': '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    'Contatti': '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M4.5 7.5l7.5 5.5 7.5-5.5"/>',
    'Chi sono': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.3c1.2-2 3.2-3.1 5.5-3.1s4.3 1.1 5.5 3.1"/>'
  };
  // Tema: il tasto passa da chiaro a scuro e viceversa (sole per tornare al chiaro, luna per lo scuro)
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>';
  var MOON = '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>';
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function themeBtn() {
    var dark = isDark();
    return '<button type="button" class="rnav-item rnav-link rnav-theme" data-theme-toggle aria-label="' + (dark ? 'Passa al tema chiaro' : 'Passa al tema scuro') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + (dark ? SUN : MOON) + '</svg><span>' + (dark ? 'Tema chiaro' : 'Tema scuro') + '</span></button>';
  }
  function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>'; }
  function renderIndex() {
    var byName = {};
    navChaps = [];
    all.forEach(function (r) {
      if (r === router) return;
      var c = r.getAttribute('data-chapter');
      if (!byName[c]) { byName[c] = { name: c, reels: [] }; navChaps.push(byName[c]); }
      byName[c].reels.push(r);
    });
    var curChap = current >= 0 ? chapOf(visible[current]) : '';
    navList.innerHTML = navChaps.map(function (ch, k) {
      var off = ch.reels.every(function (r) { return r.hidden; });
      return '<button type="button" class="rnav-item' + (ch.name === curChap ? ' here' : '') + (off ? ' off' : '') + '" data-c="' + k + '">' + icon(ch.name) + '<span>' + ch.name + '</span></button>';
    }).join('') + '<a class="rnav-item rnav-link" href="chi-sono.html" data-keep>' + icon('Chi sono') + '<span>Chi sono</span></a>' + themeBtn();
  }
  // Con il menu aperto si evidenzia la linea della sezione (quella attuale, o quella che stai per scegliere)
  // Torna allo stato iniziale: nessun percorso, nessuna scelta, primo momento (come ricaricare)
  function restart() {
    ss.del('reel-pos');
    try { location.replace(location.pathname + location.search); } catch (e) { location.reload(); }
  }
  function chapOf(r) { return r === router ? TRACKS[mode] : r.getAttribute('data-chapter'); }
  function pickLine(name) {
    bits.forEach(function (b, k) { b.classList.toggle('seg-pick', !!chapters[k] && chapters[k].name === name); });
  }
  function setNav(open) {
    navOpen = open;
    pickLine(open && current >= 0 ? chapOf(visible[current]) : '');
    openTop = scroller.scrollTop;
    if (open) renderIndex();
    bar.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  }
  toggle.addEventListener('click', function () { setNav(!navOpen); });
  function hoverLine(e) {
    var it = e.target.closest('[data-c]');
    pickLine(it ? navChaps[parseInt(it.getAttribute('data-c'), 10)].name : (current >= 0 ? chapOf(visible[current]) : ''));
  }
  ['pointerover', 'focusin'].forEach(function (t) { document.getElementById('rnav').addEventListener(t, hoverLine); });
  document.getElementById('rnav').addEventListener('pointerleave', hoverLine);
  document.getElementById('rnav').addEventListener('click', function (e) {
    if (e.target.closest('[data-theme-toggle]')) {
      if (window.centroTheme) window.centroTheme.set(isDark() ? 'light' : 'dark');
      renderIndex();
      return;
    }
    if (e.target.closest('[data-keep]')) { ss.set('reel-pos', JSON.stringify({ mode: mode, i: current })); return; }
    var it = e.target.closest('[data-c]');
    if (!it) return;
    var ch = navChaps[parseInt(it.getAttribute('data-c'), 10)];
    if (ch.name === 'Introduzione') { restart(); return; }
    var r = ch.reels.filter(function (x) { return !x.hidden; })[0];
    setNav(false);
    if (r) go(r); else showAll(ch.reels[0]);
  });
  // Si richiude toccando fuori o scorrendo
  document.addEventListener('pointerdown', function (e) { if (navOpen && !e.target.closest('#rbox')) setNav(false); });
  scroller.addEventListener('scroll', function () { if (navOpen && Math.abs(scroller.scrollTop - openTop) > 24) setNav(false); }, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (navOpen) setNav(false);
    document.querySelectorAll('.area-panel.open').forEach(function (p) { closeArea(p.closest('.reel')); });
  });

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

  // ---------- Rotella e tastiera: un momento alla volta ----------
  var wheelLock = 0;
  function step(dir) {
    var k = Math.max(0, Math.min(visible.length - 1, current + dir));
    if (k !== current) go(visible[k]);
  }
  // Rotella e trackpad: un gesto = un momento. L'inerzia del trackpad continua a mandare eventi
  // che calano piano piano: si ignorano. Un nuovo passo parte dopo una pausa negli eventi
  // oppure quando la spinta torna a crescere (nuovo gesto mentre l'inerzia non è finita).
  var lastWheel = 0, lastAbs = 0, armed = true;
  window.addEventListener('wheel', function (e) {
    if (navOpen || document.querySelector('.area-panel.open')) return;
    if (e.ctrlKey) return;
    e.preventDefault();
    var now = Date.now(), abs = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 30 : 1);
    if (now - lastWheel > 180) armed = true;
    else if (abs > lastAbs * 1.8 && abs > 25 && now - wheelLock > 400) armed = true;
    lastWheel = now;
    lastAbs = abs;
    if (!armed || abs < 3) return;
    if (now - wheelLock < 380) { armed = false; return; }
    armed = false;
    wheelLock = now;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // Tocco: lo scorrimento e l'aggancio ai momenti sono quelli nativi del telefono (fluidi anche veloci)

  // ---------- Ogni momento entra nello schermo ----------
  // Su schermi bassi o con caratteri di sistema grandi il contenuto può non starci:
  // in quel caso si rimpicciolisce quanto basta (mai sotto il 72%).
  function fitReel(r) {
    var kids = Array.prototype.filter.call(r.children, function (c) {
      var p = getComputedStyle(c).position;
      return p !== 'absolute' && p !== 'fixed' && !c.hidden;
    });
    kids.forEach(function (c) { c.style.scale = ''; c.style.marginBottom = ''; c.style.transformOrigin = ''; });
    var room = r.clientHeight;
    if (!room) return;
    var hs = kids.map(function (c) { return c.offsetHeight; });
    var mb = kids.map(function (c) { return parseFloat(getComputedStyle(c).marginBottom) || 0; });
    var need = hs.reduce(function (t, h) { return t + h; }, 0);
    if (need <= room) return;
    // Si rimpicciolisce dall'alto e si recupera lo spazio con un margine negativo:
    // l'altezza del momento non cambia mai, quindi lo scatto resta preciso (anche su Safari)
    var z = Math.max(0.72, room / need);
    kids.forEach(function (c, i) {
      c.style.transformOrigin = '50% 0';
      c.style.scale = z.toFixed(3);
      c.style.marginBottom = (mb[i] - hs[i] * (1 - z)).toFixed(1) + 'px';
    });
  }
  function fitAll() { all.forEach(function (r) { if (!r.hidden) fitReel(r); }); if (merge) sizeField(); sizeNia(); }
  var fitTimer = null;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitAll, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  window.addEventListener('load', fitAll);

  document.addEventListener('keydown', function (e) {
    if (navOpen || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  });

  // ---------- Contatti: due chip in basso; toccandone una si apre il riquadro con la scelta ----------
  var cbox = document.getElementById('cbox');
  var cglass = document.querySelector('.cpanel-glass');
  function contactTab(t) {
    var prev = cbox.getAttribute('data-tab') || '';
    // Da una scelta all'altra il riquadro cambia altezza con un movimento morbido
    var switching = prev && t && prev !== t && !reduce;
    var from = switching ? cglass.offsetHeight : 0;
    cbox.setAttribute('data-tab', t);
    cbox.querySelectorAll('.cchip').forEach(function (b) { b.setAttribute('aria-expanded', b.getAttribute('data-tab') === t); });
    if (t) {
      document.getElementById('paneApp').hidden = t !== 'app';
      document.getElementById('paneInfo').hidden = t !== 'info';
    }
    if (switching) {
      cglass.style.height = 'auto';
      var to = cglass.offsetHeight;
      cglass.style.height = from + 'px';
      void cglass.offsetHeight;
      cglass.style.height = to + 'px';
      var end = function (e) { if (e.propertyName !== 'height') return; cglass.style.height = ''; cglass.removeEventListener('transitionend', end); };
      cglass.addEventListener('transitionend', end);
    }
  }
  if (cbox) {
    contactTab('');
    cbox.querySelector('.cchips').addEventListener('click', function (e) {
      var b = e.target.closest('.cchip');
      if (!b) return;
      var t = b.getAttribute('data-tab');
      contactTab(cbox.getAttribute('data-tab') === t ? '' : t);
    });
  }

  // ---------- Invio dei moduli dei contatti ----------
  // Per ora passano da FormSubmit e arrivano come email a hello.centro26@gmail.com.
  // Con Supabase basterà cambiare data-endpoint nei due moduli.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function sendForm(form, data) {
    var hp = form.querySelector('.hp');
    if (hp && hp.value) return Promise.resolve(); // compilato da un programma automatico: si ignora
    data._captcha = 'false'; data._template = 'table';
    var url = form.getAttribute('data-endpoint');
    // FormSubmit a volte impiega decine di secondi: l'invio viene affidato al browser in background
    // (continua anche se la pagina si chiude) e chi scrive vede subito la conferma
    if (navigator.sendBeacon) {
      var fd = new FormData();
      Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
      if (navigator.sendBeacon(url.replace('/ajax/', '/'), fd)) return Promise.resolve();
    }
    // Riserva: invio normale, con un tempo massimo per non restare bloccati
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('invio'); return r.json().catch(function () { return {}; }); })
      .then(function (j) { if (j && String(j.success) === 'false') throw new Error('invio'); })
      .catch(function (e) { clearTimeout(timer); throw e; });
  }
  function noteFor(form, note) {
    var base = note.innerHTML;
    return function (t, cls) {
      if (t === null) note.innerHTML = base; else note.textContent = t;
      form.className = form.className.replace(/\s?(err|ok|busy)\b/g, '') + (cls ? ' ' + cls : '');
    };
  }
  var FAIL = 'Il servizio non ha risposto. Riprova tra poco o scrivi a hello.centro26@gmail.com.';

  // Accesso anticipato: solo l'email
  var eaForm = document.getElementById('eaForm');
  if (eaForm) {
    var eaInput = document.getElementById('eaInput'), eaSay = noteFor(eaForm, document.getElementById('eaNote'));
    eaInput.addEventListener('input', function () { if (/\berr\b/.test(eaForm.className)) eaSay(null, ''); });
    eaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = eaInput.value.trim();
      if (!EMAIL_RE.test(v)) { eaSay('Scrivi un’email valida.', 'err'); eaInput.focus(); return; }
      eaSay('Invio in corso…', 'busy');
      sendForm(eaForm, { email: v, _subject: 'Accesso anticipato CEnTRO: nuova iscrizione' })
        .then(function () { eaInput.value = ''; eaSay('Fatto! Ti scriviamo appena l’app è disponibile.', 'ok'); })
        .catch(function () { eaSay(FAIL, 'err'); });
    });
  }

  // Richiesta di informazioni: testo e email per la risposta
  var rqForm = document.getElementById('rqForm');
  if (rqForm) {
    var rqText = document.getElementById('rqText'), rqEmail = document.getElementById('rqEmail'), rqSay = noteFor(rqForm, document.getElementById('rqNote'));
    [rqText, rqEmail].forEach(function (el) { el.addEventListener('input', function () { if (/\berr\b/.test(rqForm.className)) rqSay(null, ''); }); });
    rqForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = rqText.value.trim(), m = rqEmail.value.trim();
      if (t.length < 5) { rqSay('Scrivi la tua richiesta.', 'err'); rqText.focus(); return; }
      if (!EMAIL_RE.test(m)) { rqSay('Scrivi un’email valida per la risposta.', 'err'); rqEmail.focus(); return; }
      rqSay('Invio in corso…', 'busy');
      sendForm(rqForm, { richiesta: t, email: m, _replyto: m, _subject: 'Richiesta di informazioni da CEnTRO' })
        .then(function () { rqText.value = ''; rqEmail.value = ''; rqSay('Ricevuta! Ti rispondo al più presto.', 'ok'); })
        .catch(function () { rqSay(FAIL, 'err'); });
    });
  }

  // ---------- CEnTRO con la n minuscola anche nelle scritte in maiuscolo ----------
  function keepBrand(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.indexOf('CEnTRO') >= 0) list.push(w.currentNode);
    list.forEach(function (t) {
      var el = t.parentNode;
      if (!el || el.classList.contains('cn') || getComputedStyle(el).textTransform !== 'uppercase') return;
      var parts = t.nodeValue.split('CEnTRO'), frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) { var sp = document.createElement('span'); sp.className = 'cn'; sp.textContent = 'CEnTRO'; frag.appendChild(sp); }
      });
      el.replaceChild(frag, t);
    });
  }
  keepBrand(document.body);

  // ---------- Avvio ----------
  var saved = null;
  try { saved = JSON.parse(ss.get('reel-pos') || 'null'); } catch (e) { saved = null; }
  ss.del('reel-pos');
  if (saved && (saved.mode === 'all' || TRACKS[saved.mode])) {
    mode = saved.mode;
    applyMode(true);
    var target = visible[Math.min(saved.i, visible.length - 1)] || visible[0];
    scroller.scrollTop = target.offsetTop;
    check();
  } else {
    applyMode();
  }
  fitAll();
})();
