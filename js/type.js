(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function prep(root) {
    if (root.hasAttribute('data-tw')) return;
    root.setAttribute('data-tw', '');
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 1) { walk(ch); return; }
        if (ch.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var w = document.createElement('span');
          w.className = 'tw';
          w.textContent = p;
          frag.appendChild(w);
        });
        node.replaceChild(frag, ch);
      });
    })(root);
  }
  window.centroType = function (root) {
    if (!root) return;
    prep(root);
    var ws = root.querySelectorAll('.tw');
    clearTimeout(root._tw);
    if (reduce) { ws.forEach(function (w) { w.classList.add('on'); }); return; }
    ws.forEach(function (w) { w.classList.remove('on'); });
    var i = 0, step = Math.max(45, Math.min(110, 4500 / ws.length));
    (function next() {
      if (i >= ws.length) return;
      ws[i++].classList.add('on');
      root._tw = setTimeout(next, step);
    })();
  };
})();
