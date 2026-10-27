// Accesso con codice: finché ON è true, ogni pagina rimanda ad accesso.html se il codice non è stato inserito.
// Per aprire il sito a tutti basta mettere ON = false. Qui c'è solo l'impronta del codice, mai il codice in chiaro.
(function () {
  var ON = true;
  var KEY = 'centro-access';
  var HASH = 'd82eec7dea315fc9738f2154eae448644683c5acdd9e650991b51177125cb4a9';
  window.CENTRO_GATE = { on: ON, key: KEY, hash: HASH };
  if (!ON || /(^|\/)accesso\.html$/.test(location.pathname)) return;
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) { /* niente memoria: si chiede il codice */ }
  document.documentElement.style.visibility = 'hidden';
  var page = location.pathname.split('/').pop() || '';
  location.replace('accesso.html' + (page ? '?next=' + encodeURIComponent(page + location.hash) : ''));
})();
