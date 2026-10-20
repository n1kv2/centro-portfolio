(function () {
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  // Avanzamento 0..1 di una sezione agganciata: 0 quando lo stage si aggancia, 1 quando si sgancia
  var progress = function (section, stage) {
    var r = section.getBoundingClientRect();
    var range = section.offsetHeight - stage.offsetHeight;
    var top = parseFloat(getComputedStyle(stage).top) || 0;
    return range > 0 ? clamp((top - r.top) / range, 0, 1) : 0;
  };

  // Barra in alto (trasparente sopra la foto) e dock (compare dopo l'introduzione)
  var bar = document.getElementById('topbar');
  var hero = document.getElementById('hero');

  // Mazzi di card (l'idea, dentro l'app): scorrendo, la card in cima viene scartata e passa alla successiva
  var decks = Array.prototype.slice.call(document.querySelectorAll('.deck')).map(function (deck) {
    return {
      el: deck,
      stage: deck.querySelector('.deck-stage'),
      cards: Array.prototype.slice.call(deck.querySelectorAll('.dcard')),
      dots: Array.prototype.slice.call(deck.querySelectorAll('.bar-dots i'))
    };
  });

  function renderDeck(d) {
    var nC = d.cards.length;
    var s = progress(d.el, d.stage) * (nC - 1);
    var gone = 0;
    d.cards.forEach(function (c, i) {
      c.style.zIndex = nC - i;
      var dir = i % 2 === 0 ? 1 : -1;
      var t = i < nC - 1 ? ease(clamp((s - i - 0.2) / 0.6, 0, 1)) : 0;
      if (t >= 0.5) gone++;
      if (t > 0) {
        c.style.transform = 'translate(' + (dir * t * 125) + '%,' + (-t * 30) + 'px) rotate(' + (dir * t * 20) + 'deg)';
        c.style.opacity = String(1 - t);
      } else {
        var depth = clamp(i - s, 0, 2);
        c.style.transform = 'translateY(' + (-depth * 14) + 'px) scale(' + (1 - depth * 0.05) + ')';
        c.style.opacity = '1';
      }
    });
    var top = Math.min(gone, nC - 1);
    // La card in cima avvia le sue animazioni
    if (d.stage.getBoundingClientRect().top < window.innerHeight * 0.6) d.cards[top].classList.add('in');
    d.dots.forEach(function (dot, i) { dot.classList.toggle('on', i === top); });
  }

  // Percorso a tappe
  var journey = document.getElementById('journey');
  var jStage = journey.querySelector('.journey-stage');
  var fill = document.getElementById('routeFill');
  var nodes = Array.prototype.slice.call(journey.querySelectorAll('.route-node'));
  var photos = Array.prototype.slice.call(journey.querySelectorAll('.journey-photos img'));
  var texts = Array.prototype.slice.call(journey.querySelectorAll('.jtext'));
  var nS = nodes.length, current = -1;

  function renderJourney() {
    var p = progress(journey, jStage);
    var f = clamp((p * nS - 0.5) / (nS - 1), 0, 1);
    fill.setAttribute('stroke-dashoffset', String(1 - f));
    var active = Math.round(f * (nS - 1));
    if (active === current) return;
    current = active;
    nodes.forEach(function (n, i) { n.classList.toggle('done', i < active); n.classList.toggle('now', i === active); });
    photos.forEach(function (im, i) { im.classList.toggle('on', i === active); });
    texts.forEach(function (t, i) { t.classList.toggle('on', i === active); t.setAttribute('aria-hidden', i === active ? 'false' : 'true'); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var hb = hero.getBoundingClientRect().bottom;
      bar.classList.toggle('over', hb > bar.offsetHeight + 10);
      bar.classList.toggle('is-scrolled', hb <= bar.offsetHeight + 10);
      decks.forEach(renderDeck);
      renderJourney();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
