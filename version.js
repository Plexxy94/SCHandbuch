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

  /* Prüfstand einer Seite oder eines Hubs.
     Zustände: ok (für die LIVE-Version geprüft), prior (für eine frühere Version geprüft, erneute Prüfung steht aus, NICHT automatisch veraltet),
     partial (konkrete Abweichungen bekannt oder nur teilweise aktualisiert; nur mit state "teilweise" und reason in content-status.json),
     outdated (nachweislich veraltet; nur mit state "veraltet" und reason), unknown (kein Prüfstand erfasst).
     Eine neue LIVE-Version macht aus ok automatisch prior, nie aus prior outdated. */
  function leafIds(id, seen) {
    seen = seen || {};
    if (seen[id]) return [];
    seen[id] = 1;
    if (V.hubs[id]) return V.hubs[id].from.reduce(function (a, k) { return a.concat(leafIds(k, seen)); }, []);
    return V.pages[id] ? [id] : [];
  }
  function pageState(p) {
    var live = V.live && V.live.version;
    if (p.state === 'veraltet') return 'outdated';
    if (!p.patch) return 'unknown';
    if (p.state === 'teilweise') return 'partial';
    return live && cmp(p.patch, live) < 0 ? 'prior' : 'ok';
  }
  V.status = function (id) {
    var hub = !!V.hubs[id], p = V.pages[id];
    if (hub) {
      var ids = leafIds(id), counts = { ok: 0, prior: 0, partial: 0, outdated: 0, unknown: 0 }, oldest = null;
      ids.forEach(function (k) { var q = V.pages[k]; counts[pageState(q)]++; if (q.patch && (!oldest || cmp(q.patch, oldest) < 0)) oldest = q.patch; });
      var live = V.live && V.live.version;
      return { hub: true, patch: oldest, date: null, state: !oldest ? 'unknown' : (live && cmp(oldest, live) < 0 ? 'prior' : 'ok'), counts: counts, total: ids.length, kind: 'Stand' };
    }
    if (!p) return null;
    return { hub: false, patch: p.patch, date: p.date, state: pageState(p), kind: p.kind || 'Stand', note: p.note, reason: p.reason, basis: p.basis };
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
    var shortDate = function (d) { return fmt(d, /^2026/.test(d) && live && /^2026/.test(live.date)); };
    Array.prototype.forEach.call(document.querySelectorAll('.vtag[data-vpage]'), function (el) {
      var view = el.dataset.vpage, s = V.status(view); if (!s) { el.hidden = true; return; }
      if (el.tagName !== 'BUTTON') {   /* aus der Textmarke wird ein Knopf, der den Detailbereich öffnet */
        var b = document.createElement('button'); b.type = 'button'; b.className = el.className; b.dataset.vpage = view; b.hidden = el.hidden; el.replaceWith(b); el = b;
        b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'vp-' + view);
        b.addEventListener('click', function () { var pn = document.getElementById('vp-' + view); var open = pn.hidden; pn.hidden = !open; b.setAttribute('aria-expanded', String(open)); });
      }
      var txt;
      if (s.state === 'unknown') txt = 'Prüfstand nicht erfasst';
      else if (s.state === 'outdated') txt = 'Nachweislich veraltet';
      else if (s.hub) txt = 'Älteste Prüfung: ' + s.patch;
      else {
        txt = (s.kind === 'Datenstand' ? 'Datenstand ' : 'Geprüft für ') + s.patch + (s.date ? ' · ' + shortDate(s.date) : '');
        if (s.state === 'partial') txt += s.kind === 'Datenstand' ? ' · bekannte Lücken' : ' · teils aktualisiert';
      }
      el.className = 'chead-tag vtag ' + s.state; el.textContent = txt; el.hidden = false;
      /* Detailbereich: zugänglich per Tastatur, mit Prüfversion, Prüfdatum, aktueller LIVE-Version und Hinweisen */
      var meta = el.parentElement, pn = document.getElementById('vp-' + view);
      if (!pn) { pn = document.createElement('div'); pn.id = 'vp-' + view; pn.className = 'vpanel'; pn.hidden = true; pn.setAttribute('role', 'region'); pn.setAttribute('aria-label', 'Prüfstand dieser Seite'); meta.insertAdjacentElement('afterend', pn); }
      var rows = [];
      var row = function (k, v) { if (v) rows.push('<dt>' + k + '</dt><dd>' + v + '</dd>'); };
      var E = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      if (s.hub) {
        row('Ältester Prüfstand', s.patch ? 'Version ' + E(s.patch) : '');
        var c = s.counts, parts = [];
        if (c.ok) parts.push(c.ok + ' für LIVE geprüft'); if (c.prior) parts.push(c.prior + ' für eine frühere Version geprüft'); if (c.partial) parts.push(c.partial + ' teils aktualisiert'); if (c.outdated) parts.push(c.outdated + ' nachweislich veraltet'); if (c.unknown) parts.push(c.unknown + ' ohne erfassten Prüfstand');
        row('Seiten in diesem Bereich', s.total + ': ' + parts.join(', '));
      } else {
        row(s.kind === 'Datenstand' ? 'Datenstand' : 'Geprüft für', s.patch ? 'Version ' + E(s.patch) : '');
        row('Prüfdatum', s.date ? E(fmt(s.date)) : (s.patch ? 'nicht angegeben' : ''));
      }
      if (live) row('Aktuelle LIVE-Version', E(live.version) + (liveDate ? ' (seit ' + E(liveDate) + ')' : ''));
      var how = { ok: 'Für die aktuelle LIVE-Version geprüft.', prior: 'Für eine frühere Version geprüft. Eine erneute Prüfung steht aus. Das heißt nicht, dass die Seite falsch ist.',
        partial: 'Teilweise auf neuere Versionen aktualisiert oder mit bekannten Abweichungen, siehe Hinweis.', outdated: 'Nachweislich veraltet, siehe Hinweis.', unknown: 'Für diese Seite ist kein Prüfstand erfasst.' }[s.state];
      if (s.hub) how = 'Zusammenfassung der Unterseiten, kein eigener Prüfstand.';
      row('Einordnung', how);
      row('Hinweis', [s.reason, s.note && s.note !== s.reason ? s.note : ''].filter(Boolean).map(E).join(' '));
      row('Grundlage', s.basis ? E(s.basis) : '');
      pn.innerHTML = '<dl class="vp-dl">' + rows.join('') + '</dl>';
    });
    /* Hinweisleiste: nur wenn LIVE neuer ist als jede geprüfte Seite */
    var n = document.getElementById('patchnote'), top = V.reviewedMax();
    if (n && live && top && cmp(live.version, top) > 0) {
      var seen = ''; try { seen = localStorage.getItem('sc-handbuch-patch') || ''; } catch (e) {}
      if (seen !== live.version) {
        n.querySelector('strong').textContent = 'Patch ' + live.version + ' ist live';
        n.querySelector('span').textContent = 'Die Seiten sind noch nicht für diese Version geprüft (höchster Prüfstand: ' + top + '). Oben bei jeder Seite steht, für welche Version sie geprüft ist. Einzelne Werte können abweichen.';
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
