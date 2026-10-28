"use strict";
/* Lite edition. Uses the SAME localStorage keys/shapes as script.js (full site), so both
   versions share reader data when served from the same origin. Always re-reads storage
   before writing, so edits made in the other version/tab are not overwritten. */
var store = {
  get: function (k, fb) { try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch (e) { return fb; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); }
function sanitize(s) { return String(s).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim(); }
function obj(k) { var v = store.get(k, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
/* Must match computeReaderLevel / readerLevelRanks in script.js */
var RANKS = ['Page Wanderer', 'Ink Novice', 'Story Seeker', 'Chapter Chaser', 'Tale Enthusiast', 'Ink Adept', 'Plot Hunter', 'Lore Keeper', 'Fictional Soul', 'Storybound', 'Arc Master', 'Chronicle Knight', 'Mythic Reader', 'Void Archivist', 'Grand Narrator'];
var avail = novels.filter(function (n) { return n.status !== 'upcoming' && n.ch > 0; });
var main = document.getElementById('main'), live = document.getElementById('live');

function getRead(n) { var v = obj('readProgress')[n.order]; return typeof v === 'number' ? Math.max(0, Math.min(v, n.ch)) : 0; }
function setRead(n, next) {
  var rp = obj('readProgress'), cur = getRead(n);
  next = Math.max(0, Math.min(next, n.ch)); if (next === cur) return;
  rp[n.order] = next; store.set('readProgress', rp);
  if (next > cur) { var log = obj('readingLog'), d = new Date().toISOString().slice(0, 10); log[d] = (log[d] || 0) + (next - cur); store.set('readingLog', log); }
}
function isFav(n) { return !!obj('bookmarks')[n.order]; }
function toggleFav(n) { var b = obj('bookmarks'); b[n.order] = !b[n.order]; store.set('bookmarks', b); return b[n.order]; }
function curOrder() { var c = store.get('currentlyReading', null); return typeof c === 'number' ? c : null; }
function setCur(n) { store.set('currentlyReading', curOrder() === n.order ? null : n.order); }
function stats() {
  var read = 0, done = 0, log = obj('readingLog');
  novels.forEach(function (n) { var r = getRead(n); read += r; if (n.ch > 0 && r >= n.ch) done++; });
  var days = Object.keys(log).filter(function (k) { return log[k] > 0; }).length, fav = 0, b = obj('bookmarks');
  Object.keys(b).forEach(function (k) { if (b[k]) fav++; });
  var xp = read * 15 + done * 60 + days * 5, lvl = 1, rem = xp, need = 100;
  while (rem >= need && lvl < 15) { rem -= need; lvl++; need = 100 + (lvl - 1) * 50; }
  return { read: read, done: done, fav: fav, level: lvl, rank: RANKS[lvl - 1], pct: lvl >= 15 ? 100 : Math.floor(rem / need * 100), into: rem, need: need };
}
function profileName() { return sanitize(obj('readerProfile').name || 'Reader').slice(0, 32) || 'Reader'; }
function announce(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }

function card(n) {
  var r = getRead(n), pct = n.ch ? Math.round(r / n.ch * 100) : 0;
  return '<li><a class="card" href="#/novel/' + n.order + '"><div class="cover"><img src="' + esc(n.img) + '" alt="" loading="lazy"></div><div class="b"><h3>' + esc(n.title) + '</h3>' +
    '<span class="mut">' + esc(n.genres.join(' · ')) + ' · ' + n.ch + ' ch' + (isFav(n) ? ' · ♥' : '') + '</span>' +
    (r ? '<div class="bar" role="img" aria-label="' + pct + '% read"><i style="width:' + pct + '%"></i></div>' : '') + '</div></a></li>';
}
function home() {
  var s = stats(), co = curOrder(), cur = avail.filter(function (n) { return n.order === co && getRead(n) < n.ch; })[0] ||
    avail.filter(function (n) { var r = getRead(n); return r > 0 && r < n.ch; }).sort(function (a, b) { return b.order - a.order; })[0];
  var picks = avail.filter(function (n) { return (n.collections || []).indexOf('editors-choice') > -1; }).slice(0, 4);
  var h = '<h1>Welcome, ' + esc(profileName()) + '</h1><p class="lead">Original fiction by AKA. Rank: <strong>' + esc(s.rank) + '</strong> (level ' + s.level + ').</p><h2>Continue reading</h2>';
  if (cur) {
    var r = getRead(cur), pct = Math.round(r / cur.ch * 100);
    h += '<div class="cont"><div class="cover"><img src="' + esc(cur.img) + '" alt=""></div><div><h3>' + esc(cur.title) + '</h3><p class="mut">' + r + ' of ' + cur.ch + ' chapters read · next: chapter ' + (r + 1) + '</p>' +
      '<div class="bar" role="img" aria-label="' + pct + '% read"><i style="width:' + pct + '%"></i></div><div class="row"><a class="btn p" href="' + esc(cur.link) + '">Continue reading →</a><a class="btn" href="#/novel/' + cur.order + '">Details</a></div></div></div>';
  } else h += '<p class="mut">Nothing in progress yet. <a href="#/shelf">Pick a story from the shelf</a>.</p>';
  return h + '<h2>Editor’s picks</h2><ul class="grid">' + picks.map(card).join('') + '</ul><p style="margin-top:18px"><a class="btn" href="#/shelf">Browse the whole shelf</a></p>';
}
var q = '', g = 'all';
function shelfList() {
  var t = q.toLowerCase(), list = avail.filter(function (n) {
    return (g === 'all' || (g === 'fav' ? isFav(n) : n.genres.indexOf(g) > -1)) && (!t || (n.title + ' ' + n.blurb + ' ' + n.genres.join(' ')).toLowerCase().indexOf(t) > -1);
  });
  return list.length ? list.map(card).join('') : '<li class="mut">No stories match. Try another word or genre.</li>';
}
function shelf() {
  var gs = {}; avail.forEach(function (n) { n.genres.forEach(function (x) { gs[x] = 1; }); });
  var chips = ['all', 'fav'].concat(Object.keys(gs).sort()).map(function (x) {
    return '<button class="btn" data-g="' + esc(x) + '" aria-pressed="' + (x === g) + '">' + (x === 'all' ? 'All' : x === 'fav' ? '♥ Bookmarked' : esc(x)) + '</button>';
  }).join('');
  return '<h1>Shelf</h1><label class="sr" for="q">Search novels</label><input id="q" type="search" placeholder="Search title, genre or story…" value="' + esc(q) + '" autocomplete="off">' +
    '<div class="chips" role="group" aria-label="Filter by genre">' + chips + '</div><ul class="grid" id="list">' + shelfList() + '</ul>';
}
function novel(order) {
  var n = novels.filter(function (x) { return x.order === order; })[0];
  if (!n || n.status === 'upcoming') return '<h1>Story not found</h1><p><a href="#/shelf">Back to the shelf</a></p>';
  var r = getRead(n), pct = Math.round(r / n.ch * 100), chs = '';
  for (var i = 1; i <= n.ch; i++) chs += '<li><button data-ch="' + i + '" class="' + (i <= r ? 'done' : '') + '" aria-pressed="' + (i <= r) + '"><span class="n">' + (i <= r ? '✓' : i) + '</span>' + (n.ch === 1 ? 'One shot' : 'Chapter ' + i) + '<span class="mut" style="margin-left:auto">' + (i <= r ? 'Read' : 'Mark as read') + '</span></button></li>';
  return '<p><a href="#/shelf">← Shelf</a></p><div class="detail"><div class="cover" style="border-radius:var(--r);overflow:hidden"><img src="' + esc(n.img) + '" alt="Cover of ' + esc(n.title) + '"></div><div>' +
    '<h1>' + esc(n.title) + '</h1><p class="mut">' + esc(n.genres.join(' · ')) + ' · ' + esc(n.status) + ' · ⭐ ' + (n.rating || '—') + '</p><p class="prose" style="margin:12px 0">' + esc(n.blurb) + '</p>' +
    '<div class="bar" role="img" aria-label="' + pct + '% read"><i style="width:' + pct + '%"></i></div><p class="mut" style="margin:6px 0 12px">' + r + ' / ' + n.ch + ' chapters read</p>' +
    '<div class="row"><a class="btn p" href="' + esc(n.link) + '">' + (r > 0 && r < n.ch ? 'Continue reading →' : r ? 'Read again →' : 'Start reading →') + '</a>' +
    '<button class="btn" id="fav" aria-pressed="' + isFav(n) + '">' + (isFav(n) ? '♥ Bookmarked' : '♡ Bookmark') + '</button>' +
    '<button class="btn" id="cur" aria-pressed="' + (curOrder() === n.order) + '">' + (curOrder() === n.order ? '✓ Currently reading' : 'Set as currently reading') + '</button></div></div></div>' +
    '<h2>Chapters</h2><ul class="ch">' + chs + '</ul>';
}
function profile() {
  var s = stats(), fs = store.get('readerFontScale', 1), light = store.get('lightMode', 'on') === 'on';
  return '<h1>Reader profile</h1><div class="lvl"><div class="badge" aria-hidden="true">' + s.level + '</div><div><h2 style="margin:0">' + esc(s.rank) + '</h2><p class="mut">Level ' + s.level + (s.level < 15 ? ' · ' + s.into + '/' + s.need + ' XP to next' : ' · max level') + '</p></div></div>' +
    '<div class="bar" style="margin:12px 0;max-width:420px" role="img" aria-label="Level progress ' + s.pct + '%"><i style="width:' + s.pct + '%"></i></div>' +
    '<p class="mut">' + s.read + ' chapters read · ' + s.done + ' stories finished · ' + s.fav + ' bookmarked</p>' +
    '<h2>Display name</h2><div class="row"><label class="sr" for="nm">Display name</label><input id="nm" type="text" maxlength="32" value="' + esc(profileName()) + '"><button class="btn p" id="savenm">Save</button></div>' +
    '<h2>Reading preferences</h2><div class="row"><button class="btn" id="fm" aria-label="Smaller text">A−</button><span class="mut">Text size ' + Math.round(fs * 100) + '%</span><button class="btn" id="fp" aria-label="Larger text">A+</button>' +
    '<button class="btn" id="lt" aria-pressed="' + light + '">' + (light ? 'Light mode: on' : 'Light mode: off') + '</button></div>' +
    '<p class="mut" style="margin-top:22px">Data lives in this browser and is shared with the full site (same address). It does not sync between devices.</p>';
}
function applyPrefs() {
  var lightMode = store.get('lightMode', 'on') === 'on';
  document.body.classList.toggle('light', lightMode);
  document.documentElement.classList.toggle('light', lightMode);
  document.documentElement.style.setProperty('--fs', Math.max(.9, Math.min(1.25, +store.get('readerFontScale', 1) || 1)));
}
function render() {
  applyPrefs();
  var p = (location.hash.replace(/^#\/?/, '') || 'home').split('/'), v = p[0];
  main.innerHTML = v === 'shelf' ? shelf() : v === 'novel' ? novel(+p[1]) : v === 'profile' ? profile() : home();
  document.querySelectorAll('[data-nav]').forEach(function (a) { var on = a.dataset.nav === (v === 'novel' ? 'shelf' : v === 'shelf' || v === 'profile' ? v : 'home'); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  document.title = (v === 'novel' ? (novels.filter(function (x) { return x.order === +p[1]; })[0] || {}).title || 'Story' : v === 'shelf' ? 'Shelf' : v === 'profile' ? 'Profile' : 'Home') + ' — Novels by AKA Lite';
}
var lastHash = null;
function route() { render(); if (lastHash !== null && lastHash !== location.hash) { main.focus(); window.scrollTo(0, 0); } lastHash = location.hash; }
window.addEventListener('hashchange', route);
window.addEventListener('storage', function () { var a = document.activeElement; if (!(a && a.tagName === 'INPUT')) render(); }); /* other tab/version changed data */
document.addEventListener('error', function (e) { if (e.target.tagName === 'IMG') e.target.style.display = 'none'; }, true);
main.addEventListener('input', function (e) { if (e.target.id === 'q') { q = e.target.value; document.getElementById('list').innerHTML = shelfList(); } });
main.addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  var p = location.hash.split('/'), n = novels.filter(function (x) { return x.order === +p[2]; })[0];
  if (b.dataset.g) { g = b.dataset.g; render(); }
  else if (b.dataset.ch && n) { var i = +b.dataset.ch, r = getRead(n); setRead(n, i <= r ? i - 1 : i); render(); announce('Progress ' + getRead(n) + ' of ' + n.ch + ' chapters'); var nb = main.querySelector('[data-ch="' + i + '"]'); if (nb) nb.focus(); }
  else if (b.id === 'fav' && n) { announce(toggleFav(n) ? 'Bookmarked' : 'Bookmark removed'); render(); document.getElementById('fav').focus(); }
  else if (b.id === 'cur' && n) { setCur(n); render(); document.getElementById('cur').focus(); }
  else if (b.id === 'savenm') { var nm = sanitize(document.getElementById('nm').value).slice(0, 32) || 'Reader'; var pr = obj('readerProfile'); pr.name = nm; store.set('readerProfile', pr); render(); announce('Name saved'); }
  else if (b.id === 'fm' || b.id === 'fp') { store.set('readerFontScale', Math.max(.9, Math.min(1.25, +((+store.get('readerFontScale', 1) || 1) + (b.id === 'fp' ? .05 : -.05)).toFixed(2)))); render(); document.getElementById(b.id).focus(); }
  else if (b.id === 'lt') { store.set('lightMode', store.get('lightMode', 'on') === 'on' ? 'off' : 'on'); render(); document.getElementById('lt').focus(); }
});
route();
