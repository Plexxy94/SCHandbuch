/* Zentrale Versionsverwaltung des Handbuchs.
   Drei getrennte Dinge, die nie vermischt werden:
   1. LIVE-Version und Testversion: version.json, entsteht automatisch aus patchnotes.json (tools/fetch_patchnotes.py, alle 3 Stunden).
   2. Prüfstand einer Seite: content-status.json, von Hand gepflegt, nur nach einer echten Durchsicht anheben.
   3. Datenstände automatisch geladener Daten (News, CCU, Patchnotes) zeigen ihre eigenen Zeitstempel.
   Eine neue LIVE-Version ändert nur (1). Seiten mit älterem Prüfstand werden dadurch von selbst als „vor LIVE“ gekennzeichnet.
   Platzhalter im HTML: [data-sc="live|live-label|live-date|test|test-label|live-test"], [data-sc-if="test"] (nur sichtbar, wenn eine Testversion läuft),
   Kennzeichnung je Seite: <span class="chead-tag vtag" data-vpage="<Ansicht>"></span> */
(function () {
  'use strict';
  var V = window.SC_VERSION = { live: null, test: null, pages: {}, hubs: {}, ready: false };
  var MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  function key(v) { var p = String(v || '').match(/\d+/g) || []; p = p.slice(0, 3).map(Number); while (p.length < 3) p.push(0); return p; }
  function cmp(a, b) { var x = key(a), y = key(b); for (var i = 0; i < 3; i++) { if (x[i] !== y[i]) return x[i] - y[i]; } return 0; }
  function fmt(d, short) {
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d || ''); if (!m) return '';
    return (m[3] ? (+m[3]) + '. ' : '') + MON[+m[2] - 1] + (short ? '' : ' ' + m[1]);
  }
  V.cmp = cmp; V.fmt = fmt;

  /* Prüfstand einer Seite oder eines Hubs: { patch, date, state: ok|old|unknown, hub, kind, note, basis } */
  function leaves(id, seen) {
    seen = seen || {};
    if (seen[id]) return [];
    seen[id] = 1;
    if (V.hubs[id]) return V.hubs[id].from.reduce(function (a, k) { return a.concat(leaves(k, seen)); }, []);
    var p = V.pages[id];
    return p && p.patch ? [p.patch] : [];
  }
  V.status = function (id) {
    var live = V.live && V.live.version, hub = !!V.hubs[id], p = V.pages[id], patch, date = null, kind = 'Stand';
    if (hub) {
      var ls = leaves(id);
      patch = ls.length ? ls.reduce(function (a, b) { return cmp(a, b) <= 0 ? a : b; }) : null;
      kind = 'Ältester Stand';
    } else if (p) { patch = p.patch; date = p.date; kind = p.kind || 'Stand'; }
    else return null;
    var state = !patch ? 'unknown' : (live && cmp(patch, live) < 0 ? 'old' : 'ok');
    return { patch: patch, date: date, state: state, hub: hub, kind: kind, note: p && p.note, basis: p && p.basis };
  };
  /* Höchster eingetragener Prüfstand: unter LIVE heißt, dass noch keine Seite auf die neue Version durchgesehen ist */
  V.reviewedMax = function () {
    var m = null; Object.keys(V.pages).forEach(function (k) { var p = V.pages[k].patch; if (p && (!m || cmp(p, m) > 0)) m = p; }); return m;
  };

  function fill() {
    var live = V.live, test = V.test;
    var map = {
      'live': live ? live.version : '', 'live-label': live ? 'Alpha ' + live.version : '', 'live-date': live ? fmt(live.date) : '',
      'test': test ? test.version : '', 'test-label': test ? 'PTU ' + test.version : '',
      'live-test': live ? 'LIVE ' + live.version + (test ? ' · PTU ' + test.version + ' im Test' : '') : ''
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-sc]'), function (el) {
      var t = map[el.dataset.sc]; if (t) el.textContent = t;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-sc-if]'), function (el) { el.hidden = !map[el.dataset.scIf]; });
    var liveDate = live && live.date ? fmt(live.date) : '';
    Array.prototype.forEach.call(document.querySelectorAll('.vtag[data-vpage]'), function (el) {
      var s = V.status(el.dataset.vpage); if (!s) { el.hidden = true; return; }
      var txt, tip = [];
      if (s.state === 'unknown') { txt = 'Prüfstand nicht erfasst'; tip.push('Für diese Seite ist kein geprüfter Patch eingetragen.'); }
      else {
        txt = s.kind + ' ' + s.patch + (s.date && !s.hub ? ' · ' + fmt(s.date, /^2026/.test(s.date) && live && /^2026/.test(live.date)) : '');
        if (s.state === 'old') txt += ' · LIVE ' + live.version;
        tip.push((s.hub ? 'Älteste geprüfte Unterseite: Patch ' : 'Zuletzt geprüft für Patch ') + s.patch + (s.date && !s.hub ? ' (' + fmt(s.date) + ')' : '') + '.');
        if (s.state === 'old') tip.push('Aktuelle LIVE-Version ist ' + live.version + (liveDate ? ' (seit ' + liveDate + ')' : '') + '. Zahlen und Aussagen können abweichen.');
        else tip.push('Entspricht der aktuellen LIVE-Version ' + (live ? live.version : '') + '.');
      }
      if (s.note) tip.push(s.note);
      if (s.basis) tip.push('Grundlage: ' + s.basis + '.');
      el.className = 'chead-tag vtag ' + s.state;
      el.textContent = txt; el.title = tip.join(' '); el.hidden = false;
    });
    /* Hinweisleiste: nur wenn LIVE neuer ist als jede geprüfte Seite */
    var n = document.getElementById('patchnote'), top = V.reviewedMax();
    if (n && live && top && cmp(live.version, top) > 0) {
      var seen = ''; try { seen = localStorage.getItem('sc-handbuch-patch') || ''; } catch (e) {}
      if (seen !== live.version) {
        n.querySelector('strong').textContent = 'Patch ' + live.version + ' ist live';
        n.querySelector('span').textContent = 'Die Inhalte sind noch nicht auf diese Version durchgesehen (höchster Prüfstand: ' + top + '). Jede Seite zeigt oben ihren eigenen Stand. Tasten, Preise, Ruf-Werte und Bugs können abweichen.';
        n.hidden = false;
        var ok = document.getElementById('patchok');
        if (ok && !ok.dataset.bound) { ok.dataset.bound = '1'; ok.addEventListener('click', function () { n.hidden = true; try { localStorage.setItem('sc-handbuch-patch', live.version); } catch (e) {} }); }
      }
    }
  }
  function get(url) { return fetch(url + '?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  V.refresh = fill;   /* für Tests: nach Änderung von SC_VERSION.live neu zeichnen */
  Promise.all([get('version.json'), get('content-status.json')]).then(function (r) {
    if (r[0]) { V.live = r[0].live || null; V.test = r[0].test || null; }
    if (r[1]) { V.pages = r[1].pages || {}; V.hubs = r[1].hubs || {}; }
    V.ready = true;
    fill();
    document.dispatchEvent(new CustomEvent('scversion'));
  });
})();
