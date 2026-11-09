/* Automatically record a chapter when its reading page opens.
   Progress uses the same novel order IDs as novels-data.js, while
   chapterReadIds keeps an exact per-chapter record for read dots. */
(function () {
  'use strict';

  var path = decodeURIComponent(location.pathname).replace(/\\/g, '/').toLowerCase();
  var match;
  var order = 0;
  var chapter = 0;
  var chapterId = '';
  var customReadKey = '';
  var trackOnly = false;

  function route(regex, novelOrder, chapterNumber, id, readKey, onlyTrackChapter) {
    var result = path.match(regex);
    if (!result) return false;
    order = novelOrder;
    chapter = typeof chapterNumber === 'function' ? chapterNumber(result) : chapterNumber;
    chapterId = id ? id(result) : 'ch' + chapter;
    customReadKey = readKey || '';
    trackOnly = onlyTrackChapter === true;
    return true;
  }

  var resolved =
    route(/\/rp\/rpc([1-6])\.html$/, 1, function (m) { return +m[1]; }) ||
    route(/\/tpof\/tpof([1-7])\.html$/, 2, function (m) { return +m[1]; }) ||
    route(/\/tpof\/tpofe\.html$/, 2, 8) ||
    route(/\/tpof\/thwnr([1-9])\.html$/, 21, function (m) { return +m[1]; }) ||
    route(/\/tpof\/thwnre\.html$/, 21, 10) ||
    route(/\/tptfwas\/tptfwas([1-4])\.html$/, 3, function (m) { return +m[1]; }) ||
    route(/\/tptfwas\/tptfwasv2-([1-5])\.html$/, 8, function (m) { return +m[1]; }) ||
    route(/\/tptfwas\/tptfwas3-1\.html$/, 11, 1) ||
    route(/\/tptfwas\/tptfwasv3-([2-9])\.html$/, 11, function (m) { return +m[1]; }) ||
    route(/\/tptfwas\/tptfwas4-([1-4])\.html$/, 19, function (m) { return +m[1]; }) ||
    route(/\/tptfwas\/p([1-5])\.html$/, 18, function (m) { return +m[1]; }) ||
    route(/\/tdss\/tdma([1-9]|10|11)\.html$/, 22, function (m) { return +m[1]; }, null, null, true) ||
    route(/\/tdss\/tdmae\.html$/, 22, 12, function () { return 'epilogue'; }, null, true) ||
    route(/\/tdss\/tdss([1-9]|10|11)\.html$/, 4, function (m) { return +m[1]; }) ||
    route(/\/hah\/hahv2-([1-4])\.html$/, 10, function (m) { return +m[1]; }) ||
    route(/\/hah\/hah05\.html$/, 14, 1, function () { return 'ch0.5'; }, 'hahv2Read') ||
    route(/\/hah\/hah3-([1-8])\.html$/, 14, function (m) { return +m[1] + 1; }, function (m) { return 'ch' + m[1]; }, 'hahv2Read') ||
    route(/\/hah\/hah([1-5])\.html$/, 5, function (m) { return +m[1]; }) ||
    route(/\/cfy\/cfy(1[0-5]|[1-9])\.html$/, 6, function (m) { return +m[1]; }) ||
    route(/\/tsor\/tosor([1-5])\.html$/, 7, function (m) { return +m[1]; }) ||
    route(/\/tod\/tod(1[0-2]|[1-9])\.html$/, 16, function (m) { return +m[1]; }) ||
    route(/\/tod\/tod\.(3|8)\.html$/, 16, function (m) { return +m[1]; }) ||
    route(/\/os\/os\.html$/, 9, 1) ||
    route(/\/os\/os2\.html$/, 12, 1) ||
    route(/\/os\/this\.html$/, 13, 1) ||
    route(/\/os\/osn\.html$/, 15, 1) ||
    route(/\/os\/tsbm\.html$/, 17, 1) ||
    route(/\/os\/da\.html$/, 20, 1);

  if (!resolved || !order || !chapter) return;

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { }
  }

  if (!trackOnly) {
    var progress = read('readProgress', {});
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {};
    var existing = Math.max(0, Number(progress[order]) || 0);
    var delta = Math.max(0, chapter - existing);
    if (delta) {
      progress[order] = chapter;
      write('readProgress', progress);
      var log = read('readingLog', {});
      if (!log || typeof log !== 'object' || Array.isArray(log)) log = {};
      var day = new Date().toISOString().slice(0, 10);
      log[day] = (Number(log[day]) || 0) + delta;
      write('readingLog', log);
      var hour = new Date().getHours();
      if (hour >= 23 || hour < 5) write('nightOwlRead', true);
    }
    write('currentlyReading', order);
  }

  var ids = read('chapterReadIds', {});
  if (!ids || typeof ids !== 'object' || Array.isArray(ids)) ids = {};
  if (!Array.isArray(ids[order])) ids[order] = [];
  if (ids[order].indexOf(chapterId) === -1) ids[order].push(chapterId);
  write('chapterReadIds', ids);

  // Keep the existing Vol. 3 chapter-card read dots in sync with direct opens.
  if (customReadKey) {
    var customIds = read(customReadKey, []);
    if (!Array.isArray(customIds)) customIds = [];
    if (customIds.indexOf(chapterId) === -1) customIds.push(chapterId);
    write(customReadKey, customIds);
  }
})();
