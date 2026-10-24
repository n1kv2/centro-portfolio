// Profili d'esempio: si comportano come nell'app.
// - Segui: cambia stato con un'animazione. Messaggio: non fa nulla.
// - Foto: si aprono a schermo intero con la frase scelta da chi le ha pubblicate e il tasto Salva.
// - Sezioni: si aprono e si chiudono; "A cosa serve" sostituisce il contenuto con la spiegazione, "Chiudi" lo riporta.
(function () {
  // Segui
  document.querySelectorAll('.pt-follow').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on);
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    });
  });

  // Foto a schermo intero
  var lb = document.getElementById('ptLb'), lbImg = document.getElementById('ptLbImg'), lbCap = document.getElementById('ptLbCap'), save = document.getElementById('ptSave');
  var saved = {}, currentKey = '';
  function openPhoto(btn) {
    currentKey = btn.getAttribute('data-src') || btn.getAttribute('data-cap');
    var src = btn.getAttribute('data-src');
    lbImg.innerHTML = src ? '<img src="' + src + '" alt="">' : '';
    lbImg.classList.toggle('gray', !src);
    lbCap.textContent = btn.getAttribute('data-cap') || '';
    save.setAttribute('aria-pressed', !!saved[currentKey]);
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('on'); });
  }
  function closePhoto() {
    lb.classList.remove('on');
    setTimeout(function () { lb.hidden = true; }, 250);
  }
  document.querySelectorAll('.pt-ph').forEach(function (b) { b.addEventListener('click', function () { openPhoto(b); }); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.pt-lb-x')) closePhoto(); });
  save.addEventListener('click', function () {
    saved[currentKey] = !saved[currentKey];
    save.setAttribute('aria-pressed', saved[currentKey]);
    save.querySelector('span').textContent = saved[currentKey] ? 'Salvata' : 'Salva';
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closePhoto(); });

  // Sezioni espandibili
  document.querySelectorAll('.pt-sec').forEach(function (sec) {
    var head = sec.querySelector('.pt-sec-h'), body = sec.querySelector('.pt-body'), info = sec.querySelector('.pt-info'), ib = sec.querySelector('.pt-info-btn');
    head.addEventListener('click', function () {
      var open = !sec.classList.contains('open');
      sec.classList.toggle('open', open);
      head.setAttribute('aria-expanded', open);
      if (!open) showInfo(false);
    });
    function showInfo(on) {
      var from = on ? body : info, to = on ? info : body;
      sec.classList.toggle('info', on);
      if (from.hidden) return;
      from.classList.add('fade');
      setTimeout(function () { from.hidden = true; from.classList.remove('fade'); to.hidden = false; to.classList.add('fade'); void to.offsetWidth; to.classList.remove('fade'); }, 220);
    }
    ib.addEventListener('click', function () { showInfo(!sec.classList.contains('info')); });
  });
})();
