/* Planedex (/tools/planedex/). An old-school handheld-style collection
   game for the planes our ADS-B receiver catches. Fetches the game data
   from /api/planedex and draws the screens: the Dex (morning report, a
   numbered list and the selected plane's entry), Today (daily missions,
   catch of the day, radio log), Wanted posters, Families, Badges and
   Passport.

   - Read-only. Everything is worked out on the PC that keeps the logs
     (scripts/planedex/planedex_push.py); this only displays it. The
     morning report is written once a day by a scheduled task.
   - Real photos first: the exact airframe from Planespotters.net when
     the first one caught was an airliner (looked up live, as their rules
     require, with the photographer credited and the photo linked), else
     the model's photo saved in /tools/planedex/photos/ (Wikimedia
     Commons, credits in its index.json). Pixel sprites from
     planedex-sprites.js only fill in when there's no photo, and for
     planes not caught yet.
   - Sounds are tiny Web Audio beeps made on the fly, only after a tap,
     with a mute button.
   - localStorage keeps small conveniences: the highest dex number this
     browser has seen (for NEW tags and the catch reveal), the sound
     setting, the site-wide theme, and whether today's report was read
     or folded away.
   - No inline styles: colors come from classes, bars are <progress>. */
(function () {
  'use strict';

  var API = '/api/planedex';
  var PHOTOS = '/tools/planedex/photos/';
  var REFRESH_MS = 5 * 60 * 1000;
  var SEEN_KEY = 'planedex-seen';
  var SOUND_KEY = 'planedex-sound';
  var REPORT_READ_KEY = 'planedex-report-read';
  var REPORT_FOLD_KEY = 'planedex-report-folded';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var TABS = ['dex', 'today', 'wanted', 'families', 'badges', 'passport', 'logbook'];
  var RARITY_XP = [0, 25, 75, 200, 500, 1500];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  var FLAGS = '/tools/planedex/flags/';
  var FLAGS_V = '?v=2';  // flags are cached for 30 days; bump this when they're re-rendered
  var LOGOS = '/tools/planedex/logos/';
  var NARROW = window.matchMedia ? window.matchMedia('(max-width: 820px)') : { matches: false };
  var S = window.PlanedexSprites;
  var BA = window.PlanedexBadges;

  var state = {
    data: null, byCode: {}, missingByCode: {}, tab: 'dex', sel: null,
    q: '', type: 'all', rarity: 0, sort: 'dex', show: 'all',
    seenBefore: null, loadedAt: 0, reveal: [], revealAt: 0,
    photos: {}, airframes: {}, reportShown: null, logos: {}, logbook: null
  };
  var el = {};

  /* ---- helpers ------------------------------------------------------------ */

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return Number(n || 0).toLocaleString('en-US'); }
  function pad3(n) { return ('00' + n).slice(-3); }
  function no(n) { return 'No.' + (n ? pad3(n) : '???'); }
  function plural(n, one, many) { return num(n) + ' ' + (n === 1 ? one : many); }

  function parseKey(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?/.exec(key || '');
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] == null ? null : +m[4], day: m[1] + '-' + m[2] + '-' + m[3] };
  }
  function addDays(day, n) {
    var p = parseKey(day);
    return new Date(Date.UTC(p.y, p.mo - 1, p.d + n)).toISOString().slice(0, 10);
  }
  function fmtHour(h) {
    if (h === 0) return '12 AM';
    if (h === 12) return 'NOON';
    return h < 12 ? h + ' AM' : (h - 12) + ' PM';
  }
  function fmtDay(key, withYear) {
    var p = parseKey(key);
    return p ? MONTHS[p.mo - 1] + ' ' + p.d + (withYear ? ', ' + p.y : '') : '';
  }
  // "November 8th, 2026"
  function longDate(key) {
    var p = parseKey(key);
    if (!p) return '';
    var th = (p.d % 100 >= 11 && p.d % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[p.d % 10] || 'th');
    return MONTHS_LONG[p.mo - 1] + ' ' + p.d + th + ', ' + p.y;
  }
  function weekday(key) {
    var p = parseKey(key);
    return p ? WEEKDAYS[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()] : '';
  }
  function dayLabel(day) {
    var today = state.data && state.data.today.date;
    if (day === today) return 'Today';
    if (today && day === addDays(today, -1)) return 'Yesterday';
    return fmtDay(day);
  }
  function fmtWhen(key) {
    var p = parseKey(key);
    return p ? dayLabel(p.day) + (p.h == null ? '' : ', ' + fmtHour(p.h).toLowerCase()) : '';
  }
  function ago(iso) {
    var mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
    if (!isFinite(mins)) return '';
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var h = Math.round(mins / 60);
    return h < 48 ? h + (h === 1 ? ' hour ago' : ' hours ago') : Math.round(h / 24) + ' days ago';
  }
  function rarityName(r) {
    var names = (state.data && state.data.rarities) || ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    return names[r - 1] || '';
  }
  function stars(r) {
    return '<span class="stars r' + r + '" role="img" aria-label="' + esc(rarityName(r)) + ', ' + r + ' of 5 stars">'
      + '<span class="on">' + '★'.repeat(r) + '</span><span class="off">' + '★'.repeat(5 - r) + '</span></span>';
  }
  function typeChips(types) {
    var labels = (state.data && state.data.types) || {};
    return '<span class="types">' + (types || []).map(function (t) {
      return '<span class="tchip t-' + esc(t) + '">' + esc(labels[t] || t) + '</span>';
    }).join('') + '</span>';
  }
  function spriteTag(code, types, sil, cls) {
    return '<canvas class="sprite ' + (cls || '') + '" width="48" height="24" data-sprite="' + esc(code) + '"'
      + ' data-types="' + esc((types || []).join(',')) + '"' + (sil ? ' data-sil="1"' : '') + ' aria-hidden="true"></canvas>';
  }
  function paintSprites(root) {
    if (!S) return;
    (root || document).querySelectorAll('canvas[data-sprite]').forEach(function (c) {
      S.paint(c, c.getAttribute('data-sprite'), (c.getAttribute('data-types') || '').split(',').filter(Boolean), c.hasAttribute('data-sil'));
    });
  }
  function isNew(s) { return state.seenBefore != null && s.dex > state.seenBefore; }

  /* ---- real photos ------------------------------------------------------------ */
  /* Model photos live in /tools/planedex/photos/ (CODE.webp is 900x600,
     CODE-s.webp is 192x96), listed with their credits in index.json.
     Airliners also get a live lookup of the exact plane first caught
     (by registration) from Planespotters.net. Their rules: the
     photographer is credited right beside the photo, the photo links to
     its Planespotters page, URLs are used unchanged, and nothing is saved
     anywhere, so it's asked for again on the next visit. */

  function photoOf(code) { return state.photos[code] || null; }
  function photoSrc(code, small) { return PHOTOS + encodeURIComponent(code) + (small ? '-s' : '') + '.webp'; }
  function photoImg(code, alt, lazy) {
    return '<img class="photo-img" src="' + photoSrc(code) + '" width="900" height="600" alt="' + esc(alt || '') + '"'
      + (lazy ? ' loading="lazy"' : '') + ' decoding="async">';
  }
  // List rows and family chains: a small photo once caught, else the sprite or silhouette.
  function thumb(item, caught, cls) {
    if (caught && photoOf(item.code)) {
      return '<img class="thumb ' + cls + '" src="' + photoSrc(item.code, true) + '" width="192" height="96" alt="" loading="lazy" decoding="async">';
    }
    return spriteTag(item.code, item.types, !caught, cls);
  }
  function licenseHTML(p) {
    return p.licenseUrl
      ? '<a href="' + esc(p.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(p.license) + '</a>'
      : esc(p.license);
  }

  // The big picture at the top of an entry: photo if there is one, else the sprite on its sky stage.
  function stageHTML(item, caught, inSheet) {
    var close = inSheet ? '<button class="sheet-close" type="button" data-close aria-label="Close">✕</button>' : '';
    var fresh = caught && isNew(item) ? '<span class="tag-new">NEW!</span>' : '';
    var p = caught && photoOf(item.code);
    if (p) {
      return '<div class="stage photo-stage" data-stage="' + esc(item.code) + '">' + close
        + '<a class="photo-link" href="' + esc(p.source) + '" target="_blank" rel="noopener">' + photoImg(item.code, item.name) + '</a>'
        + fresh + '</div>'
        + '<p class="credit" data-credit="' + esc(item.code) + '"><span aria-hidden="true">📷</span> <a href="' + esc(p.source) + '" target="_blank" rel="noopener">'
        + esc(p.by) + '</a> · ' + licenseHTML(p) + '</p>';
    }
    return '<div class="stage t-' + esc(item.types[0] || 'jet') + (caught ? '' : ' is-missing') + '" data-stage="' + esc(item.code) + '">' + close
      + '<span class="cloud c1"></span><span class="cloud c2"></span>'
      + spriteTag(item.code, item.types, !caught, 'big')
      + '<span class="ground"></span>' + fresh + '</div>';
  }

  function airframe(reg) {
    if (!state.airframes[reg]) {
      state.airframes[reg] = fetch('https://api.planespotters.net/pub/photos/reg/' + encodeURIComponent(reg), { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          var ph = j && j.photos && j.photos[0];
          var t = ph && ph.thumbnail_large;
          if (!t || !t.src || !ph.link) return null;
          return { src: t.src, w: (t.size && t.size.width) | 0, h: (t.size && t.size.height) | 0, link: ph.link, by: ph.photographer || 'Planespotters.net' };
        })
        .catch(function () { return null; });
    }
    return state.airframes[reg];
  }

  // Swap in the photo of the exact plane, once it has loaded, if the entry is still on screen.
  function upgradePhoto(item, root, inSheet) {
    var reg = item.dex && item.first && item.first.reg;
    if (!reg) return;
    airframe(reg).then(function (ph) {
      if (!ph) return;
      var probe = new Image();
      probe.onload = function () {
        var stage = root.querySelector('[data-stage="' + item.code + '"]');
        if (!stage) return;
        var old = root.querySelector('[data-credit="' + item.code + '"]');
        if (old) old.remove();
        var close = inSheet ? '<button class="sheet-close" type="button" data-close aria-label="Close">✕</button>' : '';
        var label = item.first.by + ' ' + reg;
        var tpl = document.createElement('template');
        tpl.innerHTML = '<div class="stage photo-stage is-airframe" data-stage="' + esc(item.code) + '">' + close
          + '<a class="photo-link" href="' + esc(ph.link) + '" target="_blank" rel="noopener">'
          + '<img class="photo-img" src="' + esc(ph.src) + '"' + (ph.w && ph.h ? ' width="' + ph.w + '" height="' + ph.h + '"' : '')
          + ' alt="' + esc(label) + '" decoding="async"></a>'
          + (isNew(item) ? '<span class="tag-new">NEW!</span>' : '') + '</div>'
          + '<p class="credit" data-credit="' + esc(item.code) + '"><b>' + esc(reg) + '</b> · <span aria-hidden="true">📷</span> '
          + '<a href="' + esc(ph.link) + '" target="_blank" rel="noopener">' + esc(ph.by) + '</a> · Planespotters.net</p>';
        stage.replaceWith(tpl.content);
      };
      probe.src = ph.src;
    });
  }

  // Catch of the day: swap in the photo of the exact plane, like its entry does.
  function upgradeCotd(item) {
    airframe(item.first.reg).then(function (ph) {
      if (!ph) return;
      var probe = new Image();
      probe.onload = function () {
        var card = el.today.querySelector('[data-cotd="' + item.code + '"]');
        var stage = card && card.querySelector('.cotd-btn .stage');
        if (!stage || card.querySelector('.credit')) return;
        var tpl = document.createElement('template');
        tpl.innerHTML = '<span class="stage small photo-stage is-airframe"><img class="photo-img" src="' + esc(ph.src) + '"'
          + (ph.w && ph.h ? ' width="' + ph.w + '" height="' + ph.h + '"' : '') + ' alt="" decoding="async"></span>';
        stage.replaceWith(tpl.content);
        card.insertAdjacentHTML('beforeend', '<p class="credit"><b>' + esc(item.first.reg) + '</b> · <span aria-hidden="true">📷</span> '
          + '<a href="' + esc(ph.link) + '" target="_blank" rel="noopener">' + esc(ph.by) + '</a> · Planespotters.net</p>');
      };
      probe.src = ph.src;
    });
  }

  function openCredits() {
    var list = $('pdx-credit-list');
    if (!list.hasChildNodes()) {
      function line(p) {
        return '<li><b>' + esc(p.name) + '</b> <a href="' + esc(p.source) + '" target="_blank" rel="noopener">' + esc(p.by) + '</a> · ' + licenseHTML(p) + '</li>';
      }
      function sorted(obj) {
        return Object.keys(obj).map(function (k) { return obj[k]; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      }
      list.innerHTML = sorted(state.photos).map(line).join('')
        + (Object.keys(state.logos).length ? '<li class="credit-h">Airline logos</li>' + sorted(state.logos).map(line).join('') : '')
        + '<li class="credit-h">Flags</li><li><a href="https://github.com/lipis/flag-icons" target="_blank" rel="noopener">flag-icons</a> · MIT License</li>';
    }
    var dlg = $('pdx-credits');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  /* ---- sound ---------------------------------------------------------------- */

  var Sound = (function () {
    var ctx = null;
    var on = true;
    try { on = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { /* storage off */ }
    function ac() {
      try {
        if (!ctx) {
          var C = window.AudioContext || window.webkitAudioContext;
          if (!C) return null;
          ctx = new C();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      } catch (e) { return null; }
    }
    function tone(freq, at, dur, type, vol) {
      var c = ac();
      if (!c) return;
      try {
        var o = c.createOscillator();
        var g = c.createGain();
        var t = c.currentTime + at;
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(vol || 0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g);
        g.connect(c.destination);
        o.start(t);
        o.stop(t + dur + 0.02);
      } catch (e) { /* audio unavailable */ }
    }
    return {
      get on() { return on; },
      context: ac,
      // The two-note cabin chime before the captain talks. It plays even with
      // sound effects off, since pressing play asked for sound.
      chime: function () { tone(659, 0, 1.1, 'sine', 0.12); tone(523, 0.5, 1.4, 'sine', 0.12); },
      blip: function () { if (on) tone(880, 0, 0.045); },
      select: function () { if (on) { tone(660, 0, 0.05); tone(990, 0.05, 0.08); } },
      jingle: function () {
        if (!on) return;
        [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.12); });
        tone(1319, 0.38, 0.32, 'triangle', 0.06);
      },
      toggle: function () {
        on = !on;
        try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { /* storage off */ }
        return on;
      }
    };
  })();

  /* ---- the captain's readout ------------------------------------------------- */
  /* The morning-report task makes each day's MP3 with ElevenLabs and stores
     it with the API. It plays through Web Audio, which the click unlocks,
     so it works on phones without an <audio> element. */

  var Voice = (function () {
    var btn = null, src = null, label = '';
    function idle() {
      if (src) { try { src.onended = null; src.stop(); } catch (e) { /* already stopped */ } }
      src = null;
      if (btn) { btn.textContent = label; btn.disabled = false; btn.classList.remove('playing'); btn.removeAttribute('aria-pressed'); }
      btn = null;
    }
    function fail(b, msg) {
      if (btn !== b) return;
      idle();
      var keep = b.textContent;
      b.textContent = msg;
      b.disabled = true;
      setTimeout(function () { b.textContent = keep; b.disabled = false; }, 4000);
    }
    function decode(ctx, buf) {
      return new Promise(function (ok, bad) {
        var p = ctx.decodeAudioData(buf, ok, bad);
        if (p && p.then) p.then(ok, bad);
      });
    }
    function play(b) {
      if (btn === b) { idle(); return; }  // a second press stops it
      idle();
      var ctx = Sound.context();          // unlock audio inside the click
      if (!ctx) { b.textContent = 'No sound on this device'; return; }
      btn = b;
      label = b.textContent;
      b.textContent = 'Calling the flight deck…';
      b.disabled = true;
      fetch(API + '?voice=' + encodeURIComponent(b.getAttribute('data-day')) + '&v=' + encodeURIComponent(b.getAttribute('data-v') || ''))
        .then(function (r) {
          if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error || 'The radio is quiet. Try later'); });
          return r.arrayBuffer();
        })
        .then(function (buf) { return decode(ctx, buf); })
        .then(function (audio) {
          if (btn !== b) return;
          src = ctx.createBufferSource();
          src.buffer = audio;
          src.connect(ctx.destination);
          src.onended = function () { if (btn === b) idle(); };
          Sound.chime();
          src.start(ctx.currentTime + 1.6);
          b.disabled = false;
          b.classList.add('playing');
          b.setAttribute('aria-pressed', 'true');
          b.textContent = '■ Stop';
        })
        .catch(function (e) { fail(b, (e && e.message && e.message.length < 60) ? e.message : 'The radio is quiet. Try later'); });
    }
    return { play: play, stop: idle };
  })();

  function voiceButton(day, at, cls, text) {
    return '<button class="voice-btn' + (cls ? ' ' + cls : '') + '" type="button" data-day="' + esc(day) + '" data-v="' + esc(at || '') + '">' + esc(text) + '</button>';
  }

  /* ---- header -------------------------------------------------------------- */

  function renderHeader(d) {
    el.station.textContent = 'Catching planes with my boys' + (d.since ? ' since ' + longDate(d.since) : '');
    var L = d.level;
    el.lv.textContent = L.level;
    el.lvTitle.textContent = L.title;
    var maxed = L.max && L.level >= L.max;
    el.xp.max = maxed ? 1 : Math.max(1, L.next - L.prev);
    el.xp.value = maxed ? 1 : Math.max(0, L.xp - L.prev);
    el.xpText.textContent = maxed ? num(L.xp) + ' XP · MAX LEVEL!' : num(L.xp) + ' XP · ' + num(L.next - L.xp) + ' to LV ' + (L.level + 1);
    el.level.hidden = false;
    var t = d.totals;
    var known = t.known || t.species;
    el.stats.innerHTML = [
      ['Species', num(t.species) + '<small>/' + num(known) + '</small>'],
      ['Planes', num(t.planes)],
      ['Airlines', num(t.airlines)],
      ['Countries', num(t.countries)],
      ['Badges', num(t.badges) + '<small>/' + num(t.badgesTotal) + '</small>']
    ].map(function (c) { return '<div><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></div>'; }).join('');
    el.stats.hidden = false;
    $('n-dex').textContent = t.species;
    $('n-wanted').textContent = d.wanted.filter(function (w) { return !w.caught; }).length;
    $('n-badges').textContent = t.badges + '/' + t.badgesTotal;
    updateClock();
  }

  function updateClock() {
    var d = state.data;
    if (!d) return;
    el.updated.textContent = 'Updated ' + ago(d.generated);
  }

  /* ---- morning report ------------------------------------------------------------ */
  /* Written once a day, just before 6 a.m., about the day before. Shown
     at the top of the Dex in a dialog box that types itself out the first
     time; tap it to finish. Folding it away lasts until the next report. */

  function store(key, value) {
    try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) { /* storage off */ }
  }
  function stored(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function renderReport(d) {
    var r = d.report;
    var box = el.report;
    var fresh = r && r.text && r.day && (r.day === addDays(d.today.date, -1) || r.day === d.today.date);
    if (!fresh) { box.hidden = true; state.reportShown = null; return; }
    var key = r.day + '|' + (r.at || '') + '|' + (r.voice ? 1 : 0);  // redraw when its readout arrives
    if (state.reportShown === key) return;
    state.reportShown = key;
    state.logbook = null;
    $('report-date').textContent = weekday(r.day) + ' · ' + fmtDay(r.day);
    Voice.stop();
    $('report-voice').innerHTML = r.voice ? voiceButton(r.day, r.at, '', "▶ Captain's readout") : '';
    var paras = String(r.text).split(/\n\s*\n/).map(function (t) { return t.trim(); }).filter(Boolean);
    var body = el.reportText;
    body.innerHTML = '';
    var nodes = paras.map(function () { return body.appendChild(document.createElement('p')); });
    box.open = stored(REPORT_FOLD_KEY) !== r.day;
    box.hidden = false;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function finish() {
      nodes.forEach(function (n, i) { n.textContent = paras[i]; });
      body.classList.remove('typing');
      store(REPORT_READ_KEY, r.day);
    }
    if (reduce || !box.open || stored(REPORT_READ_KEY) === r.day) { finish(); return; }

    // Type it out, a few letters per frame, like an old game's dialog box.
    var pi = 0, ci = 0, timer = null;
    body.classList.add('typing');
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      body.removeEventListener('click', stop);
      finish();
    }
    body.addEventListener('click', stop);
    timer = setInterval(function () {
      if (pi >= paras.length) { stop(); return; }
      ci = Math.min(paras[pi].length, ci + 3);
      nodes[pi].textContent = paras[pi].slice(0, ci);
      if (ci >= paras[pi].length) { pi += 1; ci = 0; }
    }, 18);
  }

  /* ---- the dex ----------------------------------------------------------------- */

  function lookup(code) { return state.byCode[code] || state.missingByCode[code] || null; }

  function entryHTML(item, inSheet) {
    var caught = !!item.dex;
    var d = state.data;
    var fam = d.families.filter(function (f) {
      return f.members.some(function (m) { return m.code === item.code; });
    })[0];
    var name = caught ? item.name : '?????';
    var html = stageHTML(item, caught, inSheet)
      + '<div class="plate"><span class="plate-no">' + no(item.dex) + '</span>'
      + '<h2 class="plate-name" id="' + (inSheet ? 'pdx-detail-title' : 'entry-title') + '">' + esc(name) + '</h2></div>'
      + '<div class="entry-meta">' + typeChips(item.types) + stars(item.rarity) + '</div>';
    if (caught) {
      html += '<div class="textbox"><p>' + esc(item.fact || (item.name + ' is in your Planedex.')) + '</p></div>'
        + '<dl class="readout">'
        + '<div><dt>Caught</dt><dd>' + plural(item.count, 'plane', 'planes') + '</dd></div>'
        + '<div><dt>First seen</dt><dd>' + esc(fmtWhen(item.first.when)) + '</dd></div>'
        + '<div><dt>First one</dt><dd>' + esc(item.first.by) + (item.first.reg ? ' <small>' + esc(item.first.reg) + '</small>' : '') + '</dd></div>'
        + (item.top ? '<div><dt>Highest</dt><dd>' + num(item.top) + ' ft</dd></div>' : '')
        + '</dl>';
    } else {
      html += '<div class="textbox"><p><b>Hint:</b> ' + esc(item.fact || 'Keep watching the sky.') + '</p></div>';
    }
    if (fam) html += '<div class="entry-fam"><p class="mini-h">' + esc(fam.name.replace(/ family$/i, '')) + ' family · '
      + fam.members.filter(function (m) { return m.caught; }).length + '/' + fam.members.length + '</p>' + chain(fam.members, item.code) + '</div>';
    return html;
  }

  function showEntry(code, fromUser) {
    var item = lookup(code);
    if (!item) return;
    state.sel = code;
    el.list.querySelectorAll('.row[aria-current]').forEach(function (r) { r.removeAttribute('aria-current'); });
    var row = el.list.querySelector('.row[data-code="' + code + '"]');
    if (row) row.setAttribute('aria-current', 'true');
    if (NARROW.matches && fromUser) {
      openSheet(item);
    } else {
      el.entry.innerHTML = entryHTML(item, false);
      paintSprites(el.entry);
      upgradePhoto(item, el.entry, false);
    }
    if (fromUser) Sound.blip();
  }

  function openSheet(item) {
    el.sheetBody.innerHTML = entryHTML(item, true);
    paintSprites(el.sheetBody);
    upgradePhoto(item, el.sheetBody, true);
    if (!el.sheet.open) {
      if (typeof el.sheet.showModal === 'function') el.sheet.showModal();
      else el.sheet.setAttribute('open', '');
    }
    el.sheetBody.scrollTop = 0;
  }
  function closeSheet() { if (el.sheet.open) el.sheet.close(); }

  function buildDexControls(d) {
    var counts = [0, 0, 0, 0, 0, 0];
    d.species.forEach(function (s) { counts[s.rarity] += 1; });
    var chips = ['<button class="chip" type="button" data-rarity="0" aria-pressed="' + (state.rarity === 0) + '">All</button>'];
    for (var r = 5; r >= 1; r--) {
      chips.push('<button class="chip r' + r + '" type="button" data-rarity="' + r + '" aria-pressed="' + (state.rarity === r) + '" title="' + esc(rarityName(r)) + '">'
        + '<span class="st-full" aria-hidden="true">' + '★'.repeat(r) + '</span><span class="st-short" aria-hidden="true">' + r + '★</span>'
        + '<span class="visually-hidden">' + esc(rarityName(r)) + '</span></button>');
    }
    el.rarity.innerHTML = chips.join('');
    var present = {};
    d.species.concat(d.missing || []).forEach(function (s) { s.types.forEach(function (t) { present[t] = 1; }); });
    el.type.innerHTML = '<option value="all">All types</option>' + Object.keys(d.types).filter(function (t) { return present[t]; })
      .map(function (t) { return '<option value="' + esc(t) + '">' + esc(d.types[t]) + '</option>'; }).join('');
    if (state.type !== 'all' && !present[state.type]) state.type = 'all';
    el.type.value = state.type;
  }

  function renderList() {
    var d = state.data;
    var q = state.q.trim().toLowerCase();
    function keep(s) {
      if (state.rarity && s.rarity !== state.rarity) return false;
      if (state.type !== 'all' && s.types.indexOf(state.type) < 0) return false;
      return true;
    }
    var caught = d.species.filter(function (s) {
      if (!keep(s)) return false;
      if (q && (s.code + ' ' + s.name + ' ' + s.first.by + ' ' + (s.first.reg || '')).toLowerCase().indexOf(q) < 0) return false;
      return state.show !== 'missing';
    });
    var sorters = {
      dex: function (a, b) { return a.dex - b.dex; },
      rarity: function (a, b) { return b.rarity - a.rarity || a.count - b.count || a.dex - b.dex; },
      count: function (a, b) { return b.count - a.count || a.dex - b.dex; },
      newest: function (a, b) { return b.dex - a.dex; },
      name: function (a, b) { return a.name.localeCompare(b.name); }
    };
    caught.sort(sorters[state.sort] || sorters.dex);
    var missing = q || state.show === 'caught' ? [] : (d.missing || []).filter(keep);

    var rows = caught.map(function (s) {
      return '<li><button class="row r' + s.rarity + '" type="button" data-code="' + esc(s.code) + '">'
        + '<span class="cur" aria-hidden="true">▶</span>'
        + '<span class="row-no">' + pad3(s.dex) + '</span>'
        + thumb(s, true, 'mini')
        + '<span class="row-name">' + esc(s.name) + (isNew(s) ? ' <span class="tag-new">NEW</span>' : '') + '</span>'
        + '<span class="row-r" aria-hidden="true">' + '★'.repeat(s.rarity) + '</span>'
        + '</button></li>';
    }).concat(missing.map(function (m) {
      return '<li><button class="row missing" type="button" data-code="' + esc(m.code) + '" aria-label="Not caught yet: ' + esc(rarityName(m.rarity)) + ' ' + esc(m.types.join(' ')) + '">'
        + '<span class="cur" aria-hidden="true">▶</span>'
        + '<span class="row-no">???</span>'
        + spriteTag(m.code, m.types, true, 'mini')
        + '<span class="row-name">?????</span>'
        + '<span class="row-r" aria-hidden="true">' + '★'.repeat(m.rarity) + '</span>'
        + '</button></li>';
    }));
    el.list.innerHTML = rows.length ? rows.join('') : '<li class="empty">No match.</li>';
    paintSprites(el.list);
    el.shown.textContent = num(d.species.length) + ' caught · ' + num((d.missing || []).length) + ' still out there';
    var target = state.sel && el.list.querySelector('.row[data-code="' + state.sel + '"]');
    if (!target) {
      var first = el.list.querySelector('.row');
      if (first) showEntry(first.getAttribute('data-code'), false);
    } else {
      target.setAttribute('aria-current', 'true');
    }
  }

  /* ---- today ------------------------------------------------------------------- */

  function renderToday(d) {
    var t = d.today;
    var missions = t.quests.map(function (q) {
      return '<li class="mission' + (q.done ? ' done' : '') + '">'
        + '<span class="box-check" aria-hidden="true">' + (q.done ? '✓' : '') + '</span>'
        + '<div class="m-main"><p>' + (q.done ? '<span class="visually-hidden">Done: </span>' : '')
        + (q.tier ? '<span class="tier t-' + esc(q.tier) + '">' + esc(q.tier === 'medium' ? 'Med' : q.tier) + '</span> ' : '') + esc(q.text) + '</p>'
        + '<progress max="' + q.need + '" value="' + Math.min(q.have, q.need) + '" aria-label="' + esc(q.text) + '"></progress></div>'
        + '<div class="m-side"><span class="m-count">' + num(Math.min(q.have, q.need)) + '/' + num(q.need) + '</span><span class="xp-tag">+' + q.xp + ' XP</span></div></li>';
    }).join('');
    var done = t.quests.filter(function (q) { return q.done; }).length;

    var cotd = '';
    var s = t.catch && state.byCode[t.catch.code];
    if (s) {
      var pic = photoOf(s.code)
        ? '<span class="stage small photo-stage">' + photoImg(s.code, '', true) + '</span>'
        : '<span class="stage small t-' + esc(s.types[0]) + '"><span class="cloud c1"></span>' + spriteTag(s.code, s.types, false, 'big') + '<span class="ground"></span></span>';
      cotd = '<div class="win cotd" data-cotd="' + esc(s.code) + '"><p class="win-title">Catch of the day' + (t.catch.isNew ? ' <span class="tag-new">NEW!</span>' : '') + '</p>'
        + '<button class="cotd-btn" type="button" data-goto="' + esc(s.code) + '">' + pic
        + '<span class="cotd-name"><span class="plate-no">' + no(s.dex) + '</span> ' + esc(s.name) + '</span>'
        + '<span class="cotd-meta">' + typeChips(s.types) + stars(s.rarity) + '</span></button></div>';
    }

    var log = [];
    var lastDay = null;
    d.log.slice(0, 18).forEach(function (e) {
      var p = parseKey(e.when);
      if (!p) return;
      if (p.day !== lastDay) { log.push('<li class="log-day">' + esc(dayLabel(p.day)) + '</li>'); lastDay = p.day; }
      var tag, text;
      if (e.kind === 'species') {
        var sp = state.byCode[e.code];
        if (!sp) return;
        tag = '<span class="lt lt-new">NEW</span>';
        text = '<button class="link" type="button" data-goto="' + esc(sp.code) + '">' + no(sp.dex) + ' ' + esc(sp.name) + '</button>';
      } else if (e.kind === 'badge') {
        tag = '<span class="lt lt-badge">BADGE</span>';
        text = '<button class="link" type="button" data-tab="badges">' + esc(e.name) + '</button>';
      } else {
        tag = '<span class="lt lt-stamp">STAMP</span>';
        text = '<button class="link" type="button" data-tab="passport">' + esc(e.name) + '</button>';
      }
      log.push('<li class="log-line"><span class="log-t">' + esc(p.h == null ? '' : fmtHour(p.h)) + '</span>' + tag + '<span class="log-x">' + text + '</span></li>');
    });

    el.today.innerHTML = '<div class="today-grid"><div class="today-col">'
      + '<div class="win"><p class="win-title">Daily missions <span class="win-sub">' + done + '/' + t.quests.length + ' done</span></p>'
      + '<ul class="missions">' + missions + '</ul></div>'
      + cotd
      + '<p class="today-line"><b>' + num(t.planes) + '</b> planes today' + (t.newSpecies ? ' · <b>' + num(t.newSpecies) + '</b> new' : '') + '</p>'
      + '</div><div class="win radio"><p class="win-title">Radio log</p><ul class="log">' + log.join('') + '</ul></div></div>';
    paintSprites(el.today);
    if (s && s.first && s.first.reg) upgradeCotd(s);
  }

  /* ---- wanted posters ------------------------------------------------------------ */

  function renderWanted(d) {
    var left = d.wanted.filter(function (w) { return !w.caught; }).length;
    el.wanted.innerHTML = '<div class="win intro"><p class="win-title">Most wanted <span class="win-sub">' + num(left) + ' left</span></p></div>'
      + '<div class="posters">' + d.wanted.map(function (w) {
        var sp = w.caught && state.byCode[w.code];
        var pic = photoOf(w.code)
          ? '<span class="stage poster-stage photo-stage">' + photoImg(w.code, w.name, true) + '</span>'
          : '<span class="stage poster-stage">' + spriteTag(w.code, w.types, !sp, 'big') + '</span>';
        return '<div class="poster' + (sp ? ' got' : '') + '">'
          + '<p class="poster-h">WANTED</p>' + pic
          + '<p class="poster-name">' + esc(w.name) + '</p>'
          + stars(w.rarity)
          + '<p class="poster-hint">' + esc(w.fact || '') + '</p>'
          + '<p class="poster-reward">REWARD +' + RARITY_XP[w.rarity] + ' XP</p>'
          + (sp ? '<button class="stamp-got" type="button" data-goto="' + esc(w.code) + '">CAUGHT! ' + no(sp.dex) + '</button>' : '')
          + '</div>';
      }).join('') + '</div>';
    paintSprites(el.wanted);
  }

  /* ---- families --------------------------------------------------------------------- */

  function chain(members, current) {
    return '<ol class="chain">' + members.map(function (m) {
      var sp = m.caught && state.byCode[m.code];
      var meta = sp || state.missingByCode[m.code] || { types: ['jet'] };
      var label = m.name + (sp ? ', caught' : ', not caught yet');
      var inner = thumb({ code: m.code, types: meta.types }, !!sp, 'chain-sprite') + '<span class="node-code">' + esc(m.code) + '</span>';
      var cls = 'node' + (sp ? '' : ' missing') + (m.code === current ? ' is-current' : '');
      return '<li><button class="' + cls + '" type="button" data-goto="' + esc(m.code) + '" aria-label="' + esc(label) + '">' + inner + '</button></li>';
    }).join('') + '</ol>';
  }

  function renderFamilies(d) {
    var done = d.families.filter(function (f) { return f.done; }).length;
    var order = d.families.slice().sort(function (a, b) {
      function frac(f) { return f.members.filter(function (m) { return m.caught; }).length / f.members.length; }
      return (b.done - a.done) || (frac(b) - frac(a)) || a.name.localeCompare(b.name);
    });
    el.families.innerHTML = '<div class="win intro"><p class="win-title">Families <span class="win-sub">' + done + '/' + d.families.length + ' complete</span></p></div>'
      + '<div class="fam-grid">' + order.map(function (f) {
        var have = f.members.filter(function (m) { return m.caught; }).length;
        return '<div class="win fam' + (f.done ? ' done' : '') + '"><p class="fam-h"><span>' + esc(f.name) + '</span>'
          + (f.done ? '<span class="done-tag">COMPLETE</span>' : '<span class="fam-n">' + have + '/' + f.members.length + '</span>') + '</p>'
          + chain(f.members) + '</div>';
      }).join('') + '</div>';
    paintSprites(el.families);
  }

  /* ---- badges ---------------------------------------------------------------------------- */

  function renderBadges(d) {
    var ladders = d.badges.filter(function (b) { return b.kind === 'ladder'; });
    var singles = d.badges.filter(function (b) { return b.kind !== 'ladder' && !b.secret; });
    var secrets = d.badges.filter(function (b) { return b.kind !== 'ladder' && b.secret; });
    var MEDALS = ['bronze', 'silver', 'gold', 'platinum', 'platinum'];
    function amount(b, n) { return b.unit === 'ft' ? num(n) + ' ft' : (b.lower ? String(n) : num(n)); }

    function artTag(b, look, metal, ribbon) {
      var a = BA ? BA.art(b.id) : ['star'];
      return '<canvas class="badge-art" width="40" height="34" aria-hidden="true" data-look="' + look + '" data-icon="' + esc(a[0]) + '"'
        + (a[1] ? ' data-tint="' + esc(a[1]) + '"' : '') + ' data-metal="' + esc(metal) + '"'
        + (ribbon != null ? ' data-ribbon="' + ribbon + '"' : '') + '></canvas>';
    }
    function ladderTile(b, i) {
      var got = b.earned.filter(Boolean).length;
      var next = b.tiers[got];
      var last = got ? b.earned[got - 1] : null;
      var pips = b.tiers.map(function (t, i) {
        return '<span class="pip' + (b.earned[i] ? ' on ' + MEDALS[i] : '') + '" title="' + esc(ROMAN[i] + ': ' + b.how.replace('{n}', amount(b, t))) + '"></span>';
      }).join('');
      var prog;
      if (next == null) {
        prog = '<p class="medal-when">All ' + b.tiers.length + ' tiers done!</p>';
      } else if (b.lower) {
        prog = '<p class="medal-prog">' + (b.value ? 'Oldest so far: ' + b.value : 'None yet') + '</p>';
      } else {
        prog = '<progress max="' + next + '" value="' + Math.min(b.value || 0, next) + '" aria-label="' + esc(b.name) + ' progress"></progress>'
          + '<p class="medal-prog">' + amount(b, Math.min(b.value || 0, next)) + ' / ' + amount(b, next) + '</p>';
      }
      return '<div class="medal ladder' + (got ? ' ' + MEDALS[got - 1] : ' locked') + '">'
        + artTag(b, 'medal', got ? MEDALS[got - 1] : 'steel', i)
        + '<p class="medal-name">' + esc(b.name) + (got ? ' ' + ROMAN[got - 1] : '') + '</p>'
        + '<p class="pips" role="img" aria-label="' + got + ' of ' + b.tiers.length + ' tiers">' + pips + '</p>'
        + '<p class="medal-how">' + esc(next == null ? b.how.replace('{n}', amount(b, b.tiers[b.tiers.length - 1])) : b.how.replace('{n}', amount(b, next))) + '</p>'
        + prog + (last && next != null ? '<p class="medal-when">' + ROMAN[got - 1] + ' earned ' + esc(fmtDay(last)) + '</p>' : '')
        + '</div>';
    }
    function tile(b) {
      var look = b.secret ? (b.earned ? 'star' : 'mystery') : 'wings';
      return '<div class="medal' + (b.earned ? ' ' + esc(b.medal) : ' locked') + (b.secret && !b.earned ? ' secret' : '') + '">'
        + artTag(b, look, b.earned ? b.medal : 'steel', null)
        + '<p class="medal-name">' + esc(b.name) + '</p><p class="medal-how">' + esc(b.how) + '</p>'
        + (b.earned ? '<p class="medal-when">Earned ' + esc(fmtDay(b.earned)) + '</p>' : '<p class="medal-prog">+' + num(b.xp) + ' XP</p>')
        + '</div>';
    }
    function byEarned(list) {
      return list.filter(function (b) { return b.earned; }).concat(list.filter(function (b) { return !b.earned; }));
    }
    var t = d.totals;
    el.badges.innerHTML = '<div class="win intro"><p class="win-title">Badges <span class="win-sub">' + num(t.badges) + '/' + num(t.badgesTotal) + '</span></p></div>'
      + '<h2 class="sec-h">Collections</h2><div class="medals">' + ladders.map(ladderTile).join('') + '</div>'
      + '<h2 class="sec-h">Achievements</h2><div class="medals">' + byEarned(singles).map(tile).join('') + '</div>'
      + '<h2 class="sec-h">Secret</h2><div class="medals">' + byEarned(secrets).map(tile).join('') + '</div>';
    if (BA) el.badges.querySelectorAll('canvas.badge-art').forEach(function (c) { BA.paint(c); });
  }

  /* ---- passport ---------------------------------------------------------------------------- */

  function flag(code, big) {
    return '<img class="flag' + (big ? ' big' : '') + '" src="' + FLAGS + esc(String(code).toLowerCase()) + '.webp' + FLAGS_V + '" width="'
      + (big ? 48 : 24) + '" height="' + (big ? 36 : 18) + '" alt="" loading="lazy" decoding="async">';
  }
  // Airline stickers: the logo when there's a free one, else the code on a colored sticker.
  function airlineBadge(a) {
    var logo = state.logos[a.code];
    if (logo) return '<span class="sk-logo' + (logo.dark ? ' dark' : '') + '"><img src="' + LOGOS + esc(logo.file) + '" alt="" loading="lazy" decoding="async"></span>';
    var h = 0;
    for (var i = 0; i < a.code.length; i++) h = (h * 31 + a.code.charCodeAt(i)) % 12;
    return '<span class="sk-code c' + h + '">' + esc(a.code) + '</span>';
  }
  function renderPassport(d) {
    var names = {};
    d.countries.forEach(function (c) { names[c.code] = c.name; });
    el.passport.innerHTML = '<div class="win intro"><p class="win-title">Passport <span class="win-sub">'
      + plural(d.countries.length, 'country', 'countries') + ' · ' + plural(d.airlines.length, 'airline', 'airlines') + '</span></p></div>'
      + '<div class="win"><p class="win-title">Countries</p><ul class="places">' + d.countries.map(function (c) {
        return '<li class="place">' + flag(c.code, true) + '<span class="sk-n pl-n">×' + num(c.count) + '</span>'
          + '<span class="pl-name">' + esc(c.name) + '</span><span class="pl-first">first ' + esc(fmtDay(c.first)) + '</span></li>';
      }).join('') + '</ul></div>'
      + '<div class="win"><p class="win-title">Airline stickers</p><ul class="stickers">' + d.airlines.map(function (a) {
        return '<li class="sticker">' + airlineBadge(a) + '<span class="sk-name">' + esc(a.name)
          + '<small>' + flag(a.country) + ' first ' + esc(fmtDay(a.first)) + '</small></span><span class="sk-n">×' + num(a.count) + '</span></li>';
      }).join('') + '</ul></div>';
  }

  /* ---- logbook --------------------------------------------------------------------------------- */
  /* Every morning report so far, newest first: a little diary of the
     spotting adventure. Loaded the first time the tab is opened. */

  function renderLogbook() {
    var box = el.logbook;
    if (state.logbook == null) {
      box.innerHTML = '<p class="status-msg">Opening the logbook…</p>';
      state.logbook = [];
      fetch(API + '?logbook', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : { reports: [] }; })
        .catch(function () { return { reports: [] }; })
        .then(function (j) { state.logbook = (j && j.reports) || []; drawLogbook(); });
      return;
    }
    drawLogbook();
  }
  function drawLogbook() {
    var list = state.logbook || [];
    el.logbook.innerHTML = '<div class="win intro"><p class="win-title">Logbook <span class="win-sub">'
      + plural(list.length, 'report', 'reports') + '</span></p></div>'
      + (list.length ? '<ol class="logbook">' + list.map(function (r) {
        var paras = String(r.text || '').split(/\n\s*\n/).map(function (t) { return '<p>' + esc(t.trim()) + '</p>'; }).join('');
        return '<li class="win lb-entry"><p class="win-title">' + esc(weekday(r.day) + ' · ' + longDate(r.day)) + '</p><div class="textbox">' + paras + '</div>'
          + (r.voice ? voiceButton(r.day, r.at, 'small', '▶ Hear it') : '') + '</li>';
      }).join('') + '</ol>' : '<p class="status-msg">The first report shows up tomorrow morning.</p>');
  }

  /* ---- new-catch reveal ------------------------------------------------------------------- */

  function queueReveal(d) {
    if (state.seenBefore == null) return;
    var fresh = d.species.filter(function (s) { return s.dex > state.seenBefore; });
    if (!fresh.length) return;
    fresh.sort(function (a, b) { return b.rarity - a.rarity || a.dex - b.dex; });
    state.reveal = fresh.slice(0, 5);
    state.revealExtra = fresh.length - state.reveal.length;
    state.revealAt = 0;
    showReveal();
  }

  function showReveal() {
    var s = state.reveal[state.revealAt];
    if (!s) { closeReveal(); return; }
    var last = state.revealAt === state.reveal.length - 1;
    var more = last && state.revealExtra > 0 ? ' And ' + plural(state.revealExtra, 'more new species', 'more new species') + ' in the Dex.' : '';
    var sparkles = '<span class="sparkle s1"></span><span class="sparkle s2"></span><span class="sparkle s3"></span>';
    var pic = photoOf(s.code)
      ? '<div class="stage reveal-stage photo-stage">' + photoImg(s.code, s.name) + sparkles + '</div>'
      : '<div class="stage reveal-stage t-' + esc(s.types[0]) + '"><span class="cloud c1"></span><span class="cloud c2"></span>' + spriteTag(s.code, s.types, false, 'big') + '<span class="ground"></span>' + sparkles + '</div>';
    el.reveal.innerHTML = '<div class="reveal-rays" aria-hidden="true"></div>'
      + '<div class="reveal-card">'
      + '<p class="reveal-kicker" id="reveal-title">NEW CATCH!</p>'
      + pic
      + '<p class="reveal-name"><span class="plate-no">' + no(s.dex) + '</span> ' + esc(s.name) + '</p>'
      + '<div class="entry-meta center">' + typeChips(s.types) + stars(s.rarity) + '</div>'
      + '<div class="textbox"><p>' + esc(s.name) + ' joined your Planedex! +' + RARITY_XP[s.rarity] + ' XP.' + esc(more) + '</p></div>'
      + '<div class="reveal-btns"><button class="btn primary" type="button" id="reveal-next">' + (last ? 'Awesome!' : 'Next (' + (state.revealAt + 1) + '/' + state.reveal.length + ')') + '</button>'
      + (last ? '' : '<button class="btn" type="button" id="reveal-skip">Skip</button>') + '</div>'
      + '</div>';
    el.reveal.hidden = false;
    document.body.classList.add('no-scroll');
    paintSprites(el.reveal);
    var next = $('reveal-next');
    next.focus();
    next.addEventListener('click', function () {
      Sound.jingle();
      state.revealAt += 1;
      if (state.revealAt >= state.reveal.length) closeReveal(s.code);
      else showReveal();
    });
    var skip = $('reveal-skip');
    if (skip) skip.addEventListener('click', function () { Sound.blip(); closeReveal(s.code); });
  }

  function closeReveal(code) {
    el.reveal.hidden = true;
    el.reveal.innerHTML = '';
    document.body.classList.remove('no-scroll');
    if (code) { selectTab('dex'); showEntry(code, false); }
  }

  /* ---- tabs ------------------------------------------------------------------------------------ */

  function selectTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'dex';
    state.tab = name;
    TABS.forEach(function (t) {
      var tab = $('tab-' + t);
      var on = t === name;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      $('panel-' + t).hidden = !on || !state.data;
    });
    if (focus) $('tab-' + name).focus();
    if (name === 'logbook' && state.data) renderLogbook();
    try { history.replaceState(null, '', name === 'dex' ? location.pathname : '#' + name); } catch (e) { /* not fatal */ }
  }

  function goto(code) {
    closeSheet();
    selectTab('dex');
    showEntry(code, NARROW.matches);
    var row = el.list.querySelector('.row[data-code="' + code + '"]');
    if (row && !NARROW.matches) row.scrollIntoView({ block: 'nearest' });
    if (!NARROW.matches) window.scrollTo({ top: 0 });
  }

  /* ---- loading ------------------------------------------------------------------------------------ */

  function trackSeen(d) {
    var maxDex = d.species.length;
    var first = state.seenBefore == null;
    if (first) {
      var stored = null;
      try { stored = localStorage.getItem(SEEN_KEY); } catch (e) { /* storage off */ }
      var prev = stored == null ? NaN : parseInt(stored, 10);
      state.seenBefore = isNaN(prev) ? maxDex : Math.min(prev, maxDex);
    }
    try { localStorage.setItem(SEEN_KEY, String(maxDex)); } catch (e) { /* storage off */ }
    return first;
  }

  function renderAll() {
    var d = state.data;
    state.byCode = {};
    state.missingByCode = {};
    d.species.forEach(function (s) { state.byCode[s.code] = s; });
    (d.missing || []).forEach(function (m) { state.missingByCode[m.code] = m; });
    if (!state.sel || !lookup(state.sel)) {
      var c = d.today.catch;
      state.sel = c && state.byCode[c.code] ? c.code : (d.species[0] && d.species[0].code);
    }
    renderHeader(d);
    buildDexControls(d);
    renderList();
    showEntry(state.sel, false);
    renderToday(d);
    renderWanted(d);
    renderFamilies(d);
    renderBadges(d);
    renderPassport(d);
    renderReport(d);
    el.status.textContent = '';
    selectTab(state.tab);
  }

  // The photo list is a static file; fetched once, and the game works without it.
  var photosReady = null;
  function loadPhotos() {
    if (!photosReady) {
      photosReady = fetch(PHOTOS + 'index.json', { cache: 'no-cache', headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (j) { state.photos = j && typeof j === 'object' ? j : {}; });
    }
    return photosReady;
  }

  var logosReady = null;
  function loadLogos() {
    if (!logosReady) {
      logosReady = fetch(LOGOS + 'index.json', { cache: 'no-cache', headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (j) { state.logos = j && typeof j === 'object' ? j : {}; });
    }
    return logosReady;
  }

  function load() {
    state.loadedAt = Date.now();
    var data = fetch(API, { cache: 'no-store', headers: { accept: 'application/json' } })
      .then(function (res) {
        if (res.status === 404) throw new Error('empty');
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      });
    return Promise.all([data, loadPhotos(), loadLogos()])
      .then(function (both) {
        var d = both[0];
        if (!d || d.v !== 1 || !Array.isArray(d.species)) throw new Error('format');
        state.data = d;
        var firstLoad = trackSeen(d);
        renderAll();
        if (firstLoad) queueReveal(d);
      })
      .catch(function (err) {
        if (state.data) return;
        el.status.textContent = err && err.message === 'empty' ? 'No catches yet.' : "Can't reach the station. Try again soon.";
      });
  }

  /* ---- theme & sound buttons ------------------------------------------------------------------------- */

  function setupButtons() {
    var root = document.documentElement;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var theme = $('pdx-theme');
    function current() {
      var t = root.dataset.theme;
      if (t === 'dark' || t === 'light') return t;
      return mq && mq.matches ? 'dark' : 'light';
    }
    function syncTheme() { theme.setAttribute('aria-pressed', current() === 'dark' ? 'true' : 'false'); }
    theme.hidden = false;
    syncTheme();
    theme.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* storage off */ }
      syncTheme();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', syncTheme);

    var sound = $('pdx-sound');
    function syncSound() {
      sound.setAttribute('aria-pressed', Sound.on ? 'true' : 'false');
      sound.querySelector('.lbl').textContent = Sound.on ? 'Sound on' : 'Sound off';
    }
    sound.hidden = false;
    syncSound();
    sound.addEventListener('click', function () { Sound.toggle(); syncSound(); Sound.select(); });
  }

  /* ---- start ---------------------------------------------------------------------------------------------- */

  function start() {
    el = {
      station: $('pdx-station'), level: $('pdx-level'), lv: $('pdx-lv'), lvTitle: $('pdx-lv-title'),
      xp: $('pdx-xp'), xpText: $('pdx-xp-text'), stats: $('pdx-stats'), status: $('pdx-status'),
      entry: $('dex-entry'), list: $('dex-list'), shown: $('dex-shown'), rarity: $('dex-rarity'),
      type: $('dex-type'), sort: $('dex-sort'), show: $('dex-show'), q: $('dex-q'),
      today: $('panel-today'), wanted: $('panel-wanted'), families: $('panel-families'),
      badges: $('panel-badges'), passport: $('panel-passport'),
      sheet: $('pdx-detail'), sheetBody: $('pdx-detail-body'), reveal: $('pdx-reveal'), updated: $('pdx-updated'),
      report: $('pdx-report'), reportText: $('report-text'), logbook: $('panel-logbook')
    };
    setupButtons();
    if (S) S.paint($('pdx-flyby'), 'B738', ['jet'], false);
    if (TABS.indexOf(location.hash.slice(1)) >= 0) state.tab = location.hash.slice(1);

    document.addEventListener('click', function (e) {
      var v = e.target.closest('.voice-btn');
      if (v) { Voice.play(v); return; }
      var t = e.target.closest('[data-code], [data-goto], [data-tab], [data-close], [data-rarity], [data-credits]');
      if (!t) return;
      if (t.hasAttribute('data-close')) { closeSheet(); return; }
      if (t.hasAttribute('data-credits')) {
        if (t.getAttribute('data-credits') === 'close') $('pdx-credits').close(); else openCredits();
        return;
      }
      if (t.hasAttribute('data-rarity')) {
        state.rarity = +t.getAttribute('data-rarity');
        el.rarity.querySelectorAll('[data-rarity]').forEach(function (b) {
          b.setAttribute('aria-pressed', +b.getAttribute('data-rarity') === state.rarity ? 'true' : 'false');
        });
        Sound.blip();
        renderList();
        return;
      }
      if (t.hasAttribute('data-tab')) {
        closeSheet();
        Sound.select();
        selectTab(t.getAttribute('data-tab'), t.getAttribute('role') !== 'tab');
        return;
      }
      if (t.hasAttribute('data-goto')) { Sound.select(); goto(t.getAttribute('data-goto')); return; }
      showEntry(t.getAttribute('data-code'), true);
    });

    el.list.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var rows = Array.prototype.slice.call(el.list.querySelectorAll('.row'));
      var i = rows.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      next.focus();
      if (!NARROW.matches) showEntry(next.getAttribute('data-code'), true);
    });

    $('pdx-tabs').addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(e.key) < 0) return;
      var i = TABS.indexOf(state.tab);
      if (e.key === 'ArrowRight') i = (i + 1) % TABS.length;
      if (e.key === 'ArrowLeft') i = (i - 1 + TABS.length) % TABS.length;
      if (e.key === 'Home') i = 0;
      if (e.key === 'End') i = TABS.length - 1;
      e.preventDefault();
      Sound.blip();
      selectTab(TABS[i], true);
    });

    el.sheet.addEventListener('click', function (e) { if (e.target === el.sheet) closeSheet(); });
    $('pdx-credits').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
    el.report.addEventListener('toggle', function () {
      var r = state.data && state.data.report;
      if (r) store(REPORT_FOLD_KEY, el.report.open ? null : r.day);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.reveal.hidden) closeReveal();
    });
    el.q.addEventListener('input', function () { state.q = el.q.value; renderList(); });
    el.type.addEventListener('change', function () { state.type = el.type.value; renderList(); });
    el.sort.addEventListener('change', function () { state.sort = el.sort.value; renderList(); });
    el.show.addEventListener('change', function () { state.show = el.show.value; renderList(); });

    load();
    setInterval(function () { if (!document.hidden) load(); }, REFRESH_MS);
    setInterval(updateClock, 60000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && Date.now() - state.loadedAt > REFRESH_MS) load();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
