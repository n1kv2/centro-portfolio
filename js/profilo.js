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
      if (open) sec.parentNode.querySelectorAll('.pt-sec.open').forEach(function (o) {
        if (o === sec) return;
        o.classList.remove('open', 'info');
        o.querySelector('.pt-sec-h').setAttribute('aria-expanded', 'false');
      });
      sec.classList.toggle('open', open);
      head.setAttribute('aria-expanded', open);
      if (!open) setTimeout(function () { setInfo(false); }, 450);
    });
    var stack = sec.querySelector('.pt-stack');
    function setInfo(on) {
      // la spiegazione prende lo spazio del contenuto; la sezione cresce solo se il testo non ci sta
      stack.style.minHeight = on ? Math.max(content.offsetHeight, info.scrollHeight) + 'px' : '';
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

  // Diario: Settimana (sette giorni) / Mese (quattro settimane)
  document.querySelectorAll('[data-seg]').forEach(function (s) {
    var sec = s.closest('.pt-content'), barsEl = sec.querySelector('[data-bars]'), days = sec.querySelector('[data-days]'), range = sec.querySelector('[data-range]');
    var ranges = range ? range.getAttribute('data-range').split('|') : [];
    // colore legato al valore: basso viola-azzurro, alto verde
    var mood = function (v) { return v < 62 ? '#9ABAFF' : v < 75 ? '#B1E6FF' : v < 85 ? '#ABFECD' : '#99FEA3'; };
    s.querySelectorAll('button').forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        s.setAttribute('data-on', i);
        s.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var v = b.getAttribute('data-v').split(','), l = b.getAttribute('data-l').split(',');
        barsEl.style.gridTemplateColumns = days.style.gridTemplateColumns = 'repeat(' + v.length + ', 1fr)';
        barsEl.innerHTML = v.map(function (x, k) { return '<span><i style="--h:0%;--c:' + mood(+x) + '"></i></span>'; }).join('');
        days.innerHTML = l.map(function (x) { return '<span>' + x + '</span>'; }).join('');
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          barsEl.querySelectorAll('i').forEach(function (el, k) { el.style.setProperty('--h', v[k] + '%'); });
        }); });
        if (range) range.textContent = ranges[i];
        var tip = sec.querySelector('[data-tip]');
        if (tip) tip.textContent = tip.getAttribute('data-tip').split('|')[i];
      });
    });
  });

  // Atmosfera: "Crea con Nia" scrive il riepilogo, poi il tasto sparisce
  document.querySelectorAll('[data-atm]').forEach(function (box) {
    var go = box.querySelector('[data-atm-go]'), sum = box.querySelector('.pt-atm-sum');
    var parts = [].slice.call(sum.querySelectorAll('[data-type]')).map(function (p) { var h = p.innerHTML; p.innerHTML = ''; return { el: p, html: h }; });
    go.addEventListener('click', function () {
      go.classList.add('busy');
      go.querySelector('span').textContent = 'Nia sta scrivendo…';
      setTimeout(function () {
        go.hidden = true; sum.hidden = false;
        var k = 0;
        (function next() {
          if (k >= parts.length) return;
          var p = parts[k++], tmp = document.createElement('div'); tmp.innerHTML = p.html;
          var text = tmp.textContent, n = 0, lead = p.html.indexOf('<b>') === 0 ? tmp.querySelector('b').textContent : '';
          var tick = setInterval(function () {
            n += 3;
            var shown = text.slice(0, n);
            p.el.innerHTML = lead && shown.length > lead.length ? '<b>' + lead + '</b>' + shown.slice(lead.length) : (lead ? '<b>' + shown + '</b>' : shown);
            if (n >= text.length) { clearInterval(tick); p.el.innerHTML = p.html; setTimeout(next, 250); }
          }, 18);
        })();
      }, 900);
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

  // Animazione iniziale: un dito toglie e aggiunge widget, poi il profilo qui sotto è il risultato
  document.querySelectorAll('.pt-demo').forEach(function (root) {
    var stage = root.querySelector('.dm-stage'), replay = root.querySelector('.dm-replay');
    var tpl = stage.innerHTML, moves = JSON.parse(stage.getAttribute('data-moves'));
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EASE = 'cubic-bezier(.45,0,.2,1)', hand, hx = 0, hy = 0;
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    function rel(el) {
      var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    }
    function handTo(x, y, ms) {
      var a = hand.animate([{ transform: 'translate(' + hx + 'px,' + hy + 'px)' }, { transform: 'translate(' + x + 'px,' + y + 'px)' }], { duration: ms, easing: EASE, fill: 'forwards' });
      hx = x; hy = y;
      return a.finished;
    }
    function press(on) {
      return hand.firstElementChild.animate([{ transform: 'scale(' + (on ? 1 : .86) + ')' }, { transform: 'scale(' + (on ? .86 : 1) + ')' }], { duration: 160, easing: 'ease-out', fill: 'forwards' }).finished;
    }
    function place(m) {
      var src = stage.querySelector('[data-w="' + m.w + '"]'), list = stage.querySelector('[data-list="' + m.to + '"]');
      var before = m.before ? list.querySelector('[data-w="' + m.before + '"]') : null;
      var dst = src.cloneNode(true);
      list.insertBefore(dst, before);
      return { src: src, dst: dst };
    }
    function move(m) {
      var src = stage.querySelector('[data-w="' + m.w + '"]'), r = rel(src), ghost, dst, H, gap;
      return handTo(r.x + 22, r.y + r.h / 2, 750).then(function () { return press(true); }).then(function () {
        ghost = src.cloneNode(true);
        ghost.classList.add('dm-ghost');
        ghost.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;';
        stage.appendChild(ghost);
        ghost.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }], { duration: 180, fill: 'forwards' });
        src.classList.add('dm-gone');
        var p = place(m); dst = p.dst; dst.classList.add('dm-gone');
        H = src.offsetHeight; gap = parseFloat(getComputedStyle(src).marginBottom);
        var o = { duration: 420, easing: EASE, fill: 'forwards' };
        return Promise.all([
          src.animate([{ height: H + 'px', marginBottom: gap + 'px' }, { height: '0px', marginBottom: '0px' }], o).finished,
          dst.animate([{ height: '0px', marginBottom: '0px' }, { height: H + 'px', marginBottom: gap + 'px' }], o).finished
        ]);
      }).then(function () {
        src.remove();
        dst.getAnimations().forEach(function (a) { a.cancel(); });
        var t = rel(dst);
        ghost.animate([{ transform: 'translate(0,0) scale(1.06)', width: r.w + 'px' }, { transform: 'translate(' + (t.x - r.x) + 'px,' + (t.y - r.y) + 'px) scale(1.06)', width: t.w + 'px' }], { duration: 850, easing: EASE, fill: 'forwards' });
        return handTo(t.x + 22, t.y + t.h / 2, 850);
      }).then(function () { return press(false); }).then(function () {
        dst.classList.remove('dm-gone');
        dst.classList.add('dm-new');
        ghost.remove();
      });
    }
    function run() {
      stage.innerHTML = tpl;
      replay.hidden = true;
      hand = stage.querySelector('.dm-hand');
      if (still) {
        moves.forEach(function (m) { var p = place(m); p.src.remove(); });
        return;
      }
      hx = stage.clientWidth - 30; hy = stage.clientHeight + 10;
      hand.animate([{ opacity: 0, transform: 'translate(' + hx + 'px,' + hy + 'px)' }, { opacity: 1, transform: 'translate(' + hx + 'px,' + hy + 'px)' }], { duration: 300, fill: 'forwards' });
      var chain = wait(500);
      moves.forEach(function (m) {
        chain = chain.then(function () { return move(m); }).then(function () { return wait(450); });
      });
      // una sola dimostrazione, poi "Rivedi"
      chain.then(function () {
        hand.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
        replay.hidden = false;
      });
    }
    replay.addEventListener('click', run);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); setTimeout(run, 400); }
      }, { threshold: .5 });
      io.observe(stage);
    } else run();
  });
})();
