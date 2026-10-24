// Profili d'esempio: si comportano come nell'app.
// - Area Pubblica / Area Personale: due viste separate dello stesso profilo.
// - Segui: cambia stato con un'animazione morbida. Messaggio: non fa nulla.
// - Foto: si aprono a schermo intero con la frase di chi le ha pubblicate e il tasto Salva.
// - Sezioni: si aprono e si chiudono; "A cosa serve" mostra la spiegazione nello stesso spazio, "Chiudi" riporta il contenuto.
(function () {
  // Aree
  var areas = document.querySelector('.pt-areas');
  if (areas) areas.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-area]');
    if (!b) return;
    var a = b.getAttribute('data-area');
    areas.setAttribute('data-on', a);
    areas.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
    document.querySelectorAll('.pt-pane').forEach(function (p) { p.setAttribute('aria-hidden', p.getAttribute('data-pane') !== a); });
    var app = areas.closest('.pt-app'), top = app.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top - 80, behavior: 'smooth' });
  });

  // Segui
  document.querySelectorAll('.pt-follow').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX ? e.clientX - r.left : r.width / 2) + 'px');
      b.style.setProperty('--y', (e.clientY ? e.clientY - r.top : r.height / 2) + 'px');
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
      b.classList.remove('ripple'); void b.offsetWidth; b.classList.add('ripple');
    });
  });

  // Foto a schermo intero
  var lb = document.getElementById('ptLb'), lbImg = document.getElementById('ptLbImg'), lbCap = document.getElementById('ptLbCap'), save = document.getElementById('ptSave');
  var saved = {}, currentKey = '';
  function openPhoto(btn) {
    currentKey = btn.getAttribute('data-src');
    lbImg.innerHTML = '<img src="' + currentKey + '" alt="">';
    lbCap.textContent = btn.getAttribute('data-cap') || '';
    save.setAttribute('aria-pressed', !!saved[currentKey]);
    save.querySelector('span').textContent = saved[currentKey] ? 'Salvata' : 'Salva';
    lb.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add('on'); }); });
  }
  function closePhoto() {
    lb.classList.remove('on');
    setTimeout(function () { lb.hidden = true; }, 400);
  }
  document.querySelectorAll('.pt-ph').forEach(function (b) { b.addEventListener('click', function () { openPhoto(b); }); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.pt-lb-x')) closePhoto(); });
  save.addEventListener('click', function () {
    saved[currentKey] = !saved[currentKey];
    save.setAttribute('aria-pressed', saved[currentKey]);
    save.querySelector('span').textContent = saved[currentKey] ? 'Salvata' : 'Salva';
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closePhoto(); });

  // Sezioni
  document.querySelectorAll('.pt-sec').forEach(function (sec) {
    var head = sec.querySelector('.pt-sec-h'), info = sec.querySelector('.pt-info'), content = sec.querySelector('.pt-content');
    head.addEventListener('click', function () {
      var open = !sec.classList.contains('open');
      sec.classList.toggle('open', open);
      head.setAttribute('aria-expanded', open);
      if (!open) setTimeout(function () { setInfo(false); }, 450);
    });
    function setInfo(on) {
      sec.classList.toggle('info', on);
      info.setAttribute('aria-hidden', !on);
      content.setAttribute('aria-hidden', on);
    }
    sec.querySelector('.pt-info-btn').addEventListener('click', function () { setInfo(!sec.classList.contains('info')); });
  });

  // Filtri a chip (scelta singola)
  document.querySelectorAll('[data-chips]').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.pt-chip');
      if (!b) return;
      g.querySelectorAll('.pt-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    });
  });

  // Diario: Settimana / Mese
  document.querySelectorAll('[data-seg]').forEach(function (s) {
    var sec = s.closest('.pt-content'), bars = sec.querySelectorAll('[data-bars] i'), range = sec.querySelector('[data-range]');
    var ranges = range ? range.getAttribute('data-range').split('|') : [];
    s.querySelectorAll('button').forEach(function (b, i) {
      b.addEventListener('click', function () {
        s.setAttribute('data-on', i);
        s.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        b.getAttribute('data-v').split(',').forEach(function (v, k) { if (bars[k]) bars[k].style.setProperty('--h', v + '%'); });
        if (range) range.textContent = ranges[i];
      });
    });
  });

  // Orari: stato e giorno di oggi calcolati sull'ora reale
  var hours = document.querySelector('[data-hours]');
  if (hours) {
    var DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    var MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    var now = new Date(), today = DAYS[now.getDay()], mins = now.getHours() * 60 + now.getMinutes();
    var toMin = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
    var rowsEl = hours.children, open = '', close = '', nextOpen = '';
    for (var i = 0; i < rowsEl.length; i++) {
      var c = rowsEl[i].children;
      if (c[0].textContent === today) {
        rowsEl[i].classList.add('today');
        var span = c[1].textContent.split('–'); open = span[0]; close = span[1];
      }
      if (c[0].textContent === DAYS[(now.getDay() + 1) % 7]) nextOpen = c[1].textContent.split('–')[0];
    }
    var state = document.querySelector('[data-state]'), until = document.querySelector('[data-until]');
    document.querySelector('[data-today]').textContent = 'Oggi, ' + today + ' ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + ' ' + now.getFullYear();
    if (mins >= toMin(open) && mins < toMin(close)) {
      if (toMin(close) - mins <= 60) { state.textContent = 'Sta per chiudere'; state.classList.add('soon'); until.textContent = 'Chiude tra poco, alle ' + close; }
      else { state.textContent = 'Aperto'; until.textContent = 'Aperto fino alle ' + close; }
    } else if (mins < toMin(open)) {
      state.textContent = 'Chiuso'; state.classList.add('closed'); until.textContent = 'Chiuso, apre oggi alle ' + open;
    } else {
      state.textContent = 'Chiuso'; state.classList.add('closed'); until.textContent = 'Chiuso, apre domani alle ' + nextOpen;
    }
  }
})();
