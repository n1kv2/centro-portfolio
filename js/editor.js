(function () {
  var KEY = 'centro-editor';
  var HASH = '55a244c36d5a56761d61c6f9b80b115e225bcaf2c2d00bbd5761a3605500e5e9';
  var MAIL = 'hello.centro26@gmail.com';
  var root = document.documentElement;
  var R = null, on = false, nums = true;
  var IC = {
    note: '<path d="M16.652 3.45506L17.3009 2.80624C18.3759 1.73125 20.1188 1.73125 21.1938 2.80624C22.2687 3.88124 22.2687 5.62415 21.1938 6.69914L20.5449 7.34795M16.652 3.45506C16.652 3.45506 16.7331 4.83379 17.9497 6.05032C19.1662 7.26685 20.5449 7.34795 20.5449 7.34795M16.652 3.45506L10.6872 9.41993C10.2832 9.82394 10.0812 10.0259 9.90743 10.2487C9.70249 10.5114 9.52679 10.7957 9.38344 11.0965C9.26191 11.3515 9.17157 11.6225 8.99089 12.1646L8.41242 13.9M8.41242 13.9L8.03811 15.0229C7.9492 15.2897 8.01862 15.5837 8.21744 15.7826C8.41626 15.9814 8.71035 16.0508 8.97709 15.9619L10.1 15.5876L11.8354 15.0091C12.3775 14.8284 12.6485 14.7381 12.9035 14.6166C13.2043 14.4732 13.4886 14.2975 13.7513 14.0926C13.9741 13.9188 14.1761 13.7168 14.5801 13.3128L20.5449 7.34795M10.1 15.5876L8.41242 13.9"/><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2"/>',
    side: '<path d="M2 11C2 7.22876 2 5.34315 3.17157 4.17157C4.34315 3 6.22876 3 10 3H14C17.7712 3 19.6569 3 20.8284 4.17157C22 5.34315 22 7.22876 22 11V13C22 16.7712 22 18.6569 20.8284 19.8284C19.6569 21 17.7712 21 14 21H10C6.22876 21 4.34315 21 3.17157 19.8284C2 18.6569 2 16.7712 2 13V11Z"/><path d="M9 21L9 3"/>',
    hide: '<path d="M12 14C5 14 2 7 2 7M22 7C22 7 21.0586 9.19661 19 11.1288C18.0872 11.9856 16.9547 12.7904 15.5872 13.3287C14.5334 13.7435 13.34 14 12 14M12 14V16.5M15.5872 13.3287L17 15.5M19 11.1288L20.5 12.6288M8.41281 13.3287L7 15.5M5 11.1288L3.5 12.6288"/>',
    show: '<path d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"/><path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"/>',
    exit: '<path d="M9.00195 7C9.01406 4.82497 9.11051 3.64706 9.87889 2.87868C10.7576 2 12.1718 2 15.0002 2L16.0002 2C18.8286 2 20.2429 2 21.1215 2.87868C22.0002 3.75736 22.0002 5.17157 22.0002 8L22.0002 16C22.0002 18.8284 22.0002 20.2426 21.1215 21.1213C20.2429 22 18.8286 22 16.0002 22H15.0002C12.1718 22 10.7576 22 9.87889 21.1213C9.11051 20.3529 9.01406 19.175 9.00195 17"/><path d="M15 12L2 12M5.5 15L2 12L5.5 9"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function hash(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  on = read(KEY) === HASH;
  nums = read(KEY + '-num') !== 'off';
  function paint() { root.classList.toggle('ed', on); root.classList.toggle('ed-nonum', on && !nums); }
  function align() {
    var r = R && R.current(), n = r && r.querySelector('.r-num');
    if (!on || !n || !noteBtn) return;
    var was = root.classList.contains('ed-nonum');
    root.classList.remove('ed-nonum');
    var b = n.getBoundingClientRect();
    if (was) root.classList.add('ed-nonum');
    if (b.height) root.style.setProperty('--ed-bottom', Math.round(window.innerHeight - b.bottom + (b.height - 26) / 2) + 'px');
  }
  paint();

  var zone, gate, cells, gmsg, noteBtn, sheet, side, toastEl, toastT;

  function toast(t) {
    toastEl.textContent = t;
    toastEl.classList.add('in');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('in'); }, 1800);
  }

  function openGate() {
    gate.classList.add('in');
    cells.forEach(function (c) { c.value = ''; });
    gmsg.textContent = '';
    setTimeout(function () { cells[0].focus(); }, 60);
  }
  function closeGate() { gate.classList.remove('in'); gate.classList.remove('err'); if (document.activeElement) document.activeElement.blur(); }
  function tryCode() {
    var v = cells.map(function (c) { return c.value; }).join('');
    if (v.length < 4) return;
    hash('centro-editor:' + v).then(function (h) {
      if (h === HASH) {
        on = true; store(KEY, HASH); paint(); closeGate(); align();
        toast('Editor mode attiva');
        if (R) R.menu();
        return;
      }
      gate.classList.remove('err'); void gate.offsetWidth; gate.classList.add('err');
      gmsg.textContent = 'Codice non corretto.';
      cells.forEach(function (c) { c.value = ''; });
      cells[0].focus();
    });
  }

  function exit() {
    on = false; store(KEY, null); paint();
    closeSheet(); closeSide();
    toast('Editor mode disattivata');
  }

  function slideInfo() {
    var r = R && R.current();
    if (!r) return null;
    var n = r.querySelector('.r-num');
    return { reel: r, num: n ? n.textContent : '', title: r.getAttribute('data-title') || '' };
  }
  function openSheet() {
    var s = slideInfo();
    if (!s) return;
    sheet.querySelector('[data-ed-title]').textContent = s.num ? 'Nota sul momento ' + s.num : 'Nota su questa slide';
    sheet.querySelector('[data-ed-sub]').textContent = s.title;
    sheet.querySelector('.ed-msg').textContent = '';
    sheet.classList.remove('ok');
    sheet.classList.add('in');
    sheet.dataset.num = s.num;
    sheet.dataset.title = s.title;
    setTimeout(function () { sheet.querySelector('textarea').focus(); }, 80);
  }
  function closeSheet() { sheet.classList.remove('in'); if (document.activeElement && sheet.contains(document.activeElement)) document.activeElement.blur(); }
  function sendNote(e) {
    e.preventDefault();
    var form = sheet.querySelector('form'), ta = form.querySelector('textarea'), msg = form.querySelector('.ed-msg');
    var t = ta.value.trim();
    if (t.length < 2) { msg.textContent = 'Scrivi la nota.'; ta.focus(); return; }
    var num = sheet.dataset.num, title = sheet.dataset.title;
    var path = { all: 'Tutti i momenti', utente: 'Utente', azienda: 'Azienda', investitore: 'Investitore' }[R.mode()] || R.mode();
    var subject = 'Nota editor CEnTRO · momento ' + (num || '–') + ' · ' + title;
    var fail = function () {
      var href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('Momento: ' + (num ? num + ' · ' : '') + title + '\nPercorso: ' + path + '\n\n' + t);
      msg.innerHTML = 'Servizio email non raggiungibile. <a class="ed-mail" href="' + href + '">Invia con Mail</a>';
    };
    msg.textContent = 'Invio in corso…';
    window.centroSend(subject, { momento: num ? num + ' · ' + title : title, percorso: path, nota: t }).then(function () {
      ta.value = '';
      msg.textContent = 'Nota inviata.';
      sheet.classList.add('ok');
      setTimeout(closeSheet, 1100);
    }).catch(fail);
  }

  function buildSide() {
    var list = side.querySelector('.ed-list'), vis = R.visible(), cur = R.current();
    var sc = document.getElementById('reels'), W = sc.clientWidth || 390, H = sc.clientHeight || 760, TW = 112, k = TW / W;
    list.innerHTML = '';
    vis.forEach(function (r) {
      var n = r.querySelector('.r-num');
      var b = el('<button type="button" class="ed-item"><span class="ed-thumb" style="width:' + TW + 'px;height:' + Math.round(H * k) + 'px"></span><span class="ed-cap"><b></b><span></span></span></button>');
      b.querySelector('b').textContent = n ? n.textContent : '·';
      b.querySelector('.ed-cap span').textContent = r.getAttribute('data-title') || '';
      var c = r.cloneNode(true);
      c.removeAttribute('data-reel'); c.removeAttribute('id'); c.removeAttribute('hidden');
      c.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); });
      c.querySelectorAll('.r-num').forEach(function (x) { x.remove(); });
      c.querySelectorAll('img[loading]').forEach(function (x) { x.removeAttribute('loading'); });
      c.classList.add('on', 'ed-clone');
      c.style.width = W + 'px'; c.style.height = H + 'px'; c.style.transform = 'scale(' + k + ')';
      b.querySelector('.ed-thumb').appendChild(c);
      if (r === cur) b.classList.add('here');
      b.addEventListener('click', function () { closeSide(); R.go(r); });
      list.appendChild(b);
    });
    var here = list.querySelector('.here');
    if (here) here.scrollIntoView({ block: 'center' });
  }
  function openSide() { side.classList.add('in'); buildSide(); }
  function closeSide() { side.classList.remove('in'); }

  function mount() {
    zone = el('<div class="ed-zone" aria-hidden="true"></div>');
    var taps = 0, last = 0;
    zone.addEventListener('pointerup', function () {
      if (on) return;
      var now = Date.now();
      taps = now - last < 700 ? taps + 1 : 1;
      last = now;
      if (taps >= 5) { taps = 0; openGate(); }
    });

    gate = el('<div class="ed-gate" role="dialog" aria-label="Editor mode">' +
      '<div class="ed-head"><span class="ed-kick">Editor mode</span><button type="button" class="ed-x" aria-label="Chiudi">' + svg('close') + '</button></div>' +
      '<div class="ed-code">' + [1, 2, 3, 4].map(function (i) { return '<input inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Cifra ' + i + '">'; }).join('') + '</div>' +
      '<p class="ed-msg" aria-live="polite"></p></div>');
    cells = Array.prototype.slice.call(gate.querySelectorAll('input'));
    gmsg = gate.querySelector('.ed-msg');
    gate.querySelector('.ed-x').addEventListener('click', closeGate);
    cells.forEach(function (c, i) {
      c.addEventListener('input', function () {
        var d = c.value.replace(/\D/g, '');
        if (d.length > 1) { for (var j = 0; j < d.length && i + j < 4; j++) cells[i + j].value = d[j]; cells[Math.min(i + d.length, 3)].focus(); tryCode(); return; }
        c.value = d; gmsg.textContent = ''; gate.classList.remove('err');
        if (d && i < 3) cells[i + 1].focus();
        tryCode();
      });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !c.value && i > 0) { cells[i - 1].value = ''; cells[i - 1].focus(); e.preventDefault(); }
      });
    });

    noteBtn = el('<button type="button" class="ed-note">' + svg('note') + '<span>Nota</span></button>');
    noteBtn.addEventListener('click', openSheet);

    sheet = el('<div class="ed-sheet" role="dialog" aria-label="Nota sulla slide"><form novalidate>' +
      '<div class="ed-head"><div><span class="ed-kick" data-ed-title></span><b data-ed-sub></b></div><button type="button" class="ed-x" aria-label="Chiudi">' + svg('close') + '</button></div>' +
      '<textarea rows="4" placeholder="Cosa vuoi cambiare in questa slide?"></textarea>' +
      '<div class="ed-foot"><p class="ed-msg" aria-live="polite"></p><button type="submit" class="ed-send">Invia nota</button></div></form></div>');
    sheet.querySelector('.ed-x').addEventListener('click', closeSheet);
    sheet.querySelector('form').addEventListener('submit', sendNote);

    side = el('<aside class="ed-side" aria-label="Anteprima delle slide"><div class="ed-veil"></div><div class="ed-panel">' +
      '<div class="ed-head"><span class="ed-kick">Anteprima</span><button type="button" class="ed-x" aria-label="Chiudi">' + svg('close') + '</button></div>' +
      '<div class="ed-list"></div></div></aside>');
    side.querySelector('.ed-x').addEventListener('click', closeSide);
    side.querySelector('.ed-veil').addEventListener('click', closeSide);

    toastEl = el('<div class="ed-toast" role="status"></div>');

    [zone, gate, noteBtn, sheet, side, toastEl].forEach(function (x) { document.body.appendChild(x); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeGate(); closeSheet(); closeSide();
    });
  }

  window.centroEditor = {
    ready: function () { R = window.centroReels; mount(); align(); window.addEventListener('resize', align); },
    refresh: function () { if (side && side.classList.contains('in')) buildSide(); },
    menu: function () {
      if (!on) return '';
      var item = function (k, ic, t) { return '<button type="button" class="rnav-item rnav-link rnav-ed" data-ed="' + k + '">' + svg(ic) + '<span>' + t + '</span></button>'; };
      return item('side', 'side', 'Anteprima slide') + item('num', nums ? 'hide' : 'show', nums ? 'Nascondi numeri' : 'Mostra numeri') + item('exit', 'exit', 'Esci dall’editor');
    },
    act: function (k) {
      if (k === 'side') openSide();
      else if (k === 'num') { nums = !nums; store(KEY + '-num', nums ? null : 'off'); paint(); }
      else if (k === 'exit') exit();
    }
  };
})();
