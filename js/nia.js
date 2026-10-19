// Nia come mappa: scegli cosa cerchi e le proposte si dispongono attorno a te.
// Più una proposta è vicina al centro, più è affine. Contenuti simulati a scopo dimostrativo.
(function () {
  var root = document.getElementById('nia');
  var chipsEl = document.getElementById('niaChips');
  var nodesEl = document.getElementById('niaNodes');
  var pickEl = document.getElementById('niaPick');
  var opener = document.getElementById('niaOpen');

  var ITEMS = {
    arte:     { img: 'img/inaugurazione.jpg', title: "Inaugurazione di uno spazio d'arte", meta: 'Stasera · 19:30 · 0,6 km', angle: -100,
                why: ["Ami l'arte contemporanea", 'Stasera sei libero dopo le 19', '4 persone affini ci vanno'] },
    musica:   { img: 'img/discoteca.jpg', title: 'Serata in musica con un gruppo di sei', meta: 'Stasera · 23:00 · centro', angle: -40,
                why: ['Ti piace ballare', 'Gruppo con gusti musicali simili', 'Rientro a piedi in 10 minuti'] },
    calcetto: { img: 'img/calcetto.jpg', title: 'Calcetto 5 contro 5, manca un giocatore', meta: 'Stasera · 20:00 · campo di quartiere', angle: 10,
                why: ['Fai sport di squadra', 'Livello simile al tuo', 'Ti aspettano in 9'] },
    lingue:   { img: 'img/lingue.jpg', title: 'Conversazione in inglese sotto i portici', meta: 'Domani · 18:00 · centro storico', angle: 60,
                why: ['Ti piace conversare in piccoli gruppi', "Vuoi migliorare l'inglese", '5 partecipanti con interessi simili'] },
    ceramica: { img: 'img/ceramica.jpg', title: 'Laboratorio di ceramica per principianti', meta: 'Sabato · 10:00 · 1,2 km', angle: 110,
                why: ['Ami le attività manuali', 'Pensato per chi inizia', 'Sabato mattina, il tuo momento preferito'] },
    trekking: { img: 'img/trekking.jpg', title: "Escursione all'alba", meta: 'Domenica · 6:00 · 8 posti', angle: 160,
                why: ["Ti rigenera stare all'aperto", 'Intensità media, come preferisci', 'Gruppo di 8 persone affini'] },
    casa:     { img: 'img/agenzia.jpg', title: 'Stanza in un palazzo storico, in centro', meta: '350 € al mese · 3 coinquilini', angle: 205,
                why: ['Cerchi casa vicino al centro', 'Convivenza compatibile', 'Nessun fumatore, come chiedi'] },
    bando:    { letter: 'B', title: 'Bando per giovani creativi', meta: 'Opportunità · scade tra 12 giorni', angle: 245,
                why: ['Requisiti tutti soddisfatti', 'In linea con la tua creatività', 'Ti avviso prima della scadenza'] }
  };

  var INTENTS = [
    ['stasera', 'Uscire stasera',     { arte: 94, musica: 88, calcetto: 82, lingue: 60, ceramica: 45, trekking: 35, casa: 15, bando: 20 }],
    ['persone', 'Conoscere persone',  { lingue: 95, calcetto: 87, trekking: 80, arte: 70, musica: 66, ceramica: 55, casa: 30, bando: 18 }],
    ['imparare', 'Imparare qualcosa', { ceramica: 96, lingue: 88, bando: 70, arte: 66, trekking: 45, calcetto: 25, musica: 22, casa: 12 }],
    ['aperto', "Stare all'aperto",    { trekking: 97, calcetto: 78, lingue: 40, ceramica: 30, arte: 25, bando: 22, musica: 20, casa: 10 }],
    ['casa', 'Trovare casa',          { casa: 93, lingue: 30, bando: 25, ceramica: 22, arte: 20, trekking: 18, calcetto: 15, musica: 12 }],
    ['opportunita', 'Opportunità',    { bando: 92, ceramica: 58, lingue: 55, arte: 50, trekking: 30, calcetto: 20, musica: 15, casa: 12 }]
  ];

  var ids = Object.keys(ITEMS);
  var nodes = {};
  ids.forEach(function (id) {
    var it = ITEMS[id];
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'node';
    b.setAttribute('aria-label', it.title);
    b.innerHTML = it.img ? '<img src="' + it.img + '" alt="">' : '<b>' + it.letter + '</b>';
    b.addEventListener('click', function () { select(id); });
    nodesEl.appendChild(b);
    nodes[id] = b;
  });

  var chips = INTENTS.map(function (intent) {
    var c = document.createElement('button');
    c.type = 'button';
    c.className = 'nia-chip';
    c.setAttribute('role', 'radio');
    c.textContent = intent[1];
    c.addEventListener('click', function () { setIntent(intent); });
    chipsEl.appendChild(c);
    return c;
  });

  var scores = {}, active = null;

  // Puntini di sfondo: le tante possibilità della città, ancora da scoprire
  var dust = [];
  for (var d = 0; d < 14; d++) {
    var sp = document.createElement('span');
    sp.className = 'dust';
    var ang = (d * 137.5) * Math.PI / 180, rad = 22 + (d * 23 % 24);
    sp.style.left = (50 + rad * Math.cos(ang)) + '%';
    sp.style.top = (50 + rad * Math.sin(ang)) + '%';
    nodesEl.appendChild(sp);
    dust.push(sp);
  }

  // Posizioni: a riposo tutti puntini grigi lontani; con una scelta i pertinenti si avvicinano e si mostrano
  function place() {
    ids.forEach(function (id, i) {
      var n = nodes[id], sc = active ? scores[id] : 0, lit = active && sc >= 55;
      var r = lit ? 16 + (100 - sc) * 0.42 : 36 + (i * 17 % 9);
      var a = ITEMS[id].angle * Math.PI / 180;
      n.style.left = (50 + r * Math.cos(a)) + '%';
      n.style.top = (50 + r * Math.sin(a)) + '%';
      n.style.setProperty('--z', lit ? (sc >= 85 ? '58px' : sc >= 70 ? '48px' : '40px') : '16px');
      n.classList.toggle('lit', !!lit);
      n.tabIndex = lit ? 0 : -1;
      n.setAttribute('aria-hidden', lit ? 'false' : 'true');
    });
  }

  function hint() {
    pickEl.classList.add('empty');
    pickEl.innerHTML = '<p class="pick-hint">Tocca una scelta qui sopra: le proposte giuste per te si avvicinano e si mostrano.</p>';
  }

  function setIntent(intent) {
    chips.forEach(function (c, i) { c.setAttribute('aria-checked', INTENTS[i] === intent ? 'true' : 'false'); });
    active = intent[0];
    scores = intent[2];
    place();
    var top = ids.slice().sort(function (a, b) { return scores[b] - scores[a]; })[0];
    select(top);
  }

  function select(id) {
    if (!active || scores[id] < 55) return;
    pickEl.classList.remove('empty');
    ids.forEach(function (k) { nodes[k].classList.toggle('sel', k === id); });
    var it = ITEMS[id], sc = scores[id];
    pickEl.innerHTML =
      (it.img ? '<img class="pick-img" src="' + it.img + '" alt="">' : '<span class="pick-img" aria-hidden="true"></span>') +
      '<div class="pick-main"><span class="pick-title">' + it.title + '</span><span class="pick-meta">' + it.meta + '</span>' +
      '<span class="aff"><i style="--a:' + sc + '%"></i>' + sc + '% affine</span></div>' +
      '<div class="why"><p>Perché è vicino a te</p><ul>' + it.why.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ul></div>';
    pickEl.style.animation = 'none'; void pickEl.offsetWidth; pickEl.style.animation = '';
  }

  function open() {
    root.hidden = false;
    document.body.classList.add('lock');
    root.querySelector('.nia-body').scrollTop = 0;
    active = null;
    chips.forEach(function (c) { c.setAttribute('aria-checked', 'false'); });
    ids.forEach(function (k) { nodes[k].classList.remove('sel'); });
    place();
    hint();
    setTimeout(function () { chips[0].focus({ preventScroll: true }); }, 60);
  }
  function close() {
    root.hidden = true;
    document.body.classList.remove('lock');
    opener.focus({ preventScroll: true });
  }

  opener.addEventListener('click', open);
  root.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !root.hidden) close(); });
})();
