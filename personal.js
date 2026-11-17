/* Persönliches: Favoriten, Zuletzt besucht, Schnellzugriffe und Second-Screen-Modus.
   Alles zentral hier, alles nur im Browser (localStorage, ein Schlüssel: sc-handbuch-me).
   Bereits gespeicherte Daten anderer Funktionen werden nicht angefasst und nicht umgezogen:
   sc-handbuch-ships (Meine Schiffe), sc-handbuch-steps, sc-handbuch-plan, sc-exec-check, sc-news-seen, sc-handbuch-patch, sc-handbuch-focus-last.
   Format von sc-handbuch-me: { v:1, fav:[{h:"mining", j:"a-mn-raff"}], recent:[{h:"hauling", j:"", ts:123}], ss:true|false }
   h = Ansicht, j = optionale Sprung-ID eines Abschnitts. Titel werden aus der Seite gelesen und nicht gespeichert. */
(function () {
  'use strict';
  var KEY = 'sc-handbuch-me', MAX_RECENT = 8, MAX_FAV = 30;
  var me = { v: 1, fav: [], recent: [], ss: false };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function valid(x) { return x && typeof x.h === 'string' && /^[a-z0-9-]+$/.test(x.h) && (!x.j || /^[A-Za-z0-9_-]+$/.test(x.j)); }
  try {
    var o = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (o && typeof o === 'object') {
      if (Array.isArray(o.fav)) me.fav = o.fav.filter(valid).slice(0, MAX_FAV);
      if (Array.isArray(o.recent)) me.recent = o.recent.filter(valid).slice(0, MAX_RECENT);
      me.ss = !!o.ss;
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) {} }
  function fire() { document.dispatchEvent(new CustomEvent('mechange')); }
  var same = function (a, b) { return a.h === b.h && (a.j || '') === (b.j || ''); };

  /* ---- Beschriftung aus der Seite ---- */
  function clean(el) {
    var c = el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('.pill, small, .count, .gb, .beta, svg'), function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function pageName(h) {
    var v = $('view-' + h), t = v && v.querySelector('h1');
    return t ? clean(t) : h;
  }
  function label(it) {
    var p = pageName(it.h);
    if (!it.j) return p;
    var el = $(it.j); if (!el) return p;
    var t = /^H[1-6]$/.test(el.tagName) ? el : (el.querySelector('h2, h3, h4') || el);
    var s = clean(t); if (s.length > 64) s = s.slice(0, 62) + '…';
    return s && s !== p ? p + ' › ' + s : p;
  }
  function exists(it) { return !!$('view-' + it.h); }

  /* ---- Favoriten ---- */
  function findFav(h, j) { for (var i = 0; i < me.fav.length; i++) if (same(me.fav[i], { h: h, j: j })) return i; return -1; }
  var api = window.SC_ME = {
    isFav: function (h, j) { return findFav(h, j || '') >= 0; },
    toggle: function (h, j) {
      var i = findFav(h, j || '');
      if (i >= 0) me.fav.splice(i, 1);
      else { if (me.fav.length >= MAX_FAV) me.fav.pop(); me.fav.unshift(j ? { h: h, j: j } : { h: h }); }
      save(); fire();
    },
    fav: function () { return me.fav.filter(exists); },
    recent: function () { return me.recent.filter(exists); },
    ss: function () { return me.ss; },
    setSS: setSS,
    label: label
  };
  function move(i, d) { var k = i + d; if (k < 0 || k >= me.fav.length) return; var t = me.fav[i]; me.fav[i] = me.fav[k]; me.fav[k] = t; save(); fire(); }

  /* ---- Second-Screen-Modus ---- */
  function setSS(on) {
    me.ss = !!on;
    document.documentElement.classList.toggle('ss', me.ss);
    save(); paintSS();
    document.dispatchEvent(new CustomEvent('scss', { detail: me.ss }));
  }
  function paintSS() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-me="ss"]'), function (b) { b.setAttribute('aria-pressed', String(me.ss)); b.classList.toggle('on', me.ss); });
  }
  document.documentElement.classList.toggle('ss', me.ss);

  /* ---- Zuletzt besucht ---- */
  var curView = null;
  function touch(view) {
    if (view === 'start') return;
    var j = '';
    me.recent = me.recent.filter(function (r) { if (r.h === view) { j = ''; return false; } return true; });
    me.recent.unshift({ h: view, j: j, ts: Date.now() });
    me.recent = me.recent.slice(0, MAX_RECENT);
    save();
  }
  /* aktuellen Abschnitt merken (Scrollspy des Inhaltsverzeichnisses), damit „Weiter bei …“ dorthin springt */
  var secT = 0;
  window.addEventListener('scroll', function () {
    clearTimeout(secT);
    secT = setTimeout(function () {
      if (!curView || curView === 'start' || !me.recent[0] || me.recent[0].h !== curView) return;
      var c = document.querySelector('#toc-rail [aria-current]'), j = c ? c.dataset.jump || '' : '';
      if (j !== (me.recent[0].j || '')) { me.recent[0].j = j; save(); fire(); }
    }, 900);
  }, { passive: true });

  /* ---- Darstellung ---- */
  function link(it) { return '<a href="#' + it.h + '"' + (it.j ? ' data-jump="' + it.j + '"' : '') + '>' + esc(label(it)) + '</a>'; }
  function favList() {
    var f = me.fav.filter(exists);
    return f.length ? f.map(function (it, i) {
      return '<li class="me-row">' + link(it) + '<span class="me-act"><button type="button" data-act="up" data-i="' + me.fav.indexOf(it) + '" aria-label="Nach oben"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-act="rm" data-i="' + me.fav.indexOf(it) + '" aria-label="Entfernen">✕</button></span></li>';
    }).join('') : '<li class="me-empty">Noch nichts gemerkt. Mit ☆ im Seitenkopf oder neben einem Abschnitt im Inhaltsverzeichnis merkst du Seiten und Abschnitte.</li>';
  }
  function recList() {
    var r = me.recent.filter(exists);
    return r.length ? r.map(function (it) { return '<li class="me-row">' + link(it) + '</li>'; }).join('') : '<li class="me-empty">Noch keine Seite besucht.</li>';
  }
  function chips() {
    var box = $('st-me'); if (!box) return;
    var f = me.fav.filter(exists), r = me.recent.filter(exists).slice(0, 4), out = '';
    f.forEach(function (it) { out += '<a class="me-chip fav" href="#' + it.h + '"' + (it.j ? ' data-jump="' + it.j + '"' : '') + '><span aria-hidden="true">★</span>' + esc(label(it)) + '</a>'; });
    r.forEach(function (it) { if (!f.some(function (x) { return same(x, it); })) out += '<a class="me-chip" href="#' + it.h + '"' + (it.j ? ' data-jump="' + it.j + '"' : '') + '><span aria-hidden="true">↺</span>' + esc(label(it)) + '</a>'; });
    box.innerHTML = out || '<p class="small">Hier erscheinen deine Favoriten und die zuletzt besuchten Seiten. Merken: ☆ im Seitenkopf oder im Inhaltsverzeichnis.</p>';
  }
  function stars() {
    Array.prototype.forEach.call(document.querySelectorAll('.fav-btn, .fav-sec'), function (b) {
      var on = api.isFav(b.dataset.h, b.dataset.j);
      b.setAttribute('aria-pressed', String(on));
      if (b.classList.contains('fav-btn')) b.innerHTML = '<span aria-hidden="true">' + (on ? '★' : '☆') + '</span> ' + (on ? 'Gemerkt' : 'Merken');
      else b.textContent = on ? '★' : '☆';
    });
    var cur = $('me-cur');
    if (cur && curView) { var on2 = api.isFav(curView, ''); cur.setAttribute('aria-pressed', String(on2)); cur.innerHTML = '<span aria-hidden="true">' + (on2 ? '★' : '☆') + '</span> ' + (on2 ? 'Diese Seite ist gemerkt' : 'Diese Seite merken'); cur.hidden = curView === 'start'; }
  }
  function lists() {
    if ($('me-fav')) { $('me-fav').innerHTML = favList(); $('me-rec').innerHTML = recList(); }
    chips(); stars(); paintSS();
  }

  /* Seitenkopf: Stern; Inhaltsverzeichnis (Leiste und Knopf): Stern je Abschnitt */
  function decorate(view) {
    var v = $('view-' + view), meta = v && v.querySelector('.chead-meta');
    if (meta && !meta.querySelector('.fav-btn')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fav-btn'; b.dataset.h = view; b.setAttribute('aria-pressed', 'false');
      meta.appendChild(b);
    }
    Array.prototype.forEach.call(document.querySelectorAll('#toc-rail li, #toc-pop li'), function (li) {
      if (li.querySelector('.fav-sec')) return;
      var a = li.querySelector('a[data-jump]'); if (!a) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fav-sec'; b.dataset.h = view; b.dataset.j = a.dataset.jump;
      b.setAttribute('aria-label', 'Abschnitt merken'); li.appendChild(b);
    });
  }

  /* ---- Fenster „Meine Seiten“ ---- */
  var pop = document.createElement('div');
  pop.className = 'me-pop'; pop.id = 'me-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Meine Seiten');
  pop.innerHTML = '<div class="me-top"><b>Meine Seiten</b><button type="button" class="me-x" data-me="close" aria-label="Schließen">✕</button></div>' +
    '<button type="button" class="me-cur" id="me-cur" data-me="cur" aria-pressed="false"></button>' +
    '<h3>Favoriten</h3><ul id="me-fav"></ul><h3>Zuletzt besucht</h3><ul id="me-rec"></ul>' +
    '<h3>Anzeige</h3><button type="button" class="me-ss" data-me="ss" aria-pressed="false"><span aria-hidden="true">▭</span> Second-Screen-Modus</button>' +
    '<p class="small">Kompakter, ohne Dekoration und Animationen, für ein zweites Fenster oder einen zweiten Monitor.</p>' +
    '<button type="button" class="me-clear" data-me="clear">Favoriten und Verlauf löschen</button>' +
    '<p class="small">Nur in diesem Browser gespeichert. „Meine Schiffe“, Häkchen, Planer und Hangar-Liste bleiben davon unberührt.</p>';
  document.body.appendChild(pop);
  var btn = $('navme');
  function openPop() { lists(); pop.hidden = false; if (btn) btn.setAttribute('aria-expanded', 'true'); var x = pop.querySelector('.me-x'); if (x) x.focus(); }
  function closePop(back) { pop.hidden = true; if (btn) { btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus(); } }
  if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); if (pop.hidden) openPop(); else closePop(); });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!pop.hidden && !pop.contains(t) && !(btn && btn.contains(t))) closePop();
    var a = t.closest && t.closest('[data-me]');
    if (a) {
      var m = a.dataset.me;
      if (m === 'close') closePop(true);
      else if (m === 'cur' && curView) api.toggle(curView, '');
      else if (m === 'ss') setSS(!me.ss);
      else if (m === 'clear') { if (window.confirm('Favoriten und Verlauf in diesem Browser löschen?')) { me.fav = []; me.recent = []; save(); fire(); } }
      return;
    }
    var s = t.closest && t.closest('.fav-btn, .fav-sec');
    if (s) { e.preventDefault(); api.toggle(s.dataset.h, s.dataset.j || ''); return; }
    var act = t.closest && t.closest('[data-act]');
    if (act) { var i = +act.dataset.i; if (act.dataset.act === 'rm') { me.fav.splice(i, 1); save(); fire(); } else move(i, -1); return; }
    if (!pop.hidden && t.closest && t.closest('#me-pop a')) closePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { closePop(true); } });
  document.addEventListener('mechange', lists);

  document.addEventListener('viewchange', function (e) { curView = e.detail; touch(curView); decorate(curView); lists(); });
  var first = document.querySelector('section.view:not([hidden])');
  if (first) { curView = first.dataset.view; touch(curView); decorate(curView); }
  lists();
})();
