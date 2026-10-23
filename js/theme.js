// Tema: automatico (chiaro dall'alba al tramonto all'Aquila, scuro la sera); con il tasto nel menu si sceglie chiaro o scuro fisso.
// Caricato nell'head per applicare il tema prima che la pagina compaia.
(function () {
  var KEY = 'centro-theme';
  var LAT = 42.35, LNG = 13.40; // L'Aquila
  var root = document.documentElement;

  // Alba e tramonto (formule NOAA semplificate)
  function sunTimes(date) {
    var rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
    var days = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var lw = rad * -LNG, phi = rad * LAT;
    var n = Math.round(days - 0.0009 - lw / (2 * Math.PI));
    var ds = 0.0009 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(L) * Math.sin(e));
    var transit = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(rad * -0.833) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = 0.0009 + (w + lw) / (2 * Math.PI) + n;
    var set = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var rise = transit - (set - transit);
    var toDate = function (j) { return new Date((j + 0.5 - J1970) * dayMs); };
    return { rise: toDate(rise), set: toDate(set) };
  }

  function read() { try { return localStorage.getItem(KEY) || 'auto'; } catch (err) { return 'auto'; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (err) { /* nessun salvataggio disponibile */ } }

  function resolve(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    var now = new Date(), t = sunTimes(now);
    return now >= t.rise && now < t.set ? 'light' : 'dark';
  }

  function apply(pref) {
    var mode = resolve(pref);
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-theme-pref', pref);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0B1424' : '#F3F5F9');
    return mode;
  }

  var pref = read();
  apply(pref);
  setInterval(function () { if (read() === 'auto') apply('auto'); }, 5 * 60 * 1000);

  var fmt = function (d) { return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); };
  window.centroTheme = {
    get: read,
    set: function (v) { write(v); return apply(v); },
    times: function () { var t = sunTimes(new Date()); return { rise: fmt(t.rise), set: fmt(t.set) }; }
  };
})();
