/* Seite „Patchnotes“: liest patchnotes.json (erzeugt von tools/fetch_patchnotes.py) und zeigt je Patch Abschnitte, Einträge und Issue-Council-Nummern.
   Die Daten werden erst geladen, wenn die Seite zum ersten Mal geöffnet wird. Keine Speicherung im Browser. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var data = null, loading = false;
  var st = { kind: 'all', q: '', all: false };
  var KINDS = [['all', 'Alles'], ['feat', 'Neuerungen'], ['bal', 'Balance'], ['fix', 'Fehlerbehebungen'], ['tech', 'Technik'], ['known', 'Bekannte Probleme']];
  var DE = {
    'info': 'Build-Info', 'features and gameplay': 'Neuerungen und Gameplay', 'feature updates': 'Neuerungen', 'features & updates': 'Neuerungen', 'features': 'Neuerungen',
    'ships & vehicles': 'Schiffe und Fahrzeuge', 'ships and vehicles': 'Schiffe und Fahrzeuge', 'balance and tuning': 'Balance', 'bug fixes': 'Fehlerbehebungen',
    'bugfixes & technical': 'Fehlerbehebungen und Technik', 'bug fixes & technical': 'Fehlerbehebungen und Technik', 'stability and performance': 'Stabilität und Leistung',
    'known issues': 'Bekannte Probleme', 'missions': 'Missionen', 'locations and environment': 'Orte und Umgebung', 'fps, weapons and armor': 'FPS, Waffen und Rüstung',
    'ui and text': 'Oberfläche und Text', 'cargo, shopping and inventory': 'Fracht, Einkauf und Inventar', 'additional gameplay updates': 'Weitere Gameplay-Änderungen',
    'additional ship updates': 'Weitere Schiffsänderungen', 'hotfixed in 4.10.2': 'Per Hotfix in 4.10.2 behoben', 'salvage': 'Salvage', 'gameplay': 'Gameplay'
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s).toLowerCase(); }
  function fmtD(iso) { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function fmtT(iso) { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function hi(text) {
    var t = esc(text);
    if (!st.q) return t;
    var q = esc(st.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp('(' + q + ')', 'ig'), '<mark>$1</mark>');
  }
  function deLabel(t) {
    var k = norm(t), g = DE[k];
    if (!g) return '<span>' + esc(t) + '</span>';
    return '<span>' + esc(g) + '</span>' + (norm(g) !== k && k !== 'info' ? ' <i class="gb">' + esc(t) + '</i>' : '');
  }
  function kindOf(u) { return u.t === 'Info' && !u.c ? 'info' : u.k; }
  function label(p) {
    var v = p.version || '';
    if (p.kind === 'live') return v + ' LIVE';
    if (p.kind === 'hotfix') return 'Hotfixes ' + v;
    return v + ' PTU · ' + fmtD(p.date).slice(0, 5);
  }
  function title(p) {
    var t = p.title.replace(/^\[[^\]]*\]\s*/, '').replace(/^Star Citizen\s+/, '').replace(/\s+\d{7,8}\b.*$/, '');
    var wave = (p.title.match(/^\[([^\]]*)\]/) || [])[1];
    return t + (wave ? ' (' + wave + ')' : '');
  }
  function count(p) { var n = 0; p.units.forEach(function (u) { if (kindOf(u) !== 'info') u.n.forEach(function (x) { if (x[0] === 'i' && x[2] === 0) n++; }); }); return n; }
  function selected() {
    var m = /^#patchnotes-(\d+)/.exec(location.hash), id = m && m[1];
    var p = data.patches.filter(function (x) { return x.id === id; })[0];
    if (p) return p;
    return data.patches.filter(function (x) { return x.kind === 'live'; })[0] || data.patches[0];
  }

  function pickBar(sel) {
    var groups = [['live', 'LIVE'], ['ptu', 'PTU-Builds'], ['hotfix', 'Hotfixes']];
    $('pn-pick').innerHTML = groups.map(function (g) {
      var list = data.patches.filter(function (p) { return p.kind === g[0]; });
      if (!list.length) return '';
      return '<div class="pn-grp"><span class="pn-gl">' + g[1] + '</span><div class="chips">' + list.map(function (p) {
        return '<a class="chip" href="#patchnotes-' + p.id + '"' + (p.id === sel.id ? ' aria-current="page" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(label(p)) + '</a>';
      }).join('') + '</div></div>';
    }).join('');
  }

  function itemMatch(n) {
    if (!st.q) return true;
    var q = norm(st.q);
    return norm(n[1]).indexOf(q) > -1 || (n[3] && n[3].join(' ').toLowerCase().indexOf(q) > -1) || (n[4] && norm(n[4]).indexOf(q) > -1);
  }
  function nodeHtml(n) {
    if (n[0] === 'h') return '<h4>' + hi(n[1]) + '</h4>';
    if (n[0] === 'p') return '<p>' + hi(n[1]) + '</p>';
    var ids = (n[3] || []).map(function (i) { return '<a class="pn-id" href="https://issue-council.robertsspaceindustries.com/projects/STAR-CITIZEN/issues/' + i + '" target="_blank" rel="noopener" title="Meldung im Issue Council">' + i + '</a>'; }).join(' ');
    return '<li' + (n[2] ? ' class="pn-sub"' : '') + '><span>' + hi(n[1]) + '</span> ' + ids + (n[4] ? '<span class="pn-note">' + hi(n[4]) + '</span>' : '') + '</li>';
  }
  function bodyHtml(nodes, filterItems) {
    var out = '', open = false;
    nodes.forEach(function (n) {
      if (n[0] === 'i') { if (filterItems && !itemMatch(n)) return; if (!open) { out += '<ul>'; open = true; } out += nodeHtml(n); }
      else { if (open) { out += '</ul>'; open = false; } if (!filterItems || n[0] === 'h') out += nodeHtml(n); else if (!st.q) out += nodeHtml(n); }
    });
    return out + (open ? '</ul>' : '');
  }

  function render() {
    var sel = selected();
    pickBar(sel);
    var main = $('pn-main');
    var counts = { feat: 0, bal: 0, fix: 0, tech: 0, known: 0 };
    sel.units.forEach(function (u) { var k = kindOf(u); if (counts[k] != null) u.n.forEach(function (x) { if (x[0] === 'i' && !x[2]) counts[k]++; }); });
    var head = '<section class="pn-head"><div class="pn-t"><h2 class="pn-h2">' + esc(title(sel)) + '</h2><p class="pn-meta"><span>' + fmtD(sel.date) + '</span>' +
      (sel.build ? '<span>Build ' + esc(String(sel.build).replace(/[.\s]+$/, '')) + '</span>' : '') + '<span>' + count(sel) + ' Einträge</span></p></div>' +
      '<div class="pn-links">' + (sel.full ? '<a class="btn" href="' + esc(sel.full) + '" target="_blank" rel="noopener">Vollständige Notes bei RSI</a>' : '') +
      '<a class="btn2" href="' + esc(sel.spectrum) + '" target="_blank" rel="noopener">Spectrum-Beitrag</a></div></section>';
    var tools = '<div class="pn-tools"><div class="chips" role="group" aria-label="Art der Änderung">' + KINDS.map(function (k) {
      var n = k[0] === 'all' ? '' : ' <small>' + (counts[k[0]] || 0) + '</small>';
      if (k[0] !== 'all' && !counts[k[0]]) return '';
      return '<button type="button" class="chip" data-k="' + k[0] + '" aria-pressed="' + (st.kind === k[0]) + '">' + k[1] + n + '</button>';
    }).join('') + '</div><div class="search"><input id="pn-q" type="search" placeholder="Suchen, z. B. „Salvage“, „Cutlass“ oder „STARC-214984“" aria-label="In den Patchnotes suchen" value="' + esc(st.q) + '"></div>' +
      '<label class="check"><input type="checkbox" id="pn-all"' + (st.all ? ' checked' : '') + '> in allen Patches suchen</label></div>';
    var html = head + tools;
    if (st.q && st.all) html += allResults();
    else html += units(sel);
    main.innerHTML = html;
    $('pn-upd').textContent = 'Zuletzt geprüft ' + fmtT(data.checked || data.updated);
    bind();
  }

  function units(sel) {
    var list = sel.units.filter(function (u) { var k = kindOf(u); return st.kind === 'all' ? true : k === st.kind; });
    var out = '', shown = 0;
    list.forEach(function (u, i) {
      var items = u.n.filter(function (n) { return n[0] === 'i' && itemMatch(n); }).length;
      if (st.q && !items) return;
      shown++;
      var total = u.n.filter(function (n) { return n[0] === 'i' && !n[2]; }).length;
      var open = st.q ? ' open' : (i < 2 || list.length <= 3 ? ' open' : '');
      out += '<details class="pn-unit"' + open + '><summary><span class="pn-ut">' + (u.c && u.c !== u.t ? '<small>' + deLabel(u.c) + '</small> ' : '') + deLabel(u.t) + '</span>' +
        (total ? '<span class="pn-n">' + total + '</span>' : '') + '</summary><div class="pn-body">' + bodyHtml(u.n, !!st.q) + '</div></details>';
    });
    return out ? '<div class="pn-units">' + out + '</div>' : '<p class="empty">Nichts gefunden.</p>';
  }

  function allResults() {
    var out = '', total = 0;
    data.patches.forEach(function (p) {
      var rows = [];
      p.units.forEach(function (u) { u.n.forEach(function (n) { if (n[0] === 'i' && itemMatch(n) && (st.kind === 'all' || kindOf(u) === st.kind)) rows.push([u, n]); }); });
      if (!rows.length) return;
      total += rows.length;
      out += '<details class="pn-unit" open><summary><span class="pn-ut"><a href="#patchnotes-' + p.id + '">' + esc(label(p)) + '</a></span><span class="pn-n">' + rows.length + '</span></summary><div class="pn-body"><ul>' +
        rows.slice(0, 60).map(function (r) { return nodeHtml(r[1]).replace('<li', '<li data-u="' + esc(r[0].t) + '"'); }).join('') + '</ul>' + (rows.length > 60 ? '<p class="small">Weitere ' + (rows.length - 60) + ' Treffer: Patch öffnen und dort suchen.</p>' : '') + '</div></details>';
    });
    return out || '<p class="empty">In keinem Patch gefunden.</p>';
  }

  function bind() {
    var q = $('pn-q');
    q.addEventListener('input', function () { st.q = q.value.trim(); var pos = q.selectionStart; render(); var q2 = $('pn-q'); q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (e) {} });
    $('pn-all').addEventListener('change', function (e) { st.all = e.target.checked; render(); });
    Array.prototype.forEach.call(document.querySelectorAll('#pn-main [data-k]'), function (b) { b.addEventListener('click', function () { st.kind = b.dataset.k; render(); }); });
  }

  function init() {
    if (data || loading) { if (data) render(); return; }
    loading = true;
    fetch('patchnotes.json?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      data = d; loading = false; render();
    }).catch(function () {
      loading = false;
      $('pn-pick').innerHTML = '<p class="small">Die Patchnotes konnten gerade nicht geladen werden. Bitte später erneut versuchen.</p>';
    });
  }

  document.addEventListener('viewchange', function (e) { if (e.detail === 'patchnotes') { st.q = ''; st.kind = 'all'; st.all = false; init(); } });
  if (location.hash.indexOf('#patchnotes') === 0) init();
})();
