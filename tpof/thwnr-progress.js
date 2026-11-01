(function () {
    var file = location.pathname.split('/').pop().toLowerCase();
    var match = file.match(/^thwnr([1-9])\.html$/);
    var chapter = match ? Number(match[1]) : (file === 'thwnre.html' ? 10 : 0);
    if (!chapter) return;

    function read(key, fallback) {
        try {
            var value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) { return fallback; }
    }
    function write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { }
    }

    // Opening a chapter records it automatically; readers no longer need
    // to press a separate button to keep their shelf progress current.
    var progress = read('readProgress', {});
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {};
    var previous = Number(progress[21]) || 0;
    var delta = Math.max(0, chapter - previous);
    if (delta) {
        progress[21] = chapter;
        write('readProgress', progress);
        var history = read('readingLog', {});
        if (!history || typeof history !== 'object' || Array.isArray(history)) history = {};
        var today = new Date().toISOString().slice(0, 10);
        history[today] = (Number(history[today]) || 0) + delta;
        write('readingLog', history);
        var hour = new Date().getHours();
        if (hour >= 23 || hour < 5) write('nightOwlRead', true);
    }
    write('currentlyReading', 21);
    var ids = read('chapterReadIds', {});
    if (!ids || typeof ids !== 'object' || Array.isArray(ids)) ids = {};
    if (!Array.isArray(ids[21])) ids[21] = [];
    var id = chapter === 10 ? 'epilogue' : 'ch' + chapter;
    if (!ids[21].includes(id)) ids[21].push(id);
    write('chapterReadIds', ids);

    var nextFiles = ['thwnr1.html', 'thwnr2.html', 'thwnr3.html', 'thwnr4.html', 'thwnr5.html', 'thwnr6.html', 'thwnr7.html', 'thwnr8.html', 'thwnr9.html', 'thwnre.html'];
    var footer = document.querySelector('.end');
    if (!footer) return;
    var actions = document.createElement('div');
    actions.className = 'thwnr-reader-actions';
    actions.innerHTML = chapter < 10
        ? '<a class="thwnr-next" href="' + nextFiles[chapter] + '">Next chapter →</a>'
        : '<a class="thwnr-next" href="thwnr.html">Back to all chapters →</a>';
    footer.appendChild(actions);

    var style = document.createElement('style');
    style.textContent = '.thwnr-reader-actions{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;max-width:680px;margin:24px auto 0;padding:0 20px}.thwnr-next{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:9px 16px;border:1px solid var(--accent);border-radius:999px;background:var(--card);color:var(--accent);font:600 .9rem "Space Grotesk",sans-serif;text-decoration:none;cursor:pointer;transition:transform .2s}.thwnr-next:hover{transform:translateY(-2px)}@media(max-width:520px){.thwnr-reader-actions,.thwnr-next{width:100%}}@media(prefers-reduced-motion:reduce){.thwnr-next{transition:none}}';
    document.head.appendChild(style);
})();
