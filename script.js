"use strict";
/* ============================================================
   UTILITIES

   SECURITY NOTE — user-generated content (private notes, search
   queries, private notes) is protected in two independent layers:
     1. sanitize() strips HTML tags on the way IN (before it's stored).
     2. esc() HTML-entity-escapes content on the way OUT (right before
        it's placed into innerHTML for rendering).
   Keep both. If either layer is ever removed, the other still prevents
   stored/reflected XSS, so never render user-supplied fields into
   innerHTML without passing them through esc() first.
   ============================================================ */
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;"); }
function imgFail(el) { el.style.display = 'none'; }
function sanitize(s) { return String(s).replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim(); }
var store = {
    get: function (k, fb) { try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
/* Every key this app writes to localStorage. Used only to let a reader
   wipe their own locally-stored data on request (see confirmClearLocalData
   below) — nothing here is ever transmitted anywhere. */
var APP_STORAGE_KEYS = [
    'readProgress', 'chapterReadIds', 'hahv2Read', 'bookmarks', 'currentlyReading', 'readingLog', 'readingQueue',
    'privateReaderNotes', 'novelComments', 'recentSearches', 'lightMode', 'theme', 'morphismStyle',
    'tiltEnabled', 'motionEnabled', 'readerFontScale', 'readerAchUnlocks', 'exclusiveScrollbarEnabled',
    'goldenPetalCaught', 'nightOwlRead', 'oneDayRead', 'searchedOnce', 'sharedOnce',
    'themeChanged', 'lastCommentAt', 'readerLevel', 'achievementsCollapsed', 'readerProfile', 'releaseReminders',
    'midnightMemoryWon', 'midnightMemoryBest', 'hiddenDiscoveries'
];
function confirmClearLocalData() {
    var ok = window.confirm('This permanently erases all saved reader data and preferences from this browser. This can\'t be undone. Continue?');
    if (!ok) return;
    APP_STORAGE_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
    showToast('Local data cleared ✦ Reloading…');
    setTimeout(function () { window.location.reload(); }, 700);
}
var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var motionEnabled = store.get('motionEnabled', !prefersReducedMotion);

var toastTimer;
function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = sanitize(msg);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
}
function shakeEl(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#ff7272';
    setTimeout(function () { el.style.borderColor = ''; el.focus(); }, 600);
}
function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function timeAgo(ts) {
    var d = Date.now() - ts, s = Math.floor(d / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 2592000) return Math.floor(s / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
    return String(n);
}

/* ============================================================
   NOVEL DATA
   ============================================================ */
/* novels array now lives in novels-data.js (loaded before this script in index.html) */
var storyWorlds = [
    { title: 'Him and Her', type: 'Three-volume series', note: 'Follow the relationship from the original story through Volumes 2 and 3.', order: [5, 10, 14] },
    { title: 'The Petal That Falls With a Smile', type: 'Prequel + four volumes', note: 'Begin with the vol 1, then continue to prequel and then Volumes 2–4.', order: [18, 3, 8, 11, 19] },
    { title: 'The Rain Pact', type: 'Main story + companion', note: 'Read The Rain Pact first, then visit The Other Side of Rain for its companion journey.', order: [1, 7] },
    { title: 'Ten Percent of Forever', type: 'Shared universe · Main story + companion', note: 'Read Ten Percent of Forever, then continue in the same universe with The Things We Never Returned.', order: [2, 21] },
    { title: 'Case File: You', type: 'Shared universe · Mystery series', note: 'Follow Case File: You into a new mystery in The Silence Between Rings.', order: [6, 23] }
];
var storySamples = [
    { id: 'rain', label: 'The Rain Pact', mood: 'Romance · Chapter One', title: 'Drizzle and Blue Umbrellas', excerpt: 'The first time Aoi met him, she didn’t even know his name. It was raining—of course it was. The kind of drizzle that crept in slowly, catching everyone off guard.', link: './rp/rpc1.html' },
    { id: 'him-her', label: 'Him and Her', mood: 'Romance · Chapter One', title: 'Her', excerpt: 'I am Kazuki. An average high schooler. Second year. I have always been… nobody. Not because people ignore me. Because I prefer it that way.', link: './hah/hah1.html' },
    { id: 'case-file', label: 'Case File: You', mood: 'Mystery · Chapter One', title: 'The Detective', excerpt: 'What a drag… The thought slipped through Sato Aizawa’s mind as he stood at the crime scene, hands in his coat pockets, eyes scanning the lifeless body before him.', link: './cfy/cfy1.html' },
    { id: 'petal', label: 'The Petal That Falls With a Smile', mood: 'Drama · Chapter One', title: 'Sakura in November', excerpt: 'The sakura tree wasn’t supposed to bloom in November. It stood there anyway—bare, crooked, and stubborn. Everyone walked past it, eyes glued to their phones, heads buried in winter scarves.', link: './tptfwas/tptfwas1.html' }
];
var badgeLabel = { romance: "Romance", drama: "Drama", slice: "Slice", sad: "Sad", mystery: "Mystery", action: "Action" };
function isOneShot(n) { return n.ch === 1 && n.status === 'completed'; }
var oneShotTotal = novels.filter(isOneShot).length;
function nowMs() { return Date.now(); }
function releaseDate(n) { return new Date(nowMs() - n.releaseOffsetDays * 86400000); }
function lastUpdate(n) { return new Date(nowMs() - (n.updatedDaysAgo != null ? n.updatedDaysAgo : n.releaseOffsetDays) * 86400000); }
function likes(n) { return Math.round(n.views * 0.11); }
function words(n) { return n.ch * 1850; }
function coverHtml(n, cls) {
    return '<div class="' + cls + '" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" loading="lazy" onerror="imgFail(this)"></div>';
}

/* ============================================================
   READING PROGRESS / STORAGE STATE
   ============================================================ */
var readProgress = store.get('readProgress', {});
var bookmarks = store.get('bookmarks', {});
var currentlyReadingOrder = store.get('currentlyReading', null);
var readingLog = store.get('readingLog', {});
var readerProfile = store.get('readerProfile', {});
if (!readerProfile || typeof readerProfile !== 'object' || Array.isArray(readerProfile)) readerProfile = {};

function getRead(n) { var v = readProgress[n.order]; return typeof v === 'number' ? Math.max(0, Math.min(v, n.ch)) : 0; }

function exclusiveScrollbarProgress() {
    var available = novels.filter(function (novel) {
        return novel.ch > 0 && String(novel.status).toLowerCase() !== 'upcoming';
    });
    var complete = available.filter(function (novel) { return getRead(novel) >= novel.ch; }).length;
    return { complete: complete, total: available.length, unlocked: available.length > 0 && complete === available.length };
}

function renderExclusiveScrollbarSetting() {
    var progress = exclusiveScrollbarProgress();
    var toggle = document.getElementById('exclusiveScrollbarToggle');
    var help = document.getElementById('exclusiveScrollbarProgress');
    var enabled = progress.unlocked && store.get('exclusiveScrollbarEnabled', false) === true;
    document.body.classList.toggle('exclusive-scrollbar', enabled);
    document.documentElement.classList.toggle('exclusive-scrollbar', enabled);
    document.documentElement.classList.toggle('light-scrollbar', document.body.classList.contains('light'));
    if (toggle) {
        toggle.disabled = !progress.unlocked;
        toggle.classList.toggle('on', enabled);
        toggle.setAttribute('aria-checked', String(enabled));
        toggle.setAttribute('aria-disabled', String(!progress.unlocked));
    }
    if (help) {
        help.textContent = progress.unlocked
            ? 'Unlocked · Apply the copper scrollbar across the site.'
            : 'Locked · ' + progress.complete + ' of ' + progress.total + ' released stories completed.';
    }
}

function toggleExclusiveScrollbar() {
    var progress = exclusiveScrollbarProgress();
    if (!progress.unlocked) return;
    var enabled = !store.get('exclusiveScrollbarEnabled', false);
    store.set('exclusiveScrollbarEnabled', enabled);
    renderExclusiveScrollbarSetting();
    showToast(enabled ? 'Exclusive scrollbar enabled.' : 'Exclusive scrollbar disabled.');
}

/* ============================================================
   AURORA / MOOD
   ============================================================ */
var moodColors = { all: ['#ff7d9c', '#a78bfa'] };
var auroraActive = 1;
function paintAurora(colors) {
    var next = auroraActive === 1 ? 2 : 1;
    var layer = document.getElementById('auroraLayer' + next);
    var prev = document.getElementById('auroraLayer' + auroraActive);
    layer.style.background =
        'radial-gradient(circle at 20% 25%, ' + colors[0] + ' 0%, transparent 45%),' +
        'radial-gradient(circle at 80% 20%, ' + colors[1] + ' 0%, transparent 40%),' +
        'radial-gradient(circle at 50% 80%, ' + colors[0] + ' 0%, transparent 50%)';
    layer.classList.add('on');
    prev.classList.remove('on');
    auroraActive = next;
}

/* ============================================================
   COLOR THEMES
   ============================================================ */
var themeAccents = {
    rose: ['#ff7d9c', '#a78bfa'],
    blue: ['#5b9dff', '#a78bfa'],
    red: ['#ff6b6b', '#ffc46b'],
    violet: ['#a78bfa', '#ff7d9c'],
    gold: ['#ffc46b', '#ff7d9c'],
    teal: ['#68d8c4', '#a78bfa'],
    emerald: ['#3ddc97', '#a78bfa'],
    cyan: ['#22d3ee', '#818cf8'],
};
function setTheme(theme) {
    if (!themeAccents[theme]) theme = 'rose';
    if (theme === 'rose') document.body.removeAttribute('data-theme');
    else document.body.setAttribute('data-theme', theme);
    store.set('theme', theme);
    document.querySelectorAll('.theme-swatch').forEach(function (s) {
        var active = s.dataset.theme === theme;
        s.classList.toggle('active', active);
        s.setAttribute('aria-checked', String(active));
    });
    moodColors.all = themeAccents[theme];
    paintAurora(themeAccents[theme]);
    showToast('Theme set to ' + theme.charAt(0).toUpperCase() + theme.slice(1) + ' ✦');
    markFlag('themeChanged');
}
function initTheme() {
    var saved = store.get('theme', 'rose');
    if (!themeAccents[saved]) saved = 'rose';
    if (saved !== 'rose') document.body.setAttribute('data-theme', saved);
    document.querySelectorAll('.theme-swatch').forEach(function (s) {
        var active = s.dataset.theme === saved;
        s.classList.toggle('active', active);
        s.setAttribute('aria-checked', String(active));
    });
    moodColors.all = themeAccents[saved];
}

var morphismStyles = ['neumorphism', 'glassmorphism', 'claymorphism'];
function setMorphismStyle(style, announce) {
    if (morphismStyles.indexOf(style) === -1) style = 'neumorphism';
    if (style === 'neumorphism') document.body.removeAttribute('data-morphism');
    else document.body.setAttribute('data-morphism', style);
    store.set('morphismStyle', style);
    document.querySelectorAll('.morphism-option').forEach(function (option) {
        var active = option.dataset.morphism === style;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', String(active));
    });
    if (announce !== false) showToast(style.charAt(0).toUpperCase() + style.slice(1) + ' enabled ✦');
}
function initMorphismStyle() {
    setMorphismStyle(store.get('morphismStyle', 'neumorphism'), false);
}

var catalogHoverGrid = document.getElementById("catalogGrid");
var supportsCardHover = window.matchMedia("(hover: hover)").matches;
if (catalogHoverGrid && supportsCardHover) {
    catalogHoverGrid.addEventListener("mouseover", function (e) {
        var card = e.target.closest(".novel-card");
        var previousCard = e.relatedTarget && e.relatedTarget.closest
            ? e.relatedTarget.closest(".novel-card") : null;
        if (!card || card === previousCard) return;

        var cards = Array.from(catalogHoverGrid.querySelectorAll(".novel-card"));
        var i = cards.indexOf(card);
        cards.forEach(function (item) {
            item.classList.remove("active-book", "neighbor-left", "neighbor-right", "far-left", "far-right");
        });
        card.classList.add("active-book");
        if (cards[i - 1]) cards[i - 1].classList.add("neighbor-left");
        if (cards[i + 1]) cards[i + 1].classList.add("neighbor-right");
        if (cards[i - 2]) cards[i - 2].classList.add("far-left");
        if (cards[i + 2]) cards[i + 2].classList.add("far-right");
    });

    catalogHoverGrid.addEventListener("mouseout", function (e) {
        var card = e.target.closest(".novel-card");
        var nextCard = e.relatedTarget && e.relatedTarget.closest
            ? e.relatedTarget.closest(".novel-card") : null;
        if (!card || card === nextCard) return;
        catalogHoverGrid.querySelectorAll(".novel-card").forEach(function (item) {
            item.classList.remove("active-book", "neighbor-left", "neighbor-right", "far-left", "far-right");
        });
    });
}


/* ============================================================
   HERO — TRENDING CAROUSEL / CONTINUE READING / AUTHOR CARD
   ============================================================ */
var heroFeaturedList = [];
var heroFeaturedIndex = 0;
var heroRotateTimer = null;

function renderHero() {
    var eligible = novels
        .filter(function (n) { return n.status !== 'upcoming' && n.ch > 0; })
        .slice()
        .sort(function (a, b) { return (Number(b.views) || 0) - (Number(a.views) || 0); });
    heroFeaturedList = eligible.slice(0, 3);
    var petalVolumeFour = eligible.find(function (n) { return n.order === 19; });
    if (petalVolumeFour && !heroFeaturedList.some(function (n) { return n.order === petalVolumeFour.order; })) {
        heroFeaturedList = heroFeaturedList.slice(0, 2).concat(petalVolumeFour);
    }
    if (!heroFeaturedList.length) return;

    heroFeaturedIndex = 0;
    paintHeroFeature(0, false);
    buildHeroDots();
    startHeroRotate();

    var wrap = document.getElementById('heroFeature');
    if (wrap && !wrap.dataset.hoverBound) {
        wrap.addEventListener('mouseenter', function () { clearInterval(heroRotateTimer); });
        wrap.addEventListener('mouseleave', function () { startHeroRotate(); });
        wrap.dataset.hoverBound = '1';
    }

    refreshReadingUI();
}
function paintHeroFeature(i, animate) {
    var n = heroFeaturedList[i];
    if (!n) return;
    var imgEl = document.getElementById('heroFeatureImg');
    if (animate) {
        imgEl.style.opacity = '0';
        setTimeout(function () { imgEl.src = n.img; imgEl.style.opacity = '.66'; }, 260);
    } else {
        imgEl.src = n.img;
    }
    var vol = (n.title.match(/Vol\.?\s*(\d+)/i) || [])[1];
    var textEl = document.getElementById('heroFeatureText');
    textEl.innerHTML =
        '<span class="trend-badge">FEATURED STORY' + (vol ? ' · VOL. ' + vol : '') + '</span>' +
        '<h1 class="hero-feature-title">' + esc(n.title.trim()) + '</h1>' +
        '<p class="hero-feature-desc">' + esc(n.blurb) + '</p>' +
        '<div class="hero-meta-row"><span>' + (n.rating ? ('⭐ ' + n.rating + ' rating') : '⭐ New') + '</span>' +
        '<span>👁 ' + fmtNum(n.views) + ' readers</span>' +
        '<span>📖 ' + n.ch + ' chapter' + (n.ch === 1 ? '' : 's') + '</span>' +
        '<span style="color: var(--rose)">' + (n.status === 'ongoing' ? 'Ongoing' : 'Completed') + '</span></div>';
    if (animate) { textEl.classList.remove('hero-fade'); void textEl.offsetWidth; textEl.classList.add('hero-fade'); }

    var startBtn = document.getElementById('heroStartBtn');
    if (startBtn) startBtn.onclick = function () { openSpotlight(n.order); };

    document.querySelectorAll('.hero-trend-dot').forEach(function (d, di) { d.classList.toggle('active', di === i); });
}
function buildHeroDots() {
    var wrap = document.getElementById('heroTrendDots');
    if (!wrap) return;
    wrap.innerHTML = heroFeaturedList.map(function (n, i) {
        return '<button class="hero-trend-dot' + (i === 0 ? ' active' : '') + '" aria-label="Show ' + esc(n.title.trim()) + '" onclick="jumpHeroFeature(' + i + ')"></button>';
    }).join('');
}
function jumpHeroFeature(i) {
    heroFeaturedIndex = i;
    paintHeroFeature(i, true);
    startHeroRotate();
}
function advanceHeroFeature() {
    heroFeaturedIndex = (heroFeaturedIndex + 1) % heroFeaturedList.length;
    paintHeroFeature(heroFeaturedIndex, true);
}
function startHeroRotate() {
    clearInterval(heroRotateTimer);
    heroRotateTimer = null;
    if (motionEnabled && !document.hidden && heroFeaturedList.length > 1) {
        heroRotateTimer = setInterval(advanceHeroFeature, 6000);
    }
}
/* ============================================================
   READING STREAK
   ============================================================ */
function dateKey(d) { return d.toISOString().slice(0, 10); }
function computeStreak() {
    var d = new Date();
    if (!readingLog[dateKey(d)]) d.setDate(d.getDate() - 1); // streak isn't broken until a day passes with no read
    var count = 0;
    while (readingLog[dateKey(d)]) { count++; d.setDate(d.getDate() - 1); }
    return count;
}
function computeBestStreak() {
    var keys = Object.keys(readingLog).filter(function (k) { return readingLog[k] > 0; }).sort();
    if (!keys.length) return 0;
    var best = 1, run = 1;
    for (var i = 1; i < keys.length; i++) {
        var diffDays = Math.round((new Date(keys[i]) - new Date(keys[i - 1])) / 86400000);
        run = diffDays === 1 ? run + 1 : 1;
        if (run > best) best = run;
    }
    return best;
}
function renderReaderStreak() {
    var streak = computeStreak(), best = computeBestStreak();
    var chip = document.getElementById('readerStreakChip');
    if (chip) {
        chip.innerHTML = '🔥 ' + streak + '-day streak';
        chip.title = 'Best streak: ' + best + (best === 1 ? ' day' : ' days');
    }
    var note = document.getElementById('heatmapStreakNote');
    if (note) {
        note.textContent = (streak > 0 ? streak + '-day streak' : 'No active streak') +
            ' · best ' + best + (best === 1 ? ' day' : ' days');
    }
}

/* ============================================================
   READING HISTORY + PORTABLE LOCAL BACKUP
   ============================================================ */
function renderReadingHistory() {
    var list = document.getElementById('readingHistoryList');
    if (!list) return;
    var dates = Object.keys(readingLog).filter(function (key) { return Number(readingLog[key]) > 0; }).sort().reverse().slice(0, 7);
    if (!dates.length) {
        list.innerHTML = '<div class="history-empty">Your logged reading days will appear here.</div>';
        return;
    }
    list.innerHTML = dates.map(function (key) {
        var date = new Date(key + 'T12:00:00');
        var label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        var count = Number(readingLog[key]) || 0;
        return '<div class="history-row"><span>' + esc(label) + '</span><strong>' + count + ' ' + (count === 1 ? 'chapter' : 'chapters') + '</strong></div>';
    }).join('');
}
function renderStoryCompareOptions() {
    var first = document.getElementById('storyCompareFirst');
    var second = document.getElementById('storyCompareSecond');
    if (!first || !second) return;
    var options = novels.map(function (novel) {
        return '<option value="' + novel.order + '">' + esc(novel.title.trim()) + '</option>';
    }).join('');
    first.innerHTML = options;
    second.innerHTML = options;
    if (novels.length > 1) second.value = String(novels[1].order);
}

function compareStories() {
    var firstSelect = document.getElementById('storyCompareFirst');
    var secondSelect = document.getElementById('storyCompareSecond');
    var result = document.getElementById('storyCompareResult');
    if (!firstSelect || !secondSelect || !result) return;
    var firstNovel = novels.find(function (novel) { return novel.order === Number(firstSelect.value); });
    var secondNovel = novels.find(function (novel) { return novel.order === Number(secondSelect.value); });
    if (!firstNovel || !secondNovel) {
        result.textContent = 'Choose two stories to compare.';
        return;
    }
    if (firstNovel.order === secondNovel.order) {
        result.textContent = 'Choose two different stories to compare.';
        return;
    }
    function statusLabel(novel) {
        var status = String(novel.status || 'unknown');
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    function chapterLabel(novel) {
        if (!novel.ch) return 'Not released yet';
        return novel.ch + (novel.ch === 1 ? ' chapter' : ' chapters');
    }
    function storyCard(novel) {
        var genres = novel.genres.map(function (genre) { return badgeLabel[genre] || genre; }).join(' · ');
        var rating = novel.rating ? '★ ' + novel.rating : 'Not rated yet';
        var views = novel.views ? fmtNum(novel.views) + ' readers' : 'New story';
        return '<article class="story-compare-card"><div class="story-compare-cover" style="background:linear-gradient(' + esc(novel.grad) + ')"><img src="' + esc(novel.img) + '" alt="" loading="lazy" onerror="imgFail(this)"></div><div class="story-compare-copy"><span class="story-compare-genres">' + esc(genres) + '</span><h3>' + esc(novel.title.trim()) + '</h3><p>' + esc(novel.blurb) + '</p><dl><div><dt>Status</dt><dd>' + esc(statusLabel(novel)) + '</dd></div><div><dt>Chapters</dt><dd>' + esc(chapterLabel(novel)) + '</dd></div><div><dt>Rating</dt><dd>' + esc(rating) + '</dd></div><div><dt>Readers</dt><dd>' + esc(views) + '</dd></div></dl><button type="button" class="pill-btn" onclick="openSpotlight(' + novel.order + ')">View story →</button></div></article>';
    }
    result.innerHTML = '<div class="story-compare-pair">' + storyCard(firstNovel) + '<span class="story-compare-divider" aria-hidden="true">VS</span>' + storyCard(secondNovel) + '</div>';
}

function renderStoryWorlds() {
    var grid = document.getElementById('storyWorldGrid');
    if (!grid) return;
    grid.innerHTML = storyWorlds.map(function (world) {
        var entries = world.order.map(function (order) { return novels.find(function (novel) { return novel.order === order; }); }).filter(Boolean);
        var released = entries.filter(function (novel) { return novel.ch > 0; });
        var totalChapters = released.reduce(function (total, novel) { return total + novel.ch; }, 0);
        var readChapters = released.reduce(function (total, novel) { return total + getRead(novel); }, 0);
        var progress = totalChapters ? Math.round(readChapters / totalChapters * 100) : 0;
        var next = entries.find(function (novel) { return novel.status.toLowerCase() === 'upcoming' || getRead(novel) < novel.ch; }) || entries[0];
        var storyRows = entries.map(function (novel, step) {
            var upcoming = novel.status.toLowerCase() === 'upcoming';
            var read = getRead(novel);
            var percent = novel.ch ? Math.round(read / novel.ch * 100) : 0;
            var label = upcoming ? 'Coming soon' : (read >= novel.ch ? 'Finished' : (read ? read + ' / ' + novel.ch + ' chapters' : 'Not started'));
            return '<button class="world-story-row" type="button" onclick="openSpotlight(' + novel.order + ')" aria-label="Open ' + esc(novel.title.trim()) + '"><span class="world-step">' + (step + 1) + '</span><span class="world-story-copy"><strong>' + esc(novel.title.trim()) + '</strong><small>' + label + '</small>' + (novel.ch ? '<span class="world-story-track"><i style="width:' + percent + '%"></i></span>' : '') + '</span><span class="world-story-arrow" aria-hidden="true">→</span></button>';
        }).join('');
        var nextLabel = next.status.toLowerCase() === 'upcoming' ? 'View upcoming volume' : 'Continue this story world';
        return '<article class="story-world-card"><div class="world-card-head"><div><span class="reader-tool-kicker">' + esc(world.type) + '</span><h3>' + esc(world.title) + '</h3></div><span class="world-progress-ring" aria-label="' + progress + ' percent complete">' + progress + '%</span></div><p class="world-card-note">' + esc(world.note) + '</p><div class="world-overall-track" role="progressbar" aria-label="' + esc(world.title) + ' series progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '"><i style="width:' + progress + '%"></i></div><p class="world-progress-label">' + readChapters + ' of ' + totalChapters + ' released chapters logged</p><div class="world-story-list">' + storyRows + '</div><button class="sketch-btn sketch-btn-primary world-next-button" type="button" onclick="openSpotlight(' + next.order + ')">' + nextLabel + ' →</button></article>';
    }).join('');
    hideSkeleton('storyWorldSkeleton');
}
function selectStorySample(id) {
    var sample = storySamples.find(function (entry) { return entry.id === id; }) || storySamples[0];
    document.querySelectorAll('.sampler-choice').forEach(function (button) {
        var active = button.dataset.sample === sample.id;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('samplerGenre').textContent = sample.mood;
    document.getElementById('samplerStoryTitle').textContent = sample.label;
    document.getElementById('samplerChapterTitle').textContent = sample.title;
    document.getElementById('samplerExcerpt').textContent = '“' + sample.excerpt + '”';
    var link = document.getElementById('samplerOpenLink');
    link.href = sample.link;
    link.setAttribute('aria-label', 'Read chapter one of ' + sample.label);
}
function renderStorySampler() {
    var choices = document.getElementById('samplerChoices');
    if (!choices) return;
    choices.innerHTML = storySamples.map(function (sample, index) {
        return '<button class="sampler-choice' + (index === 0 ? ' active' : '') + '" type="button" data-sample="' + esc(sample.id) + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '" onclick="selectStorySample(\'' + esc(sample.id) + '\')"><span>' + esc(sample.label) + '</span><small>' + esc(sample.mood.split(' · ')[0]) + '</small></button>';
    }).join('');
    selectStorySample(storySamples[0].id);
}

function exportReaderData() {
    var data = {};
    APP_STORAGE_KEYS.forEach(function (key) {
        try { var value = localStorage.getItem(key); if (value !== null) data[key] = JSON.parse(value); } catch (e) { }
    });
    var payload = JSON.stringify({ format: 'aka-reader-backup', version: 1, exportedAt: new Date().toISOString(), data: data }, null, 2);
    var url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'aka-reader-backup-' + dateKey(new Date()) + '.json';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Reader backup downloaded ✦');
}
function importReaderData(input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    input.value = '';
    if (file.size > 1024 * 1024) { showToast('That backup file is too large.'); return; }
    var reader = new FileReader();
    reader.onload = function () {
        var backup;
        try { backup = JSON.parse(String(reader.result)); } catch (e) { showToast('This file is not valid JSON.'); return; }
        if (!backup || backup.format !== 'aka-reader-backup' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
            showToast('This is not a supported AKA reader backup.'); return;
        }
        var allowed = APP_STORAGE_KEYS.filter(function (key) { return Object.prototype.hasOwnProperty.call(backup.data, key); });
        if (!allowed.length) { showToast('No recognized reader data was found in this backup.'); return; }
        if (!window.confirm('Restore ' + allowed.length + ' saved reader data items? This replaces matching data in this browser and reloads the page.')) return;
        try {
            allowed.forEach(function (key) { localStorage.setItem(key, JSON.stringify(backup.data[key])); });
        } catch (e) { showToast('Could not restore the backup. Check available browser storage.'); return; }
        showToast('Reader data restored · Reloading…');
        setTimeout(function () { window.location.reload(); }, 700);
    };
    reader.onerror = function () { showToast('Could not read that backup file.'); };
    reader.readAsText(file);
}

function refreshReadingUI() {
    renderContinueReading();
    renderPersonalShelf();
    renderExclusiveScrollbarSetting();
    renderReaderLevel();
    renderReaderAchievements();
    renderCatalog();
    renderHeatmap();
    renderReaderStreak();
    renderReadingHistory();
    renderStoryWorlds();
    renderForYouPicks();
}
window.addEventListener('storage', function (event) {
    if (event.key !== 'readProgress' && event.key !== 'currentlyReading' && event.key !== 'readingLog' && event.key !== 'nightOwlRead') return;
    readProgress = store.get('readProgress', {});
    currentlyReadingOrder = store.get('currentlyReading', null);
    readingLog = store.get('readingLog', {});
    refreshReadingUI();
});
function personalMiniCard(n, label, actionText) {
    if (!n) return '<div class="personal-empty"><span class="personal-empty-icon">✦</span><strong>Nothing here yet</strong><span>Choose a story from the Shelf to start building this space.</span></div>';
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    return '<div class="personal-card-label">' + label + '</div><div class="personal-story-row"><div class="personal-cover" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" onerror="imgFail(this)"></div><div class="personal-story-info"><h3>' + esc(n.title) + '</h3><div class="personal-story-meta">' + (n.status === 'upcoming' ? 'Coming soon' : read + ' / ' + n.ch + ' chapters') + '</div>' + (n.ch ? '<div class="personal-progress"><span style="width:' + pct + '%"></span></div>' : '') + '</div></div><button class="pill-btn personal-card-action" onclick="openReaderMode(' + n.order + ')">' + actionText + ' →</button>';
}
function renderPersonalShelf() {
    var current = currentlyReadingOrder && novels.find(function (n) { return n.order === currentlyReadingOrder; });
    var favorites = novels.filter(function (n) { return bookmarks[n.order] && n.status !== 'upcoming'; }).sort(function (a, b) { return b.order - a.order; })[0];
    var finished = novels.filter(function (n) { return n.ch > 0 && getRead(n) >= n.ch; }).sort(function (a, b) { return b.order - a.order; })[0];
    var currentEl = document.getElementById('personalCurrentCard');
    var favoriteEl = document.getElementById('personalFavoritesCard');
    var finishedEl = document.getElementById('personalFinishedCard');
    if (!currentEl || !favoriteEl || !finishedEl) return;
    currentEl.innerHTML = personalMiniCard(current, 'Currently reading', current ? 'Continue' : 'Choose a story');
    favoriteEl.innerHTML = personalMiniCard(favorites, 'A favorite from your shelf', favorites ? 'Open favorite' : 'Add a favorite');
    finishedEl.innerHTML = personalMiniCard(finished, 'Recently finished', finished ? 'Revisit' : 'Finish your first story');
    // Skeletons are replaced by innerHTML above
}
function renderContinueReading() {
    var body = document.getElementById('crBody');
    var n = currentlyReadingOrder && novels.find(function (x) { return x.order === currentlyReadingOrder; });
    if (!n) { body.innerHTML = '<div class="cr-empty"><strong>Your next story starts here.</strong><span>Choose something that fits the moment.</span><button class="cr-btn" type="button" onclick="scrollToId(\'catalog\')">Explore the library →</button></div>'; return; }
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    body.innerHTML =
        '<div class="cr-thumb-row"><div class="cr-thumb">' + coverHtml(n, '').replace('<div class=""', '<div style="width:100%;height:100%"') + '</div>' +
        '<div class="cr-info"><div class="cr-title">' + esc(n.title) + '</div>' +
        '<div class="cr-bar"><div class="cr-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="cr-sub">' + read + ' / ' + n.ch + ' chapters · ' + pct + '%</div></div></div>' +
        '<button class="cr-btn" id="crContinueBtn">Continue Reading →</button>';
    document.getElementById('crContinueBtn').onclick = function () { window.location.href = n.link; };
}

/* ============================================================
   STATS STRIP
   ============================================================ */
function computeLibraryStats() {
    var released = novels.filter(function (n) { return n.status !== 'upcoming'; });
    var totalCh = released.reduce(function (a, n) { return a + n.ch; }, 0);
    var totalWords = released.reduce(function (a, n) { return a + words(n); }, 0);
    var totalViews = released.reduce(function (a, n) { return a + n.views; }, 0);
    var avgRating = released.reduce(function (a, n) { return a + n.rating; }, 0) / released.length;
    var ongoing = novels.filter(function (n) { return n.status === 'ongoing'; }).length;
    return { novels: novels.length, chapters: totalCh, words: totalWords, views: totalViews, avgRating: avgRating.toFixed(1), ongoing: ongoing };
}
function animateCount(el, target, isFloat, suffix) {
    var start = 0, dur = 1200, t0 = null;
    function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var val = start + (target - start) * (1 - Math.pow(1 - p, 3));
        el.textContent = (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + (suffix || '');
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
function renderStats() {
    var s = computeLibraryStats();
    var tiles = [
        { label: 'Titles', val: s.novels, suffix: '' },
        { label: 'Chapters', val: s.chapters, suffix: '+' },
        { label: 'Words Written', val: Math.round(s.words / 1000), suffix: 'k' },
        { label: 'Total Views', val: Math.round(s.views / 1000), suffix: 'k' },
        { label: 'Avg Rating', val: s.avgRating, suffix: '', isFloat: true },
        { label: 'Ongoing Now', val: s.ongoing, suffix: '' }
    ];
    var grid = document.getElementById('statsGrid');
    grid.innerHTML = tiles.map(function (t, i) {
        return '<div class="glass stat-tile" data-target="' + t.val + '" data-suffix="' + t.suffix + '" data-float="' + (!!t.isFloat) + '">' +
            '<div class="stat-num" id="statNum' + i + '">0</div><div class="stat-label">' + esc(t.label) + '</div></div>';
    }).join('');
    hideSkeleton('statsSkeleton');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) {
                var idx = Array.prototype.indexOf.call(grid.children, en.target);
                var t = tiles[idx];
                animateCount(document.getElementById('statNum' + idx), t.val, t.isFloat, t.suffix);
                io.unobserve(en.target);
            }
        });
    }, { threshold: .4 });
    Array.prototype.forEach.call(grid.children, function (c) { io.observe(c); });
}

/* ============================================================
   STORY MATCH — 3.8 DISCOVERY FEATURE
   ============================================================ */
var lastStoryMatchOrder = null;
function runStoryMatch() {
    var moodEl = document.getElementById('storyMatchMood');
    var timeEl = document.getElementById('storyMatchTime');
    var result = document.getElementById('storyMatchResult');
    if (!moodEl || !timeEl || !result) return;
    var mood = moodEl.value;
    var maxMinutes = Number(timeEl.value);
    var genres = { romance: ['romance'], sad: ['sad', 'drama'], mystery: ['mystery', 'action'], slice: ['slice'] };
    var candidates = novels.filter(function (n) {
        return n.status !== 'upcoming' && n.ch > 0 && (!genres[mood] || genres[mood].some(function (g) { return n.genres.indexOf(g) > -1; }));
    }).map(function (n) {
        var remaining = Math.max(1, n.ch - getRead(n));
        return { novel: n, minutes: Math.max(6, Math.round(remaining * 7)) };
    });
    if (!candidates.length) {
        result.textContent = 'No stories match those choices yet. Try another mood.';
        return;
    }
    var fits = maxMinutes ? candidates.filter(function (x) { return x.minutes <= maxMinutes; }) : candidates.slice();
    var pool = fits.length ? fits : candidates.slice().sort(function (a, b) { return a.minutes - b.minutes; }).slice(0, 1);
    if (pool.length > 1 && lastStoryMatchOrder !== null) {
        var fresh = pool.filter(function (x) { return x.novel.order !== lastStoryMatchOrder; });
        if (fresh.length) pool = fresh;
    }
    var pick = pool[Math.floor(Math.random() * pool.length)];
    lastStoryMatchOrder = pick.novel.order;
    var n = pick.novel;
    var fitLabel = fits.length ? 'A good fit for your time' : 'Closest match to your time';
    result.innerHTML = '<div class="story-match-cover" style="background:linear-gradient(' + n.grad + ')"><img src="' + esc(n.img) + '" alt="" onerror="imgFail(this)"></div>' +
        '<div class="story-match-copy"><span class="story-match-fit">' + fitLabel + ' · about ' + pick.minutes + ' min</span><strong>' + esc(n.title) + '</strong><span>' + esc(n.blurb) + '</span></div>' +
        '<button class="pill-btn" type="button" onclick="openSpotlight(' + n.order + ')">View story →</button>';
}

/* ============================================================
   FOR YOU — PRIVATE, EXPLAINABLE BETA RECOMMENDATIONS
   ============================================================ */
function renderForYouPicks() {
    var grid = document.getElementById('forYouGrid');
    if (!grid) return;
    var affinity = {};
    novels.forEach(function (n) {
        var read = getRead(n);
        var weight = Math.min(read, 8) + (bookmarks[n.order] ? 3 : 0) + (currentlyReadingOrder === n.order ? 2 : 0);
        if (!weight) return;
        n.genres.forEach(function (genre) { affinity[genre] = (affinity[genre] || 0) + weight; });
    });
    var hasHistory = Object.keys(affinity).length > 0;
    var scored = novels.filter(function (n) {
        return n.status.toLowerCase() !== 'upcoming' && n.ch > 0 && getRead(n) < n.ch;
    }).map(function (n) {
        var read = getRead(n);
        var genreScore = n.genres.reduce(function (sum, genre) { return sum + (affinity[genre] || 0); }, 0);
        var isCurrent = currentlyReadingOrder === n.order;
        var score = (hasHistory ? genreScore : (Number(n.rating) || 0)) + (isCurrent ? 5 : 0) + (read ? 2 : 0);
        var reason = isCurrent ? 'Pick up where you left off' : read ? 'Continue a story you started' : hasHistory && genreScore ? 'Matches genres you read and save' : 'A reader favorite to get you started';
        return { novel: n, score: score, reason: reason };
    }).sort(function (a, b) { return b.score - a.score || a.novel.order - b.novel.order; }).slice(0, 3);
    if (!scored.length) {
        grid.innerHTML = '<p class="for-you-empty">You have finished every available story. New releases will show up here when they arrive.</p>';
        hideSkeleton('forYouSkeleton');
        return;
    }
    grid.innerHTML = scored.map(function (pick, index) {
        var n = pick.novel;
        var read = getRead(n);
        var progress = n.ch ? Math.round(read / n.ch * 100) : 0;
        return '<article class="for-you-card"><span class="for-you-rank">0' + (index + 1) + '</span><div class="for-you-cover" style="background:linear-gradient(' + esc(n.grad) + ')"><img src="' + esc(n.img) + '" alt="" loading="lazy" onerror="imgFail(this)"></div><div class="for-you-copy"><span class="for-you-reason">' + esc(pick.reason) + '</span><strong>' + esc(n.title.trim()) + '</strong><span class="for-you-meta">' + (read ? read + ' of ' + n.ch + ' chapters · ' + progress + '% complete' : esc(n.genres.join(' · '))) + '</span><button class="pill-btn" type="button" onclick="openSpotlight(' + n.order + ')">' + (read ? 'Continue reading' : 'Explore story') + ' →</button></div></article>';
    }).join('');
    hideSkeleton('forYouSkeleton');
}

/* ============================================================
   CATALOG (THE SHELF)
   ============================================================ */
var activeGenre = 'all', activeStatus = 'all', catalogRenderTimer = null;
function scheduleCatalogRender() {
    clearTimeout(catalogRenderTimer);
    catalogRenderTimer = setTimeout(function () { catalogRenderTimer = null; renderCatalog(); }, 70);
}
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('genrePills').addEventListener('click', function (e) {
        var btn = e.target.closest('.pill-btn'); if (!btn) return;
        this.querySelectorAll('.pill-btn').forEach(function (b) {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-pressed', String(b === btn));
        });
        activeGenre = btn.dataset.genre || 'all';
        renderCatalog();
    });
    document.getElementById('statusPills').addEventListener('click', function (e) {
        var btn = e.target.closest('.pill-btn'); if (!btn) return;
        this.querySelectorAll('.pill-btn').forEach(function (b) {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-pressed', String(b === btn));
        });
        activeStatus = btn.dataset.status || 'all'; renderCatalog();
    });
});
function clearShelfFilters() {
    activeGenre = 'all';
    activeStatus = 'all';
    document.querySelectorAll('#genrePills .pill-btn').forEach(function (p) {
        var active = p.dataset.genre === 'all';
        p.classList.toggle('active', active);
        p.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('#statusPills .pill-btn').forEach(function (p) {
        var active = p.dataset.status === 'all';
        p.classList.toggle('active', active);
        p.setAttribute('aria-pressed', String(active));
    });
    scheduleCatalogRender();
    showToast('Shelf filters cleared ✦');
}
function hideSkeleton(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function renderCatalog() {
    var grid = document.getElementById('catalogGrid');
    var filtered = novels.filter(function (n) {
        var matchesGenre = activeGenre === 'all' || n.genres.indexOf(activeGenre) > -1;
        var matchesStatus = activeStatus === 'all' || (activeStatus === 'unread'
            ? n.status !== 'upcoming' && getRead(n) === 0
            : n.status === activeStatus);
        return matchesGenre && matchesStatus;
    }).sort(function (a, b) { return b.order - a.order; });
    document.getElementById('shelfCount').textContent = filtered.length + ' stor' + (filtered.length === 1 ? 'y' : 'ies') + ', filed and ready to open.';
    var summaryEl = document.getElementById('catalogFilterSummary');
    if (summaryEl) {
        var summary = [];
        if (activeGenre !== 'all') summary.push(badgeLabel[activeGenre] || activeGenre);
        if (activeStatus !== 'all') summary.push(activeStatus === 'unread' ? 'Unread' : activeStatus);
        summaryEl.textContent = summary.length ? summary.join(' · ') : 'Showing everything';
    }
    var clearBtn = document.getElementById('clearShelfBtn');
    if (clearBtn) clearBtn.disabled = activeGenre === 'all' && activeStatus === 'all';
    grid.innerHTML = filtered.map(function (n, i) {
        var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
        var statusCls = n.status === 'ongoing' ? 'status-ongoing' : n.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
        var isLiked = !!bookmarks[n.order];
        return '<article class="novel-card" style="animation-delay:' + (i * 0.03) + 's">' +
            '<button type="button" class="novel-card-open" onclick="openSpotlight(' + n.order + ')" aria-label="View details for ' + esc(n.title) + '"></button>' +
            '<div class="nc-cover">' + coverHtml(n, 'nc-image-wrap') +
            '<div class="nc-grad"></div>' +
            '<span class="nc-status ' + statusCls + '">' + n.status + '</span>' +
            '<div class="nc-quickrow">' +
            '<button type="button" class="nc-qbtn' + (isLiked ? ' liked' : '') + '" onclick="toggleLikeNovel(' + n.order + ')" aria-label="' + (isLiked ? 'Remove from favorites' : 'Add to favorites') + '" aria-pressed="' + isLiked + '">' + (isLiked ? '♥' : '♡') + '</button>' +
            '<button type="button" class="nc-qbtn" onclick="shareNovelQuick(' + n.order + ')" aria-label="Share ' + esc(n.title) + '">↗</button>' +
            '</div>' +
            '</div>' +
            '<div class="nc-body"><div class="nc-genres">' + n.genres.slice(0, 3).map(function (g) { return '<span class="nc-tag">' + badgeLabel[g] + '</span>'; }).join('') + '</div>' +
            '<div class="nc-title">' + esc(n.title) + '</div>' +
            '<div class="nc-meta"><span>' + (n.rating ? ('⭐ ' + n.rating) : '—') + '</span><span>👁 ' + fmtNum(n.views) + '</span><span>📖 ' + (n.ch || '0') + ' ch</span></div>' +
            (n.ch ? '<div class="nc-progress"><div class="nc-progress-fill" style="width:' + pct + '%"></div></div><div class="nc-progress-label">' + read + ' / ' + n.ch + ' read</div>' : '<div class="nc-progress-label">Releasing soon</div>') +
            '</div></article>';
    }).join('');
    hideSkeleton('catalogSkeleton');
}
function toggleLikeNovel(order) {
    bookmarks[order] = !bookmarks[order];
    store.set('bookmarks', bookmarks);
    showToast(bookmarks[order] ? 'Added to your favorites ♥' : 'Removed from favorites');
    refreshReadingUI();
}
function shareNovelQuick(order) {
    var n = novels.find(function (x) { return x.order === order; });
    var url = window.location.href.split('#')[0] + (n.link || '');
    if (navigator.clipboard) { navigator.clipboard.writeText(url).catch(function () { }); }
    showToast('Link copied for "' + n.title + '" ↗');
    markFlag('sharedOnce');
}

/* ============================================================
   SPOTLIGHT PANEL
   ============================================================ */
var spotlightOrder = null;
var readerModeOrder = null;
var readerModeChapter = 1;
var readerFontScale = store.get('readerFontScale', 1);
function openSpotlight(order) {
    var n = novels.find(function (x) { return x.order === order; });
    if (!n) return;
    spotlightOrder = order;
    var bg = document.getElementById('spCoverBg');
    bg.style.background = 'linear-gradient(' + n.grad + ')';
    bg.innerHTML = '<img src="' + esc(n.img) + '" style="width:100%;height:100%;object-fit:cover;opacity:.85" onerror="imgFail(this)">';
    var statusCls = n.status === 'ongoing' ? 'status-ongoing' : n.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
    document.getElementById('spStatusRow').innerHTML = n.genres.map(function (g) { return '<span class="nc-tag" style="color:var(--ink);border-color:var(--panel-border-strong)">' + badgeLabel[g] + '</span>'; }).join('') +
        '<span class="nc-tag ' + statusCls + '" style="border:none">' + n.status + '</span>';
    document.getElementById('spTitle').textContent = n.title;
    document.getElementById('spByline').textContent = 'A Novel by AKA · ⭐ ' + (n.rating || '—') + ' · 👁 ' + fmtNum(n.views);
    document.getElementById('spDesc').textContent = n.blurb;
    var read = getRead(n), pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    document.getElementById('spFill').style.width = pct + '%';
    document.getElementById('spChRead').textContent = read + ' / ' + n.ch + ' chapters read';
    var chList = document.getElementById('spChapterList');
    var html = '';
    var isSingleChapter = n.ch === 1;
    for (var i = 1; i <= n.ch; i++) {
        var isRead = i <= read;
        var cName = n.chapterLabels && n.chapterLabels[i - 1] ? n.chapterLabels[i - 1] : (isSingleChapter ? 'One Shot' : 'Chapter ' + i);
        var cLink = n.chapterLinks && n.chapterLinks[i - 1] ? n.chapterLinks[i - 1] : (n.link || '#');
        html += '<a class="sp-ch-item" href="' + esc(cLink) + '"><div class="sp-ch-num' + (isRead ? ' read' : '') + '">' + (isRead ? '✓' : i) + '</div><span style="flex:1">' + esc(cName) + '</span>' +
            (isRead ? '<span style="font-size:10px;color:var(--sage)">Read</span>' : '<span style="font-size:10px;color:var(--muted)">→</span>') + '</a>';
    }
    if (n.ch === 0) html = '<div style="text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--muted);padding:10px">Chapters land here on release day.</div>';
    chList.innerHTML = html;
    var bbtn = document.getElementById('spBookmarkBtn');
    if (currentlyReadingOrder === order) { bbtn.textContent = '✓ Currently Reading'; bbtn.classList.add('active'); }
    else { bbtn.textContent = '🔖 Set as Currently Reading'; bbtn.classList.remove('active'); }
    document.getElementById('spReadBtn').textContent = (read > 0 && read < n.ch) ? 'Continue Reading →' : 'Start Reading →';
    document.getElementById('spotlightOverlay').classList.add('open');
    document.getElementById('spotlightPanel').classList.add('open');
}
function closeSpotlight() {
    document.getElementById('spotlightOverlay').classList.remove('open');
    document.getElementById('spotlightPanel').classList.remove('open');
    spotlightOrder = null;
}
function goToNovel() {
    var n = novels.find(function (x) { return x.order === spotlightOrder; });
    if (n) openReaderMode(n.order);
}
function openReaderMode(order) {
    var n = novels.find(function (x) { return x.order === order; });
    if (!n) return;
    readerModeOrder = order;
    readerModeChapter = n.ch ? (getRead(n) >= n.ch ? n.ch : Math.max(1, getRead(n) + 1)) : 1;
    closeSpotlight();
    updateReaderMode();
    document.getElementById('readerModeOverlay').classList.add('open');
    document.getElementById('readerModePanel').classList.add('open');
    document.body.classList.add('reader-mode-active');
}
function updateReaderMode() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n) return;
    var total = n.ch || 1;
    var read = getRead(n);
    var pct = n.ch ? Math.round(read / n.ch * 100) : 0;
    document.getElementById('readerModeTitle').textContent = n.title;
    document.getElementById('readerModeByline').textContent = 'A Novel by AKA · ' + (n.status === 'ongoing' ? 'Ongoing' : 'Completed');
    document.getElementById('readerModeIntro').textContent = n.blurb;
    document.getElementById('readerModeProgressLabel').textContent = 'Chapter ' + readerModeChapter + ' of ' + total;
    document.getElementById('readerModeProgressPct').textContent = pct + '%';
    document.getElementById('readerModeProgressFill').style.width = pct + '%';
    var readerChapterLabel = n.chapterLabels && n.chapterLabels[readerModeChapter - 1] ? n.chapterLabels[readerModeChapter - 1] : 'Chapter ' + readerModeChapter;
    document.getElementById('readerModeChapterText').textContent = n.ch ? readerChapterLabel : 'Coming on release day';
    document.getElementById('readerModeBody').textContent = n.ch ? ('You are in the focus space for chapter ' + readerModeChapter + '. Open the full chapter when you are ready; progress updates automatically as you read.') : 'This story is part of the upcoming shelf. Keep it bookmarked and return when the chapter lands.';
    var novelLink = n.link;
    document.getElementById('readerModeOpenBtn').textContent = novelLink && novelLink !== '#' ? 'Open chapter selection →' : 'Story link coming soon';
    document.getElementById('readerModeOpenBtn').disabled = !novelLink || novelLink === '#';
    var bbtn = document.getElementById('readerModeBookmarkBtn');
    bbtn.textContent = currentlyReadingOrder === n.order ? '✓ Currently Reading' : '🔖 Set as Currently Reading';
    bbtn.classList.toggle('active', currentlyReadingOrder === n.order);
    document.querySelector('.reader-mode-copy').style.fontSize = readerFontScale + 'em';
}
function closeReaderMode() {
    document.getElementById('readerModeOverlay').classList.remove('open');
    document.getElementById('readerModePanel').classList.remove('open');
    document.body.classList.remove('reader-mode-active');
    readerModeOrder = null;
}
function adjustReaderChapter(delta) {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n || !n.ch) return;
    readerModeChapter = Math.max(1, Math.min(readerModeChapter + delta, n.ch));
    updateReaderMode();
}
function adjustReaderFont(delta) {
    readerFontScale = Math.max(.9, Math.min(1.25, +(readerFontScale + delta * .05).toFixed(2)));
    store.set('readerFontScale', readerFontScale);
    updateReaderMode();
}
function readerModeBookmark() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    if (!n) return;
    currentlyReadingOrder = currentlyReadingOrder === n.order ? null : n.order;
    store.set('currentlyReading', currentlyReadingOrder);
    refreshReadingUI();
    updateReaderMode();
    showToast(currentlyReadingOrder === n.order ? 'Added to Currently Reading 🔖' : 'Bookmark removed.');
}
function readerModeOpenStory() {
    var n = novels.find(function (x) { return x.order === readerModeOrder; });
    var novelLink = n && n.link;
    if (!novelLink || novelLink === '#') { showToast('The chapter selection page is coming soon ✦'); return; }
    window.location.href = novelLink;
}
function toggleBookmark() {
    if (!spotlightOrder) return;
    if (currentlyReadingOrder === spotlightOrder) { currentlyReadingOrder = null; store.set('currentlyReading', null); showToast('Bookmark removed.'); }
    else {
        currentlyReadingOrder = spotlightOrder; store.set('currentlyReading', spotlightOrder);
        var n = novels.find(function (x) { return x.order === spotlightOrder; }); showToast((n ? n.title : 'Novel') + ' set as currently reading 🔖');
    }
    refreshReadingUI();
    openSpotlight(spotlightOrder);
}
function shareNovel() { if (spotlightOrder) shareNovelQuick(spotlightOrder); }

/* ============================================================
   READING CHALLENGES
   ============================================================ */
function chaptersInLastDays(days) {
    var total = 0, now = new Date();
    for (var i = 0; i < days; i++) {
        var d = new Date(now); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        total += readingLog[key] || 0;
    }
    return total;
}
function totalRead() { return novels.reduce(function (a, n) { return a + getRead(n); }, 0); }
function completedCount() { return novels.filter(function (n) { return n.ch > 0 && getRead(n) >= n.ch; }).length; }
function genresTouched() {
    var set = {};
    novels.forEach(function (n) { if (getRead(n) > 0) n.genres.forEach(function (g) { set[g] = true; }); });
    return Object.keys(set).length;
}

/* ============================================================
   READER LEVEL
   ============================================================ */
function renderReaderLevel() {
    var stats = { read: totalRead(), completed: completedCount(), days: distinctReadingDays() };
    var level = computeReaderLevel(stats);
    var badge = document.getElementById('readerLevelBadge');
    var rankName = document.getElementById('readerRankName');
    var levelSub = document.getElementById('readerLevelSub');
    var xpFill = document.getElementById('readerXpFill');
    var xpLabel = document.getElementById('readerXpLabel');
    var profileRank = document.getElementById('readerProfileRank');
    var profileTheme = document.getElementById('readerProfileRankTheme');
    var rankInfo = readerLevelRanks[Math.min(level.level, readerLevelRanks.length) - 1];
    var rank = rankInfo.name;
    var rankTier = ['I', 'II', 'III', 'IV', 'V'][Math.min(4, Math.floor((level.level - 1) / 3))];
    if (badge) badge.textContent = level.level;
    if (rankName) rankName.textContent = rank;
    if (profileRank) profileRank.textContent = rank + ' · Rank ' + rankTier;
    if (profileTheme) profileTheme.textContent = rankInfo.theme;
    if (levelSub) levelSub.textContent = 'Level ' + level.level;
    if (xpFill) xpFill.style.width = level.pct + '%';
    if (xpLabel) xpLabel.textContent = level.level >= 15 ? 'Maximum rank reached · 15' : level.into + ' / ' + level.need + ' XP to Level ' + (level.level + 1);
    var previous = store.get('readerLevel', null);
    store.set('readerLevel', level.level);
    if (previous !== null && level.level > previous) showToast("🎉 Level up! You're now Level " + level.level + '.');
    renderReaderSpecialRanks();
}
var readerLevelRanks = [
    { name: 'Page Wanderer', theme: 'Just entered the world of stories' },
    { name: 'Ink Novice', theme: 'Beginning the reading journey' },
    { name: 'Story Seeker', theme: 'Exploring different novels' },
    { name: 'Chapter Chaser', theme: 'Reading chapter after chapter' },
    { name: 'Tale Enthusiast', theme: 'Finding a place among favorite stories' },
    { name: 'Ink Adept', theme: 'A skilled reader in the making' },
    { name: 'Plot Hunter', theme: 'Always searching for the next twist' },
    { name: 'Lore Keeper', theme: 'Collecting stories and knowledge' },
    { name: 'Fictional Soul', theme: 'Emotionally invested in fictional worlds' },
    { name: 'Storybound', theme: 'Bound to the world of novels' },
    { name: 'Arc Master', theme: 'Conquering entire story arcs' },
    { name: 'Chronicle Knight', theme: 'A devoted defender of stories' },
    { name: 'Mythic Reader', theme: 'A reader of legendary tales' },
    { name: 'Void Archivist', theme: 'Keeper of forgotten stories' },
    { name: 'Grand Narrator', theme: 'A master of countless narratives' }
];
function renderReaderSpecialRanks() {
    var list = document.getElementById('readerSpecialRankList');
    var count = document.getElementById('readerSpecialRankCount');
    if (!list || typeof novels === 'undefined') return;
    var completed = novels.filter(function (novel) { return novel.ch > 0 && getRead(novel) >= novel.ch; });
    var hidden = store.get('hiddenDiscoveries', {});
    if (!hidden || typeof hidden !== 'object' || Array.isArray(hidden)) hidden = {};
    var completedMystery = completed.some(function (novel) { return novel.genres.indexOf('mystery') !== -1; });
    var bittersweetRomance = completed.some(function (novel) { return novel.order === 2 || (novel.genres.indexOf('romance') !== -1 && novel.genres.indexOf('sad') !== -1); });
    var tragicCount = completed.filter(function (novel) { return novel.genres.indexOf('sad') !== -1; }).length;
    var level = computeReaderLevel({ read: totalRead(), completed: completedCount(), days: distinctReadingDays() }).level;
    var ranks = [
        { icon: '🌸', name: 'Petalbound', hint: 'Complete a bittersweet romance novel', earned: bittersweetRomance },
        { icon: '🕵️', name: 'Truth Seeker', hint: 'Complete a mystery novel', earned: completedMystery },
        { icon: '🌑', name: 'Void Walker', hint: 'Complete Dead Air', earned: completed.some(function (novel) { return novel.order === 20; }) },
        { icon: '💔', name: 'Heartbreaker', hint: 'Complete 10 tragic novels', earned: tragicCount >= 10, progress: Math.min(tragicCount, 10) + ' / 10' },
        { icon: '🐉', name: 'World Forger', hint: 'Complete 100 novels[locked]', earned: completed.length >= 100, progress: Math.min(completed.length, 100) + ' / 100' },
        { icon: '👁️', name: 'The Observer', hint: 'Discover a hidden website achievement', earned: Object.keys(hidden).some(function (key) { return !!hidden[key]; }) },
        { icon: '♾️', name: 'Beyond Fiction', hint: 'Reach the maximum reader level', earned: level >= 15 },
        { icon: '☠️', name: 'The Spoiler King', hint: 'Join a story discussion[LOCKED]', earned: !!store.get('lastCommentAt', false) }
    ];
    var earnedCount = ranks.filter(function (rank) { return rank.earned; }).length;
    if (count) count.textContent = earnedCount + ' / ' + ranks.length;
    list.innerHTML = ranks.map(function (rank) {
        return '<div class="reader-special-rank' + (rank.earned ? ' is-earned' : ' is-locked') + '"><span class="reader-special-rank-icon" aria-hidden="true">' + rank.icon + '</span><span class="reader-special-rank-copy"><strong>' + esc(rank.name) + '</strong><small>' + esc(rank.hint) + (rank.progress ? ' · ' + esc(rank.progress) : '') + '</small></span><span class="reader-special-rank-state" aria-label="' + (rank.earned ? 'Earned' : 'Locked') + '">' + (rank.earned ? '✓' : '·') + '</span></div>';
    }).join('');
}
function distinctReadingDays() {
    return Object.keys(readingLog).filter(function (key) { return readingLog[key] > 0; }).length;
}
function markFlag(key) {
    if (store.get(key, false)) return false;
    store.set(key, true);
    renderReaderAchievements();
    return true;
}
function computeReaderLevel(stats) {
    var totalXP = stats.read * 15 + stats.completed * 60 + stats.days * 5;
    var level = 1, remainingXP = totalXP, need = 100;
    while (remainingXP >= need && level < 15) { remainingXP -= need; level++; need = 100 + (level - 1) * 50; }
    if (level >= 15) return { level: 15, into: 0, need: 0, pct: 100, totalXP: totalXP };
    return { level: level, into: remainingXP, need: need, pct: Math.min(100, Math.floor(remainingXP / need * 100)), totalXP: totalXP };
}
var achievementFilter = 'all';
var readerAchievementDefs = [
    { id: 'first-page', icon: '🌱', title: 'A First Page', hint: 'Read your very first chapter.', category: 'Reading', target: 1, metric: function (s) { return s.read; } },
    { id: 'ten-pages', icon: '📖', title: 'Ten Pages In', hint: 'Read 10 chapters across your stories.', category: 'Reading', target: 10, metric: function (s) { return s.read; } },
    { id: 'chapter-stack', icon: '📚', title: 'A Little Stack', hint: 'Read 50 chapters in total.', category: 'Reading', target: 50, metric: function (s) { return s.read; } },
    { id: 'hundred-pages', icon: '🪶', title: 'Pages Like Petals', hint: 'Read 100 chapters in total.', category: 'Reading', target: 100, metric: function (s) { return s.read; } },
    { id: 'first-finish', icon: '🌅', title: 'The Last Page', hint: 'Finish a story from beginning to end.', category: 'Reading', target: 1, metric: function (s) { return s.completed; } },
    { id: 'three-finish', icon: '🏡', title: 'Found Your Way Home', hint: 'Finish three stories.', category: 'Reading', target: 3, metric: function (s) { return s.completed; } },
    { id: 'whole-library', icon: '🏛️', title: 'The Whole Library', hint: 'Finish every available story on the shelf.', category: 'Reading', target: 1, metric: function (s) { return s.libraryComplete; } },
    { id: 'marathon', icon: '⚡', title: 'One More Chapter', hint: 'Read 10 chapters within a week.', category: 'Rhythm', target: 10, metric: function (s) { return s.week; } },
    { id: 'weekend', icon: '☀️', title: 'A Weekend Chapter', hint: 'Log some reading on a Saturday or Sunday.', category: 'Rhythm', target: 1, metric: function (s) { return s.weekend; } },
    { id: 'night-reader', icon: '🌙', title: 'After Hours', hint: 'Read a chapter late at night.', category: 'Rhythm', target: 1, metric: function (s) { return s.nightOwl; } },
    { id: 'three-day', icon: '🔥', title: 'Three Days Running', hint: 'Build a three-day reading streak.', category: 'Rhythm', target: 3, metric: function (s) { return s.bestStreak; } },
    { id: 'seven-day', icon: '🌠', title: 'A Week in Stories', hint: 'Build a seven-day reading streak.', category: 'Rhythm', target: 7, metric: function (s) { return s.bestStreak; } },
    { id: 'ten-days', icon: '🗓️', title: 'Familiar Pages', hint: 'Read on 10 different days.', category: 'Rhythm', target: 10, metric: function (s) { return s.days; } },
    { id: 'thirty-days', icon: '🌷', title: 'A Month of Reading', hint: 'Read on 30 different days.', category: 'Rhythm', target: 30, metric: function (s) { return s.days; } },
    { id: 'genre-three', icon: '🧭', title: 'Follow the Feeling', hint: 'Read stories from three different genres.', category: 'Discovery', target: 3, metric: function (s) { return s.genres; } },
    { id: 'genre-all', icon: '🌈', title: 'Every Kind of Story', hint: 'Explore all six genres on the shelf.', category: 'Discovery', target: 6, metric: function (s) { return s.genres; } },
    { id: 'first-favorite', icon: '💗', title: 'Kept Close', hint: 'Save your first story as a favorite.', category: 'Collection', target: 1, metric: function (s) { return s.favorites; } },
    { id: 'five-favorites', icon: '💐', title: 'A Favorite for Every Mood', hint: 'Save five stories as favorites.', category: 'Collection', target: 5, metric: function (s) { return s.favorites; } },
    { id: 'reminder-one', icon: '🔔', title: 'A Note to Come Back', hint: 'Set a reminder for an upcoming release.', category: 'Collection', target: 1, metric: function (s) { return s.reminders; } },
    { id: 'reminder-three', icon: '📬', title: 'Release Day Ready', hint: 'Save three release reminders.', category: 'Collection', target: 3, metric: function (s) { return s.reminders; } },
    { id: 'search', icon: '🔎', title: 'Found It', hint: 'Use search to find a story.', category: 'Personal', target: 1, metric: function (s) { return s.searched; } },
    { id: 'share', icon: '🕊️', title: 'Pass It Along', hint: 'Share a story link with someone.', category: 'Personal', target: 1, metric: function (s) { return s.shared; } },
    { id: 'library-secrets', icon: '🗝️', title: 'Behind the Bookcase', hint: 'Find all three hidden Library secrets.', category: 'Secrets', target: 2, metric: function (s) { return s.secrets; } }
];
function getReaderAchievementStats() {
    var weekdays = Object.keys(readingLog).filter(function (key) {
        if (!(Number(readingLog[key]) > 0)) return false;
        var day = new Date(key + 'T00:00:00').getDay();
        return day === 0 || day === 6;
    });
    var available = novels.filter(function (novel) { return novel.status !== 'upcoming' && novel.ch > 0; });
    var discoveries = store.get('hiddenDiscoveries', {});
    if (!discoveries || typeof discoveries !== 'object' || Array.isArray(discoveries)) discoveries = {};
    return {
        read: totalRead(),
        completed: completedCount(),
        libraryComplete: available.length > 0 && available.every(function (novel) { return getRead(novel) >= novel.ch; }) ? 1 : 0,
        week: chaptersInLastDays(7),
        weekend: weekdays.length ? 1 : 0,
        nightOwl: store.get('nightOwlRead', false) ? 1 : 0,
        bestStreak: computeBestStreak(),
        days: distinctReadingDays(),
        genres: genresTouched(),
        favorites: Object.keys(bookmarks).filter(function (key) { return !!bookmarks[key]; }).length,
        reminders: releaseReminders.length,
        searched: store.get('searchedOnce', false) ? 1 : 0,
        shared: store.get('sharedOnce', false) ? 1 : 0,
        secrets: Object.keys(discoveries).filter(function (key) { return !!discoveries[key]; }).length
    };
}
function setAchievementFilter(filter) {
    if (['all', 'earned', 'locked'].indexOf(filter) === -1) return;
    achievementFilter = filter;
    document.querySelectorAll('[data-achievement-filter]').forEach(function (button) {
        var active = button.dataset.achievementFilter === filter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    renderReaderAchievements();
}
function initAchievementFilters() {
    document.querySelectorAll('[data-achievement-filter]').forEach(function (button) {
        button.addEventListener('click', function () { setAchievementFilter(button.dataset.achievementFilter); });
    });
}
function renderReaderAchievements() {
    var grid = document.getElementById('achievementGrid');
    if (!grid) return;
    var stats = getReaderAchievementStats();
    var unlocks = store.get('readerAchUnlocks', {});
    if (!unlocks || typeof unlocks !== 'object' || Array.isArray(unlocks)) unlocks = {};
    var newlyEarned = [];
    var entries = readerAchievementDefs.map(function (achievement) {
        var current = Math.max(0, Number(achievement.metric(stats)) || 0);
        var earned = !!unlocks[achievement.id] || current >= achievement.target;
        if (current >= achievement.target && !unlocks[achievement.id]) {
            unlocks[achievement.id] = new Date().toISOString();
            newlyEarned.push(achievement.title);
        }
        return { achievement: achievement, current: Math.min(current, achievement.target), earned: earned, unlockedAt: unlocks[achievement.id] };
    });
    if (newlyEarned.length) store.set('readerAchUnlocks', unlocks);
    var earnedCount = entries.filter(function (entry) { return entry.earned; }).length;
    var lockedCount = readerAchievementDefs.length - earnedCount;
    var percent = Math.round(earnedCount / readerAchievementDefs.length * 100);
    var countEl = document.getElementById('achievementCount');
    var earnedEl = document.getElementById('achievementEarnedCount');
    var lockedEl = document.getElementById('achievementLockedCount');
    var allEl = document.getElementById('achievementAllCount');
    var percentEl = document.getElementById('achievementProgressPercent');
    var progressLabel = document.getElementById('achievementProgressLabel');
    var progressBar = document.getElementById('achievementProgressBar');
    var progressFill = document.getElementById('achievementProgressFill');
    if (countEl) countEl.innerHTML = earnedCount + ' <i>/ ' + readerAchievementDefs.length + '</i>';
    if (earnedEl) earnedEl.textContent = earnedCount;
    if (lockedEl) lockedEl.textContent = lockedCount;
    if (allEl) allEl.textContent = readerAchievementDefs.length;
    if (percentEl) percentEl.textContent = percent + '%';
    if (progressLabel) progressLabel.textContent = earnedCount === 0 ? 'Your collection is just beginning' : earnedCount === readerAchievementDefs.length ? 'Every milestone is yours' : 'Your collection is taking shape';
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(earnedCount));
    if (progressFill) progressFill.style.width = percent + '%';
    var visible = entries.filter(function (entry) {
        return achievementFilter === 'all' || (achievementFilter === 'earned' ? entry.earned : !entry.earned);
    });
    grid.innerHTML = visible.map(function (entry) {
        var a = entry.achievement;
        var pct = Math.min(100, Math.round(entry.current / a.target * 100));
        var date = entry.earned && entry.unlockedAt ? new Date(entry.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        return '<article class="achievement-card' + (entry.earned ? ' is-earned' : ' is-locked') + '" aria-label="' + esc(a.title + '. ' + (entry.earned ? 'Earned' : 'Locked')) + '">' +
            '<div class="achievement-card-top"><span class="achievement-category">' + esc(a.category) + '</span><span class="achievement-state">' + (entry.earned ? '✓ Earned' : 'In progress') + '</span></div>' +
            '<div class="achievement-emblem" aria-hidden="true"><span>' + a.icon + '</span><i></i></div>' +
            '<h3>' + esc(a.title) + '</h3><p>' + esc(a.hint) + '</p>' +
            '<div class="achievement-card-bottom">' + (entry.earned ? '<span class="achievement-earned-date">' + (date ? 'Collected ' + esc(date) : 'Collected') + '</span><span class="achievement-earned-mark" aria-hidden="true">✦</span>' : '<div class="achievement-card-progress"><div><span>' + esc(a.category === 'Secrets' ? 'Secrets found' : 'Progress') + '</span><span>' + fmtNum(entry.current) + ' / ' + fmtNum(a.target) + '</span></div><span class="achievement-card-track"><i style="width:' + pct + '%"></i></span></div>') + '</div>' +
            '</article>';
    }).join('');
    hideSkeleton('achievementSkeleton');
    if (newlyEarned.length === 1) showToast('✦ Milestone earned: ' + newlyEarned[0]);
    else if (newlyEarned.length > 1) showToast('✦ ' + newlyEarned.length + ' reading milestones added to your collection.');
}
function toggleSectionContent(contentId, buttonId, storageKey, label) {
    var content = document.getElementById(contentId);
    var button = document.getElementById(buttonId);
    if (!content || !button) return;
    var collapsed = !content.hidden;
    content.hidden = collapsed;
    button.setAttribute('aria-expanded', String(!collapsed));
    button.innerHTML = (collapsed ? 'Show ' : 'Minimize ') + label +
        ' <span aria-hidden="true">' + (collapsed ? '⌄' : '⌃') + '</span>';
    store.set(storageKey, collapsed);
}
function restoreSectionContent(contentId, buttonId, storageKey, label) {
    var content = document.getElementById(contentId);
    var button = document.getElementById(buttonId);
    if (!content || !button) return;
    var collapsed = store.get(storageKey, false);
    content.hidden = collapsed;
    button.setAttribute('aria-expanded', String(!collapsed));
    button.innerHTML = (collapsed ? 'Show ' : 'Minimize ') + label +
        ' <span aria-hidden="true">' + (collapsed ? '⌄' : '⌃') + '</span>';
}
function setAchievementContent(collapsed) {
    var content = document.getElementById('achievementContent');
    var minimizeButton = document.getElementById('achievementMinimize');
    var maximizeButton = document.getElementById('achievementMaximize');
    if (!content || !minimizeButton || !maximizeButton) return;
    content.hidden = collapsed;
    minimizeButton.setAttribute('aria-pressed', String(collapsed));
    maximizeButton.setAttribute('aria-pressed', String(!collapsed));
    minimizeButton.classList.toggle('active', collapsed);
    maximizeButton.classList.toggle('active', !collapsed);
    store.set('achievementsCollapsed', collapsed);
}
function restoreAchievementContent() {
    setAchievementContent(!!store.get('achievementsCollapsed', false));
}
/* ============================================================
   SURPRISE ME — WEIGHTED RANDOM PICK
   ============================================================ */
var lastSurpriseOrder = null;
function surpriseMe() {
    var touched = {};
    novels.forEach(function (n) { if (getRead(n) > 0) n.genres.forEach(function (g) { touched[g] = true; }); });

    var pool = novels.filter(function (n) { return n.status !== 'upcoming' && n.ch > 0 && n.order !== lastSurpriseOrder; });
    if (!pool.length) pool = novels.filter(function (n) { return n.status !== 'upcoming' && n.ch > 0; });
    if (!pool.length) { showToast('Nothing to surprise you with yet ✦'); return; }

    // Weight toward novels touching genres the reader hasn't read yet
    var weighted = pool.map(function (n) {
        var newGenres = n.genres.filter(function (g) { return !touched[g]; }).length;
        return { n: n, weight: 1 + newGenres * 2 };
    });
    var total = weighted.reduce(function (a, w) { return a + w.weight; }, 0);
    var r = Math.random() * total;
    var pick = weighted[weighted.length - 1].n;
    for (var i = 0; i < weighted.length; i++) {
        r -= weighted[i].weight;
        if (r <= 0) { pick = weighted[i].n; break; }
    }
    lastSurpriseOrder = pick.order;

    var icon = document.getElementById('surpriseIcon');
    if (icon) { icon.classList.remove('dice-spin'); void icon.offsetWidth; icon.classList.add('dice-spin'); }

    showToast('🎲 How about "' + pick.title + '"?');
    openSpotlight(pick.order);
}

/* ============================================================
   HEATMAP
   ============================================================ */
function renderHeatmap() {
    var grid = document.getElementById('heatmapGrid');
    var days = 119, cells = [];
    var today = new Date();
    for (var i = days - 1; i >= 0; i--) {
        var d = new Date(today); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        var count = readingLog[key] || 0;
        var alpha = count === 0 ? 0 : count === 1 ? .3 : count <= 3 ? .6 : 1;
        cells.push('<div class="hm-cell" style="background:' + (count === 0 ? 'var(--panel-2)' : 'rgba(var(--accent-rgb),' + alpha + ')') + '" title="' + key + ': ' + count + ' chapters read"></div>');
    }
    grid.innerHTML = cells.join('');
}
/* ============================================================
   CALENDAR
   ============================================================ */
var upcomingReleases = [
    { date: '2026-11-16', title: "The Dead Man’s Alibi" },
    { date: '2026-11-10', title: "Case File: The Silence Between Rings" },
    { date: '2026-11-15', title: 'Petal Vol. 4 — chpater 5 ' },
];
var calSorted = [];
var releaseReminders = store.get('releaseReminders', []);
if (!Array.isArray(releaseReminders)) releaseReminders = [];
releaseReminders = releaseReminders.filter(function (item) { return item && typeof item === 'object' && typeof item.key === 'string' && typeof item.date === 'string'; });

function reminderKey(r) { return r.date + '|' + r.title; }
function localCalendarDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}
function notifyDueReleaseReminders() {
    var today = localCalendarDate(new Date());
    var due = releaseReminders.filter(function (r) { return r && !r.notified && r.date <= today; });
    if (!due.length) return;
    due.forEach(function (r) { r.notified = true; });
    store.set('releaseReminders', releaseReminders);
    showToast(due.length === 1 ? 'Release reminder: ' + due[0].title : due.length + ' saved releases are due today ✦');
}

function daysUntil(dateStr) {
    var target = new Date(dateStr + 'T00:00:00');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
}

function calRemind(idx) {
    var r = calSorted[idx];
    if (!r) return;
    var key = reminderKey(r);
    var existing = releaseReminders.findIndex(function (item) { return item.key === key; });
    if (existing > -1) {
        releaseReminders.splice(existing, 1);
        showToast('Release reminder removed.');
    } else {
        releaseReminders.push({ key: key, title: r.title, date: r.date, notified: false });
        showToast('Saved a reminder for ' + r.title + ' ✦');
    }
    store.set('releaseReminders', releaseReminders);
    renderCalendar();
    renderReaderLevel();
    renderReaderAchievements();
}

function renderCalendar() {
    var list = document.getElementById('calendarList');
    notifyDueReleaseReminders();

    calSorted = upcomingReleases
        .map(function (r) { return { title: r.title, date: r.date, daysOut: daysUntil(r.date) }; })
        .filter(function (r) { return r.daysOut >= 0; }) // drop releases that already passed
        .sort(function (a, b) { return a.daysOut - b.daysOut; });

    if (!calSorted.length) {
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:12.5px">No upcoming releases right now.</div>';
        return;
    }

    list.innerHTML = calSorted.map(function (r, idx) {
        var d = new Date(r.date + 'T00:00:00');
        var countLabel = r.daysOut === 0 ? 'today' : r.daysOut === 1 ? 'tomorrow' : 'in ' + r.daysOut + ' days';
        return '<div class="cal-item"><div class="cal-date-block"><div class="cal-day">' + d.getDate() + '</div><div class="cal-mon">' + d.toLocaleDateString('en-US', { month: 'short' }) + '</div></div>' +
            '<div class="cal-info"><div class="cal-title">' + esc(r.title) + '</div><div class="cal-count">' + countLabel + '</div></div>' +
            '<button class="pill-btn' + (releaseReminders.some(function (item) { return item.key === reminderKey(r); }) ? ' active' : '') + '" aria-pressed="' + releaseReminders.some(function (item) { return item.key === reminderKey(r); }) + '" onclick="calRemind(' + idx + ')">' + (releaseReminders.some(function (item) { return item.key === reminderKey(r); }) ? 'Reminder saved ✓' : 'Remind me') + '</button></div>';
    }).join('');
}

/* ============================================================
   COMMAND-K SEARCH
   ============================================================ */
var recentSearches = store.get('recentSearches', []);
var popularSearches = ['romance', 'ongoing stories', 'highest rated', 'case file: you', 'petal vol. 3'];
var cmdkActiveIdx = -1;
function openCmdk() {
    document.getElementById('cmdkOverlay').classList.add('open');
    document.getElementById('cmdkPanel').classList.add('open');
    document.getElementById('cmdkInput').value = '';
    cmdkRender();
    setTimeout(function () { document.getElementById('cmdkInput').focus(); }, 50);
    markFlag('searchedOnce');
}
function closeCmdk() {
    document.getElementById('cmdkOverlay').classList.remove('open');
    document.getElementById('cmdkPanel').classList.remove('open');
}
function cmdkRender() {
    var q = sanitize(document.getElementById('cmdkInput').value).toLowerCase();
    var results = document.getElementById('cmdkResults');
    cmdkActiveIdx = -1;
    if (!q) {
        var recentHtml = recentSearches.length ? '<div class="cmdk-section-label">Recent</div>' + recentSearches.map(function (r, i) {
            return '<div class="cmdk-row" onclick="cmdkSearchIdx(\'recent\',' + i + ')"><div class="cmdk-row-icon">🕐</div><div class="cmdk-row-title">' + esc(r) + '</div></div>';
        }).join('') : '';
        var popularHtml = '<div class="cmdk-section-label">Popular</div>' + popularSearches.map(function (r, i) {
            return '<div class="cmdk-row" onclick="cmdkSearchIdx(\'popular\',' + i + ')"><div class="cmdk-row-icon">🔥</div><div class="cmdk-row-title">' + esc(r) + '</div></div>';
        }).join('');
        results.innerHTML = recentHtml + popularHtml;
        return;
    }
    var matches = novels.filter(function (n) { return n.title.toLowerCase().indexOf(q) > -1 || n.genres.join(' ').indexOf(q) > -1; });
    if (!matches.length) { results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:12.5px">No stories match "' + esc(q) + '"</div>'; return; }
    results.innerHTML = '<div class="cmdk-section-label">Stories</div>' + matches.map(function (n, i) {
        return '<div class="cmdk-row" data-i="' + i + '" onclick="cmdkOpen(' + n.order + ')"><div class="cmdk-row-icon"><img src="' + esc(n.img) + '" onerror="imgFail(this)"></div>' +
            '<div class="cmdk-row-text"><div class="cmdk-row-title">' + esc(n.title) + '</div><div class="cmdk-row-sub">' + n.genres.map(function (g) { return badgeLabel[g]; }).join(' · ') + '</div></div></div>';
    }).join('');
}
function cmdkSearchTerm(term) { document.getElementById('cmdkInput').value = term; cmdkRender(); }
function cmdkSearchIdx(listName, idx) {
    var list = listName === 'recent' ? recentSearches : popularSearches;
    var term = list[idx];
    if (term != null) cmdkSearchTerm(term);
}
function cmdkOpen(order) {
    var q = document.getElementById('cmdkInput').value.trim();
    if (q) { recentSearches = [q].concat(recentSearches.filter(function (r) { return r !== q; })).slice(0, 5); store.set('recentSearches', recentSearches); }
    closeCmdk();
    openSpotlight(order);
}
document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmdk(); return; }
    if (e.key === 'Escape') { closeCmdk(); closeSettings(); closeSpotlight(); closeReaderMode(); return; }
    if (document.getElementById('cmdkPanel').classList.contains('open')) {
        var rows = document.querySelectorAll('.cmdk-row');
        if (!rows.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdkActiveIdx = Math.min(cmdkActiveIdx + 1, rows.length - 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkActiveIdx = Math.max(cmdkActiveIdx - 1, 0); }
        else if (e.key === 'Enter') { if (cmdkActiveIdx > -1) rows[cmdkActiveIdx].click(); return; }
        else return;
        rows.forEach(function (r, i) { r.classList.toggle('active', i === cmdkActiveIdx); });
        rows[cmdkActiveIdx].scrollIntoView({ block: 'nearest' });
    }
});

/* ============================================================
   SETTINGS
   ============================================================ */
function openSettings(section) {
    document.getElementById('settingsOverlay').classList.add('open');
    document.getElementById('settingsPanel').classList.add('open');
    if (section === 'profile') setTimeout(function () {
        var input = document.getElementById('readerProfileNameInput');
        if (input) input.focus();
    }, 180);
}
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); document.getElementById('settingsPanel').classList.remove('open'); }
function renderReaderProfile() {
    var name = sanitize(readerProfile.name || 'Reader').slice(0, 32) || 'Reader';
    var bio = sanitize(readerProfile.bio || '').slice(0, 140);
    var initials = name.trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase() || 'R';
    var nameDisplay = document.getElementById('readerProfileNameDisplay');
    var bioDisplay = document.getElementById('readerProfileBioDisplay');
    var avatar = document.getElementById('readerProfileAvatar');
    var nameInput = document.getElementById('readerProfileNameInput');
    var bioInput = document.getElementById('readerProfileBioInput');
    if (nameDisplay) nameDisplay.textContent = name;
    if (bioDisplay) bioDisplay.textContent = bio || 'Make this reading space yours.';
    if (avatar) avatar.textContent = initials;
    if (nameInput) nameInput.value = name;
    if (bioInput) bioInput.value = bio;
}
function saveReaderProfile() {
    var nameInput = document.getElementById('readerProfileNameInput');
    var bioInput = document.getElementById('readerProfileBioInput');
    var name = sanitize(nameInput ? nameInput.value : '').slice(0, 32);
    if (!name) {
        showToast('Add a display name to save your profile.');
        if (nameInput) nameInput.focus();
        return;
    }
    readerProfile = { name: name, bio: sanitize(bioInput ? bioInput.value : '').slice(0, 140) };
    store.set('readerProfile', readerProfile);
    renderReaderProfile();
    showToast('Reader profile saved ✦');
}
function toggleLight() {
    document.body.classList.toggle('light');
    var on = document.body.classList.contains('light');
    document.documentElement.classList.toggle('light-scrollbar', on);
    store.set('lightMode', on ? 'on' : 'off');
    var t = document.getElementById('lightToggle'); if (t) { t.classList.toggle('on', on); t.setAttribute('aria-checked', String(on)); }
}
function toggleMotionPref() {
    var btn = document.getElementById('motionToggle'); btn.classList.toggle('on');
    motionEnabled = btn.classList.contains('on'); store.set('motionEnabled', motionEnabled);
    btn.setAttribute('aria-checked', String(motionEnabled));
    startHeroRotate();
}
function toggleReducedMotion() {
    var btn = document.getElementById('reducedMotionToggle');
    var enabled = !btn.classList.contains('on');
    btn.classList.toggle('on', enabled);
    btn.setAttribute('aria-checked', String(enabled));
    store.set('reducedMotion', enabled);
    document.body.classList.toggle('reduce-motion', enabled);
    if (enabled) {
        prefersReducedMotion = true;
        // Pause all animations
        document.querySelectorAll('.aurora-layer, .blob, .novel-card, .glass').forEach(function (el) {
            el.style.animationPlayState = 'paused';
            el.style.transitionDuration = '0.001ms';
        });
        clearInterval(heroRotateTimer);
    } else {
        prefersReducedMotion = false;
        document.querySelectorAll('.aurora-layer, .blob, .novel-card, .glass').forEach(function (el) {
            el.style.animationPlayState = '';
            el.style.transitionDuration = '';
        });
        startHeroRotate();
    }
    showToast(enabled ? 'Reduced motion enabled' : 'Reduced motion disabled');
}
function toggleAutoHideNav() {
    var btn = document.getElementById('autoHideNavToggle');
    var enabled = !btn.classList.contains('on');
    btn.classList.toggle('on', enabled);
    btn.setAttribute('aria-checked', String(enabled));
    store.set('autoHideNav', enabled);
    document.body.classList.toggle('auto-hide-nav', enabled);
    var dock = document.querySelector('.browser-dock');
    if (dock) dock.classList.toggle('nav-visible', enabled);
    lastScrollY = window.scrollY;
    showToast(enabled ? 'Auto-hide nav enabled' : 'Auto-hide nav disabled');
}
/* ============================================================
   SCROLL / MISC
   ============================================================ */
var lastScrollY = 0;
var scrollDir = 'down';
window.addEventListener('scroll', function () {
    var scrollY = window.scrollY;
    var dock = document.querySelector('.browser-dock');

    document.getElementById('scrollBtn').classList.toggle('vis', scrollY > 320);

    // Auto-hide nav logic
    if (document.body.classList.contains('auto-hide-nav') && dock) {
        if (scrollY > lastScrollY && scrollY > 200) {
            // Scrolling down - hide nav
            dock.classList.remove('nav-visible');
        } else if (scrollY < lastScrollY) {
            // Scrolling up - show nav
            dock.classList.add('nav-visible');
        }
    }

    lastScrollY = scrollY;
}, { passive: true });

/* ============================================================
   PERFORMANCE OPTIMIZATIONS
   ============================================================ */

// IntersectionObserver for triggering animations only when visible
function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;
    if (prefersReducedMotion) return;

    var animatedElements = document.querySelectorAll('.novel-card, .glass, .hero-feature, .stat-tile, .milestone-tile, .mood-card, .side-card');

    var animationObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                animationObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '50px', threshold: 0.1 });

    animatedElements.forEach(function (el) { animationObserver.observe(el); });
}

// Lazy load images with IntersectionObserver
function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    var lazyImages = document.querySelectorAll('img[loading="lazy"]');

    var imageObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
                img.removeAttribute('loading');
                imageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '100px', threshold: 0.01 });

    lazyImages.forEach(function (img) { imageObserver.observe(img); });
}

// Reduce paint cost: disable complex animations when tab is hidden
function initVisibilityOptimization() {
    document.addEventListener('visibilitychange', function () {
        var isHidden = document.hidden;
        var auroraLayers = document.querySelectorAll('.aurora-layer');
        var blobs = document.querySelectorAll('.blob');

        auroraLayers.forEach(function (layer) {
            layer.style.animationPlayState = isHidden ? 'paused' : 'running';
        });
        blobs.forEach(function (blob) {
            blob.style.animationPlayState = isHidden ? 'paused' : 'running';
        });

        // Pause hero rotation when hidden
        if (isHidden) {
            clearInterval(heroRotateTimer);
        } else {
            startHeroRotate();
        }
    });
}

/* ============================================================
   ACCESSIBILITY IMPROVEMENTS
   ============================================================ */

// Focus trap for modal panels
function trapFocus(element) {
    var focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    var firstElement = focusableElements[0];
    var lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });

    // Focus first element when panel opens
    if (firstElement) firstElement.focus();
}

// Apply focus trap to all panels
function initFocusTraps() {
    var panels = [
        document.getElementById('spotlightPanel'),
        document.getElementById('settingsPanel'),
        document.getElementById('cmdkPanel'),
        document.getElementById('readerModePanel')
    ];

    panels.forEach(function (panel) {
        if (panel) {
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (panel.classList.contains('open')) {
                            trapFocus(panel);
                        }
                    }
                });
            });
            observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
        }
    });
}

// Keyboard navigation for catalog grid
function initCatalogKeyboardNav() {
    var grid = document.getElementById('catalogGrid');
    if (!grid) return;

    grid.addEventListener('keydown', function (e) {
        var cards = grid.querySelectorAll('.novel-card');
        if (!cards.length) return;

        var currentIndex = Array.from(cards).findIndex(function (card) {
            return card === document.activeElement || card.contains(document.activeElement);
        });

        if (currentIndex === -1) return;

        var cols = 3;
        if (window.innerWidth < 1080) cols = 2;
        if (window.innerWidth < 760) cols = 2;
        if (window.innerWidth < 500) cols = 2;
        if (window.innerWidth < 380) cols = 1;

        var newIndex = currentIndex;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                newIndex = Math.min(currentIndex + 1, cards.length - 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newIndex = Math.min(currentIndex + cols, cards.length - 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                newIndex = Math.max(currentIndex - cols, 0);
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = cards.length - 1;
                break;
        }

        if (newIndex !== currentIndex) {
            var focusTarget = cards[newIndex].querySelector('.novel-card-open') || cards[newIndex];
            focusTarget.focus();
        }
    });
}

// Announce dynamic content changes to screen readers
function announceToScreenReader(message, priority) {
    var liveRegion = document.getElementById('a11y-live-region');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'a11y-live-region';
        liveRegion.setAttribute('aria-live', priority || 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    // Force reflow
    liveRegion.offsetHeight;
    liveRegion.textContent = message;
}

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('load', function () {
    initAchievementFilters();
    renderReaderProfile();
    renderReadingHistory();
    renderStoryWorlds();
    renderStorySampler();
    renderStoryCompareOptions();
    renderForYouPicks();
    renderReaderAchievements();
    restoreSectionContent('storySamplerContent', 'storySamplerToggle', 'storySamplerCollapsed', 'story sampler');
    restoreSectionContent('storyWorldGrid', 'storyWorldsToggle', 'storyWorldsCollapsed', 'connected stories');
    restoreAchievementContent();
    var defaultLightMode = 'on';
    var wantLight = store.get('lightMode', defaultLightMode) === 'on';
    document.body.classList.toggle('light', wantLight);
    document.documentElement.classList.toggle('light-scrollbar', wantLight);
    renderExclusiveScrollbarSetting();
    var t = document.getElementById('lightToggle');
    if (t) { t.classList.toggle('on', wantLight); t.setAttribute('aria-checked', String(wantLight)); }
    document.getElementById('motionToggle').classList.toggle('on', motionEnabled);
    document.getElementById('motionToggle').setAttribute('aria-checked', String(motionEnabled));

    // Restore reduced motion preference
    var reducedMotion = store.get('reducedMotion', false);
    if (reducedMotion) {
        prefersReducedMotion = true;
        document.body.classList.add('reduce-motion');
        var rmBtn = document.getElementById('reducedMotionToggle');
        if (rmBtn) { rmBtn.classList.add('on'); rmBtn.setAttribute('aria-checked', 'true'); }
    }

    // Restore auto-hide nav preference
    var autoHideNav = store.get('autoHideNav', false);
    if (autoHideNav) {
        document.body.classList.add('auto-hide-nav');
        var dock = document.querySelector('.browser-dock');
        if (dock) dock.classList.add('nav-visible');
        var anBtn = document.getElementById('autoHideNavToggle');
        if (anBtn) { anBtn.classList.add('on'); anBtn.setAttribute('aria-checked', 'true'); }
    }

    initTheme();
    initMorphismStyle();
    paintAurora(moodColors.all);
    renderHero();
    renderStats();
    renderHeatmap();
    renderCalendar();

    // Performance & accessibility init
    initScrollAnimations();
    initLazyImages();
    initVisibilityOptimization();
    initFocusTraps();
    initCatalogKeyboardNav();

    document.addEventListener('visibilitychange', startHeroRotate);
    document.addEventListener('visibilitychange', notifyDueReleaseReminders);
    window.setInterval(notifyDueReleaseReminders, 60000);
});
/* ============================================================
   NAVIGATION DOCK
   ============================================================ */

const dockItems = document.querySelectorAll(".browser-tab:not(.browser-settings)");
function setDockActive(activeItem) {
    dockItems.forEach(function (item) {
        var active = item === activeItem;
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
    });
}
dockItems.forEach(function (item) {
    item.addEventListener('click', function () { setDockActive(item); });
});

if ('IntersectionObserver' in window) {
    var dockSections = Array.from(dockItems).map(function (item) {
        return { item: item, section: document.querySelector(item.getAttribute('href')) };
    }).filter(function (entry) { return !!entry.section; });
    var dockObserver = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; })
            .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
        if (!visible) return;
        var active = dockSections.find(function (entry) { return entry.section === visible.target; });
        if (active) setDockActive(active.item);
    }, { rootMargin: "-20% 0px -55% 0px", threshold: [0, .15, .35, .6] });

    dockSections.forEach(function (entry) { dockObserver.observe(entry.section); });
}


/* ============================================================
   THE EYE AWAKENS
============================================================ */

const EYE_KEY = "eyeLastSeen";

function shouldWakeEye() {

    const last = store.get(EYE_KEY, 0);

    if (Date.now() - last < 7 * 24 * 60 * 60 * 1000) return false;

    const hour = new Date().getHours();

    const chance = (hour >= 0 && hour < 3) ? 0.15 : 0.01;

    return Math.random() < chance;
}

function wakeEye() {

    const eye = document.getElementById("eyeEvent");
    const pupil = document.getElementById("eyePupil");

    if (!eye || !pupil) return;

    document.body.classList.add("eye-awakened");
    eye.classList.add("active");

    store.set(EYE_KEY, Date.now());

    showToast("UNKNOWN SIGNAL DETECTED");

    function follow(e) {

        const x = (e.clientX - window.innerWidth / 2) * 0.02;
        const y = (e.clientY - window.innerHeight / 2) * 0.02;

        pupil.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    window.addEventListener("mousemove", follow);

    const glitch = setInterval(() => {

        document.body.style.filter = "brightness(.88)";

        setTimeout(() => document.body.style.filter = "", 90);

    }, 7000);

    setTimeout(() => {

        eye.classList.remove("active");
        document.body.classList.remove("eye-awakened");
        window.removeEventListener("mousemove", follow);
        clearInterval(glitch);

        revealWatcherSecret();

    }, 45000);
}

function revealLibrarySecret(key, message) {
    var discoveries = store.get('hiddenDiscoveries', {});
    if (discoveries[key]) return;
    discoveries[key] = new Date().toISOString();
    store.set('hiddenDiscoveries', discoveries);
    showToast(message);
    renderReaderAchievements();
}
function revealWatcherSecret() {
    revealLibrarySecret('watcher', '👁 The Watcher has seen you.');
}
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {

        if (shouldWakeEye()) {

            wakeEye();

        }

    }, 3000);

    setTimeout(() => {

        if (shouldTriggerEclipse()) {

            triggerEclipse();

        }

    }, 5000);
});

/* ============================================================
   ECLIPSE EVENT
   (Declared at top level — not inside DOMContentLoaded — so that
   triggerEclipse()/revealEclipseSecret() are reachable from the
   Ctrl/Cmd+Shift+E shortcut and window.debugEclipse() below, which
   live outside that handler's scope. Previously these were declared
   inside the DOMContentLoaded callback, which made them local to that
   function and undefined everywhere else — this was the bug that made
   the eclipse event impossible to trigger manually.)
============================================================ */

const ECLIPSE_KEY = "lastEclipseEvent";

function shouldTriggerEclipse() {
    setTimeout(() => {
        const cmdk = document.getElementById("cmdkInput");
        if (cmdk) cmdk.placeholder = "The library remembers who stayed...";
    }, 25000);

    setTimeout(() => {
        const cmdk = document.getElementById("cmdkInput");
        if (cmdk) cmdk.placeholder = "Search novels, genres, moods…";
    }, 120000);


    const last = store.get(ECLIPSE_KEY, 0);

    if (Date.now() - last < 7 * 24 * 60 * 60 * 1000) return false;

    const h = new Date().getHours();

    const chance = (h >= 0 && h < 3) ? 0.15 : 0.005;

    return Math.random() < chance;
}

function triggerEclipse() {

    const event = document.getElementById("eclipseEvent");

    if (!event) return;

    document.body.classList.add("eclipse-active");
    event.classList.add("active");

    store.set(ECLIPSE_KEY, Date.now());

    showToast("🌒 The Library has gone silent...");

    // Pick one random shelf card

    if (!document.querySelector("#catalogGrid .novel-card")) {
        renderCatalog();
    }

    const cards = [...document.querySelectorAll("#catalogGrid .novel-card")];

    let blessed = null;

    if (cards.length) {

        blessed = cards[Math.floor(Math.random() * cards.length)];

        blessed.classList.add("eclipse-blessed");
    }

    if (blessed) {

        blessed.style.pointerEvents = "auto";

        blessed.addEventListener("click", revealEclipseSecret, { once: true });
    }

    setTimeout(() => {

        event.classList.remove("active");
        document.body.classList.remove("eclipse-active");

        if (blessed)
            blessed.classList.remove("eclipse-blessed");

        showToast("The eclipse has passed.");

    }, 120000); // 2 minutes
}

function revealEclipseSecret() {
    revealLibrarySecret('eclipse', '🌘 The Library remembers you were here.');
}
// Developer shortcut - Ctrl/Cmd + Shift + E
// Previously Alt+Shift+E: dropped because bare Alt+Shift is a reserved
// OS-level "switch keyboard language" hotkey on many Windows setups, and
// Option+E is a dead-key accent combo on Mac — both can swallow the
// keydown before the page ever sees it. Ctrl/Cmd+Shift avoids both.
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyE") {
        e.preventDefault();
        triggerEclipse();
        showToast("🌒 Developer: Eclipse triggered.");
    }
});
// Guaranteed fallback if any browser/OS/extension still eats the shortcut:
// open devtools console and run  debugEclipse()
window.debugEclipse = function () {
    if (typeof triggerEclipse === "function") {
        triggerEclipse();
    } else {
        console.error("triggerEclipse() is missing.");
    }
};
/* =========================
   KONAMI NEON MODE
========================= */

const konami = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "b", "a"
];

let konamiIndex = 0;
let neonUnlocked = false;

document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (key === konami[konamiIndex]) {
        konamiIndex++;

        if (konamiIndex === konami.length) {
            activateNeonMode();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function activateNeonMode() {
    document.body.classList.add("neon-mode");

    if (!neonUnlocked) {
        revealNeonSecret();
        neonUnlocked = true;
    }

    setTimeout(() => {
        document.body.classList.remove("neon-mode");
    }, 10000);
}

function revealNeonSecret() {
    revealLibrarySecret('neon', '🕹️ You found the old arcade secret.');
}
