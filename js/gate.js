(function () {
  var ON = false;
  var KEY = 'centro-access';
  var HASH = 'd82eec7dea315fc9738f2154eae448644683c5acdd9e650991b51177125cb4a9';
  window.CENTRO_GATE = { on: ON, key: KEY, hash: HASH };
  if (!ON || /(^|\/)accesso\.html$/.test(location.pathname)) return;
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) { }
  document.documentElement.style.visibility = 'hidden';
  var page = location.pathname.split('/').pop() || '';
  location.replace('accesso.html' + (page ? '?next=' + encodeURIComponent(page + location.hash) : ''));
})();
