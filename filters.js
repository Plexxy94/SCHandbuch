/* Einheitliches Filterkonzept für alle durchsuchbaren Listen (Schiffe, Bugs, Glossar, Tastenbelegung, Wikelo, Fundorte, News).
   Die Listen behalten ihre eigene Filterlogik. Dieses Modul liest nur den Zustand ihrer Bedienelemente und zeigt darüber überall dasselbe:
   - die Zahl der Treffer im Verhältnis zur Gesamtzahl („11 von 225 Schiffen“), mit Hinweis auf stillschweigend ausgeblendete Teile
   - jeden aktiven Filter als einzeln entfernbaren Chip
   - „Alle Filter zurücksetzen“
   - die Herkunft eines Filters: selbst gesetzt, oder automatisch durch einen Schnellzugriff („Weiter zu“-Chip). Automatisch gesetzte Filter sind
     markiert und werden beim Verlassen der Seite wieder aufgehoben, damit sie beim nächsten Besuch keine Ergebnisse verfälschen.
   Bedienelemente: Suchfeld (text), Chip-Gruppe (chips, erstes Chip = Standard), Kontrollkästchen (check), Auswahlliste (select). */
(function () {
  'use strict';
  var F = window.SC_FILTER = { bars: {} };
  function $(s, root) { return (root || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fire(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }
  function clean(t) { return String(t).replace(/\s*\(\d+\)\s*$/, '').replace(/\s+/g, ' ').trim(); }

  /* ---- Bedienelemente vereinheitlichen ---- */
  function control(c) {
    if (c.kind === 'custom') return { label: c.label, kind: 'custom', active: c.active, text: c.text, clear: c.clear, el: c.el ? $(c.el) : null, events: c.el ? (c.events || ['change']) : [] };   /* Listen, die ihre Bedienelemente selbst neu zeichnen (Patchnotes) */
    var el = $(c.el); if (!el) return null;
    var o = { label: c.label, el: el, kind: c.kind };
    if (c.kind === 'text') {
      o.active = function () { return !!el.value.trim(); };
      o.text = function () { return c.label + ': „' + el.value.trim() + '“'; };
      o.clear = function () { el.value = ''; fire(el, 'input'); };
      o.events = ['input'];
    } else if (c.kind === 'chips') {
      o.btns = function () { return Array.prototype.slice.call(el.querySelectorAll('button')); };
      o.cur = function () { var b = o.btns(); for (var i = 0; i < b.length; i++) if (b[i].getAttribute('aria-pressed') === 'true') return i; return 0; };
      o.active = function () { return o.btns().length > 0 && o.cur() > 0; };
      o.text = function () { var b = o.btns()[o.cur()]; return c.label + ': ' + (b ? clean(b.textContent) : ''); };
      o.clear = function () { var b = o.btns()[0]; if (b) b.click(); };
      o.events = ['click'];
    } else if (c.kind === 'check') {
      o.active = function () { return el.checked; };
      o.text = function () { return c.label; };
      o.clear = function () { el.checked = false; fire(el, 'change'); };
      o.events = ['change'];
    } else if (c.kind === 'select') {
      var def = el.options[0] ? el.options[0].value : '';
      o.active = function () { return el.value !== def; };
      o.text = function () { return c.label + ': ' + (el.selectedOptions[0] ? clean(el.selectedOptions[0].textContent) : el.value); };
      o.clear = function () { el.value = def; fire(el, 'change'); };
      o.events = ['change'];
    }
    return o;
  }

  /* ---- Leiste ---- */
  F.watch = function (id, spec) {
    var ctl = spec.controls.map(control).filter(Boolean);
    var host = $(spec.after); if (!host || !ctl.length) return null;
    var bar = { id: id, view: spec.view, ctl: ctl, origin: {}, busy: false, spec: spec, box: null };
    var box = document.createElement('div');
    box.className = 'fbar'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Filter und Ergebnisse: ' + spec.noun[1]);
    box.innerHTML = '<p class="fbar-count" role="status"></p><ul class="fbar-chips" aria-label="Aktive Filter"></ul><button type="button" class="fbar-reset" hidden><span aria-hidden="true">↺</span> Alle Filter zurücksetzen</button><p class="fbar-note" hidden></p>';
    host.insertAdjacentElement('afterend', box); bar.box = box;
    var countEl = box.querySelector('.fbar-count'), list = box.querySelector('.fbar-chips'), reset = box.querySelector('.fbar-reset'), note = box.querySelector('.fbar-note');
    if (spec.countEl) { var ce = $(spec.countEl); if (ce) ce.classList.add('sr-only'); }   /* die Zahl steht jetzt in der Leiste; das alte Feld bleibt für Screenreader */

    function active() { var a = []; ctl.forEach(function (c, i) { if (c.active()) a.push(i); }); return a; }
    function refresh() {
      var act = active(), n = spec.count ? spec.count() : null, noun = spec.noun;
      var html = '';
      if (n && n.total != null) {
        html = '<b>' + n.shown + '</b> von ' + n.total + ' ' + (n.total === 1 ? noun[0] : noun[1]);
        if (n.shown === 0) html += ' <span class="fbar-zero">· keine Treffer</span>';
      } else if (n && n.text) html = esc(n.text);
      var hid = spec.hidden ? spec.hidden() : null;
      if (hid) html += ' <span class="fbar-extra">· ' + esc(hid.text) + ' <button type="button" class="flink" data-fx="hid">' + esc(hid.label) + '</button></span>';
      countEl.innerHTML = html;
      countEl.classList.toggle('zero', !!(n && n.shown === 0 && act.length));
      list.innerHTML = act.length ? act.map(function (i) {
        var auto = bar.origin[i];
        return '<li><button type="button" class="fchip' + (auto ? ' auto' : '') + '" data-i="' + i + '" aria-label="Filter entfernen: ' + esc(ctl[i].text()) + (auto ? ' (durch Schnellzugriff gesetzt)' : '') + '">' +
          (auto ? '<span class="fchip-src">Schnellzugriff</span>' : '') + '<span class="fchip-t">' + esc(ctl[i].text()) + '</span><span class="fchip-x" aria-hidden="true">×</span></button></li>';
      }).join('') : '<li class="fbar-none">Keine Filter aktiv</li>';
      reset.hidden = !act.length;
      var srcs = {}; act.forEach(function (i) { if (bar.origin[i]) srcs[bar.origin[i]] = 1; });
      var names = Object.keys(srcs);
      note.hidden = !names.length;
      note.innerHTML = names.length ? 'Gesetzt durch den Schnellzugriff „' + esc(names.join('“, „')) + '“, nicht von dir. Er wird aufgehoben, sobald du die Seite verlässt.' + (bar.cleared ? ' ' + (bar.cleared === 1 ? 'Dein bisheriger Filter wurde' : 'Deine bisherigen ' + bar.cleared + ' Filter wurden') + ' dafür zurückgesetzt.' : '') : '';
      box.classList.toggle('on', act.length > 0);
    }
    var t = 0; function later() { clearTimeout(t); t = setTimeout(refresh, 0); }
    bar.refresh = refresh;
    bar.resetAll = function () { bar.busy = true; ctl.forEach(function (c) { if (c.active()) c.clear(); }); bar.origin = {}; bar.busy = false; refresh(); };
    bar.clearAuto = function () { var any = false; bar.cleared = 0; bar.busy = true; Object.keys(bar.origin).forEach(function (i) { if (ctl[i].active()) ctl[i].clear(); any = true; }); bar.origin = {}; bar.busy = false; if (any) refresh(); };
    bar.hasAuto = function () { return Object.keys(bar.origin).length > 0; };
    /* Schnellzugriff: alles auf Standard, dann die Voreinstellung setzen; die danach aktiven Filter gelten als automatisch gesetzt */
    bar.preset = function (fn, source) {
      bar.busy = true; var before = active().length; ctl.forEach(function (c) { if (c.active()) c.clear(); });
      bar.origin = {}; bar.cleared = before; fn();
      active().forEach(function (i) { bar.origin[i] = source; });
      bar.busy = false; refresh();
    };
    /* eigene Eingabe macht einen automatisch gesetzten Filter zum eigenen */
    ctl.forEach(function (c, i) { if (!c.el) return; c.events.forEach(function (ev) { c.el.addEventListener(ev, function () { if (!bar.busy) { delete bar.origin[i]; bar.cleared = 0; } later(); }, true); }); });
    list.addEventListener('click', function (e) { var b = e.target.closest('.fchip'); if (!b) return; var i = +b.dataset.i; bar.busy = true; ctl[i].clear(); delete bar.origin[i]; bar.busy = false; refresh(); var nx = list.querySelector('.fchip') || reset; if (nx && !nx.hidden) nx.focus(); });
    reset.addEventListener('click', function () { bar.resetAll(); var f = spec.focus && $(spec.focus); if (f) f.focus(); });
    countEl.addEventListener('click', function (e) { var b = e.target.closest('[data-fx="hid"]'); if (b && spec.hidden) { var h = spec.hidden(); if (h && h.run) { bar.busy = false; h.run(); } later(); } });
    if (spec.countEl && window.MutationObserver) { var ce2 = $(spec.countEl); if (ce2) new MutationObserver(later).observe(ce2, { childList: true, characterData: true, subtree: true }); }
    (spec.observe || []).forEach(function (sel) { var o = $(sel); if (o && window.MutationObserver) new MutationObserver(later).observe(o, { childList: true, subtree: true }); });
    F.bars[id] = bar; refresh();
    return bar;
  };

  /* Verlassen einer Seite: automatisch gesetzte Filter aufheben, damit der nächste Besuch nicht gefiltert beginnt */
  document.addEventListener('viewchange', function (e) {
    Object.keys(F.bars).forEach(function (k) { var b = F.bars[k]; if (b.view !== e.detail && b.hasAuto()) b.clearAuto(); });
  });
  /* Schnellzugriff mit Voreinstellung (data-pre="bug:beruf", "ship:Fracht"): setzt den Filter und markiert ihn als automatisch gesetzt */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-pre]'); if (!a) return;
    var p = a.dataset.pre.split(':'), id = p[0] === 'bug' ? 'bugs' : 'ships';
    var src = (a.lastChild && a.lastChild.textContent || a.textContent).trim();
    setTimeout(function () {
      var bar = F.bars[id]; if (!bar) return;
      bar.preset(function () {
        var btn = p[0] === 'bug' ? $('#bugchips .chip[data-cat="' + p[1] + '"]')
          : Array.prototype.filter.call(document.querySelectorAll('#shcat .chip'), function (c) { return c.textContent === p[1]; })[0];
        if (btn) btn.click();
      }, src);
      /* Der Nutzer wollte die gefilterte Liste sehen: zur Filterleiste springen, damit der gesetzte Filter nicht unbemerkt bleibt */
      if (bar.box) setTimeout(function () { bar.box.scrollIntoView({ block: 'start' }); }, 60);
    }, 160);
  });

  /* ---- Anbindung der vorhandenen Listen ---- */
  function parseCount(sel) { return function () { var el = $(sel); var m = el && /(\d+)\s+von\s+(\d+)/.exec(el.textContent); return m ? { shown: +m[1], total: +m[2] } : null; }; }
  function init() {
    F.watch('ships', {
      view: 'schiffe', noun: ['Schiff', 'Schiffen'], after: '.search:has(#shq)', countEl: '#shcount', focus: '#shq', count: parseCount('#shcount'),
      controls: [
        { kind: 'text', el: '#shq', label: 'Suche' }, { kind: 'chips', el: '#shcat', label: 'Einsatzzweck' },
        { kind: 'check', el: '#shmine', label: 'Nur meine' }, { kind: 'check', el: '#shtip', label: 'Nur Einsteiger-Tipps' },
        { kind: 'check', el: '#shbuy', label: 'Im Spiel kaufbar' }, { kind: 'check', el: '#shrent', label: 'Mietbar' },
        { kind: 'check', el: '#shveh', label: 'Bodenfahrzeuge eingeblendet' }, { kind: 'select', el: '#shcrew', label: 'Crew' },
        { kind: 'text', el: '#shbudget', label: 'Budget' }
      ],
      /* Standardmäßig sind Bodenfahrzeuge ausgeblendet. Das war bisher unsichtbar und ließ Zählungen scheinbar nicht aufgehen. */
      hidden: function () {
        var veh = $('#shveh'), mine = $('#shmine'), cat = $('#shcat [aria-pressed="true"]');
        if (veh.checked || mine.checked || (cat && cat.textContent === 'Bodenfahrzeug')) return null;
        var n = (window.SHIPS || []).filter(function (s) { return s.veh; }).length;
        return n ? { text: 'ohne ' + n + ' Bodenfahrzeuge', label: 'einblenden', run: function () { veh.checked = true; fire(veh, 'change'); } } : null;
      }
    });
    F.watch('bugs', { view: 'bugs', noun: ['Bug', 'Bugs'], after: '.search:has(#bugq)', countEl: '#bugcount', focus: '#bugq', count: parseCount('#bugcount'),
      controls: [{ kind: 'text', el: '#bugq', label: 'Suche' }, { kind: 'chips', el: '#bugchips', label: 'Bereich' }] });
    F.watch('gloss', { view: 'glossar', noun: ['Begriff', 'Begriffen'], after: '.search:has(#gq)', countEl: '#gcount', focus: '#gq',
      count: function () { var m = /^(\d+)/.exec(($('#gcount') || {}).textContent || ''); return m ? { shown: +m[1], total: (window.SC_GLOSS || []).length } : null; },
      controls: [{ kind: 'text', el: '#gq', label: 'Suche' }, { kind: 'chips', el: '#gchips', label: 'Kategorie' }] });
    F.watch('keys', { view: 'tasten', noun: ['Belegung', 'Belegungen'], after: '.search:has(#q)', countEl: '#count', focus: '#q',
      count: function () { var rows = document.querySelectorAll('#grid .row'); return { shown: document.querySelectorAll('#grid .row:not([hidden])').length, total: rows.length }; },
      controls: [{ kind: 'text', el: '#q', label: 'Suche' }] });
    F.watch('wk', { view: 'hathor', noun: ['Schiff', 'Schiffen'], after: '#wkchips', countEl: '#wkcount', count: parseCount('#wkcount'),
      controls: [{ kind: 'chips', el: '#wkchips', label: 'Filter' }] });
    F.watch('hosas', { view: 'hosas', noun: ['Funktion', 'Funktionen'], after: '.search:has(#hoq)', countEl: '#hocount', focus: '#hoq',
      count: function () { var t = ($('#hocount') || {}).textContent || ''; return t.trim() ? { text: t.trim() } : null; },
      controls: [{ kind: 'text', el: '#hoq', label: 'Suche' }, { kind: 'chips', el: '#horole', label: 'Rolle' },
        { kind: 'custom', label: 'Modifier', el: '#hom', events: ['change'], active: function () { return !$('#hom').checked; }, text: function () { return 'Ohne Modifier-Funktionen'; },
          clear: function () { var e = $('#hom'); e.checked = true; fire(e, 'change'); } }] });
    F.watch('news', { view: 'news', noun: ['Beitrag', 'Beiträge'], after: '#nwcats', observe: ['#nwlist', '#nwcats'],
      count: function () { var n = document.querySelectorAll('#nwlist .nw-item').length; return n ? { text: n + ' Beiträge geladen' } : null; },
      controls: [{ kind: 'chips', el: '#nwcats', label: 'Kategorie' }] });
    F.watch('loc', { view: 'mining', noun: ['Fundort', 'Fundorten'], after: '.search:has(#locq)', countEl: '#loccount', focus: '#locq',
      count: function () { var t = ($('#loccount') || {}).textContent || ''; return t.trim() ? { text: t.trim() } : null; },
      controls: [{ kind: 'text', el: '#locq', label: 'Suche' }, { kind: 'chips', el: '#locsys', label: 'System' }, { kind: 'chips', el: '#locmeth', label: 'Abbauart' }] });
  }
  init();
})();
