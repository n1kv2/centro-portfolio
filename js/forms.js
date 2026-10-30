(function () {
  var URL = 'https://api.web3forms.com/submit';
  var KEY = 'bfe8a9e5-e644-426a-babb-a62fbf2835ea';
  window.centroSend = function (subject, fields, replyto) {
    var body = { access_key: KEY, subject: subject, from_name: 'Sito CEnTRO' };
    Object.keys(fields).forEach(function (k) { body[k] = fields[k]; });
    if (replyto) body.replyto = replyto;
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    return fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        clearTimeout(timer);
        if (!j || j.success !== true) throw new Error((j && j.message) || 'invio');
        return j;
      }, function (e) { clearTimeout(timer); throw e; });
  };
})();
