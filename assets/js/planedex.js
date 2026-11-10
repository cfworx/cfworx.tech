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
     setting, and whether today's report was read or folded away.
   - Day or night follows the real sun in Spokane, with a live weather
     sky behind the page: that's planedex-sky.js, loaded first.
   - No inline styles: colors come from classes, bars are <progress>. */
(function () {
  'use strict';

  var API = '/api/planedex';
  var PHOTOS = '/tools/planedex/photos/';
  var REFRESH_MS = 60 * 1000;   // the PC pushes every 2 minutes; check every minute so the counts keep up
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
     CODE-m.webp 360x240, CODE-s.webp 192x96), listed with their credits
     in index.json.
     Airliners also get a live lookup of the exact plane first caught
     (by registration) from Planespotters.net. Their rules: the
     photographer is credited right beside the photo, the photo links to
     its Planespotters page, URLs are used unchanged, and nothing is saved
     anywhere, so it's asked for again on the next visit. */

  function photoOf(code) { return state.photos[code] || null; }
  // size: nothing for 900x600, 'm' for 360x240, anything else truthy for the 192x96 thumbnail
  function photoSrc(code, size) { return PHOTOS + encodeURIComponent(code) + (size === 'm' ? '-m' : size ? '-s' : '') + '.webp'; }
  function photoImg(code, alt, lazy, cls) {
    return '<img class="photo-img' + (cls ? ' ' + cls : '') + '" src="' + photoSrc(code) + '" width="900" height="600" alt="' + esc(alt || '') + '"'
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

  // Airframe photos looked up this visit: registration -> photo info, or null if there isn't one.
  var frames = {};

  // The big picture at the top of an entry. For an airliner, the exact plane first caught
  // when Planespotters has it (opts.frame); else the model's photo; else the sprite on its
  // sky stage. opts.pending draws an empty frame while that lookup is out, so the picture
  // never switches from one photo to another in front of you.
  function stageHTML(item, caught, inSheet, opts) {
    opts = opts || {};
    var close = inSheet ? '<button class="sheet-close" type="button" data-close aria-label="Close">✕</button>' : '';
    var fresh = caught && isNew(item) ? '<span class="tag-new">NEW!</span>' : '';
    var fade = opts.fade ? 'fade' : '';
    if (opts.pending) {
      return '<div class="stage photo-stage is-pending" data-stage="' + esc(item.code) + '">' + close
        + '<span class="tuning">Finding <b>' + esc(regOf(item)) + '</b>…</span>' + fresh + '</div>';
    }
    var ph = opts.frame;
    if (ph) {
      var reg = item.first.reg;
      return '<div class="stage photo-stage is-airframe" data-stage="' + esc(item.code) + '">' + close
        + '<a class="photo-link" href="' + esc(ph.link) + '" target="_blank" rel="noopener">'
        + '<img class="photo-img ' + fade + '" src="' + esc(ph.src) + '"' + (ph.w && ph.h ? ' width="' + ph.w + '" height="' + ph.h + '"' : '')
        + ' alt="' + esc('The actual plane, ' + item.first.by + ' ' + reg) + '" decoding="async"></a>'
        + realTag(reg) + fresh + '</div>'
        + '<p class="credit" data-credit="' + esc(item.code) + '"><b>' + esc(reg) + '</b>, the actual plane we caught · <span aria-hidden="true">📷</span> '
        + '<a href="' + esc(ph.link) + '" target="_blank" rel="noopener">' + esc(ph.by) + '</a> · Planespotters.net</p>';
    }
    var p = caught && photoOf(item.code);
    if (p) {
      return '<div class="stage photo-stage" data-stage="' + esc(item.code) + '">' + close
        + '<a class="photo-link" href="' + esc(p.source) + '" target="_blank" rel="noopener">' + photoImg(item.code, item.name, false, fade) + '</a>'
        + modelTag() + fresh + '</div>'
        + '<p class="credit" data-credit="' + esc(item.code) + '"><span aria-hidden="true">📷</span> <a href="' + esc(p.source) + '" target="_blank" rel="noopener">'
        + esc(p.by) + '</a> · ' + licenseHTML(p) + '</p>';
    }
    return '<div class="stage t-' + esc(item.types[0] || 'jet') + (caught ? '' : ' is-missing') + '" data-stage="' + esc(item.code) + '">' + close
      + '<span class="cloud c1"></span><span class="cloud c2"></span>'
      + spriteTag(item.code, item.types, !caught, 'big')
      + '<span class="ground"></span>' + fresh + '</div>';
  }

  function regOf(item) { return (item && item.dex && item.first && item.first.reg) || null; }
  // Labels on the picture: the exact plane we caught, or just a plane of the same model.
  function realTag(reg) { return '<span class="photo-tag real"><span aria-hidden="true">★</span> The actual plane · ' + esc(reg) + '</span>'; }
  function modelTag() { return '<span class="photo-tag">Same model</span>'; }

  // What to draw first: the known answer, or an empty frame while we ask.
  function entryStage(item, inSheet) {
    var reg = regOf(item);
    if (!reg) return stageHTML(item, !!item.dex, inSheet);
    if (reg in frames) return stageHTML(item, true, inSheet, { frame: frames[reg] });
    return stageHTML(item, true, inSheet, { pending: true });
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

  // Ask Planespotters for the exact plane (waiting a moment at most, image loaded and all),
  // then hand the answer to done(frame or null). Answers are remembered for the visit.
  function lookupFrame(reg, done) {
    var settled = false;
    var timer = setTimeout(function () { settled = true; done(null); }, 4000);  // most answers take under a second
    airframe(reg).then(function (ph) {
      function finish(frame) {
        frames[reg] = frame;              // a late answer still shows next time
        clearTimeout(timer);
        if (!settled) { settled = true; done(frame); }
      }
      if (!ph) { finish(null); return; }
      var probe = new Image();
      probe.onload = function () { finish(ph); };
      probe.onerror = function () { finish(null); };
      probe.src = ph.src;
    });
  }

  // Fill in an entry's empty frame once the lookup is back, if that entry is still on screen.
  function settleStage(item, root, inSheet) {
    var reg = regOf(item);
    if (!reg || reg in frames) return;
    lookupFrame(reg, function (frame) {
      var stage = root.querySelector('[data-stage="' + item.code + '"].is-pending');
      if (!stage) return;
      var tpl = document.createElement('template');
      tpl.innerHTML = stageHTML(item, true, inSheet, { frame: frame, fade: true });
      stage.replaceWith(tpl.content);
    });
  }

  // Catch of the day's picture: the exact plane when we have it, like its entry.
  function cotdPic(s, opts) {
    opts = opts || {};
    if (opts.pending) return '<span class="stage small photo-stage is-pending"><span class="tuning">Finding <b>' + esc(regOf(s)) + '</b>…</span></span>';
    var ph = opts.frame;
    if (ph) {
      return '<span class="stage small photo-stage is-airframe"><img class="photo-img ' + (opts.fade ? 'fade' : '') + '" src="' + esc(ph.src) + '"'
        + (ph.w && ph.h ? ' width="' + ph.w + '" height="' + ph.h + '"' : '') + ' alt="" decoding="async">' + realTag(s.first.reg) + '</span>';
    }
    return photoOf(s.code)
      ? '<span class="stage small photo-stage">' + photoImg(s.code, '', true, opts.fade ? 'fade' : '') + modelTag() + '</span>'
      : '<span class="stage small t-' + esc(s.types[0]) + '"><span class="cloud c1"></span>' + spriteTag(s.code, s.types, false, 'big') + '<span class="ground"></span></span>';
  }
  function cotdCredit(s, ph) {
    return '<p class="credit"><b>' + esc(s.first.reg) + '</b>, the actual plane we caught · <span aria-hidden="true">📷</span> '
      + '<a href="' + esc(ph.link) + '" target="_blank" rel="noopener">' + esc(ph.by) + '</a> · Planespotters.net</p>';
  }
  function settleCotd(s) {
    var reg = regOf(s);
    if (!reg || reg in frames) return;
    lookupFrame(reg, function (frame) {
      var card = el.today.querySelector('[data-cotd="' + s.code + '"]');
      var stage = card && card.querySelector('.cotd-btn .stage.is-pending');
      if (!stage) return;
      var tpl = document.createElement('template');
      tpl.innerHTML = cotdPic(s, { frame: frame, fade: true });
      stage.replaceWith(tpl.content);
      paintSprites(card);
      if (frame) card.insertAdjacentHTML('beforeend', cotdCredit(s, frame));
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
    el.level.classList.remove('is-loading');
    var t = d.totals, td = d.today || {}, prev = state.shownTotals;
    // Our own counts, said plainly ("509 planes spotted"), with today's firsts underneath.
    // When a refresh brings bigger numbers, they count up and the box flashes.
    var stats = [
      ['species', 'plane models caught', t.known || t.species, td.newSpecies, 'Different kinds of plane we have caught, out of all the ones in the catalog'],
      ['planes', 'planes spotted', null, td.newPlanes, 'Different airplanes, each one counted once'],
      ['airlines', 'airlines spotted', null, td.newAirlines, 'Airlines whose planes we have spotted'],
      ['countries', 'countries spotted', null, td.newCountries, 'Countries the planes we spotted come from'],
      ['badges', 'badges earned', t.badgesTotal, null, 'Badge levels earned so far']
    ];
    var SHORT = { species: 'models', planes: 'planes', airlines: 'airlines', countries: 'countries', badges: 'badges' };
    el.stats.innerHTML = stats.map(function (c) {
      var v = t[c[0]] || 0;
      var from = prev && typeof prev[c[0]] === 'number' && prev[c[0]] < v ? prev[c[0]] : v;
      return '<div class="stat' + (from !== v ? ' bump' : '') + '" title="' + esc(c[4]) + '"><dt><span class="l-full">' + c[1] + '</span><span class="l-short">' + SHORT[c[0]] + '</span></dt>'
        + '<dd><b class="count" data-to="' + v + '">' + num(from) + '</b>' + (c[2] ? '<small> of ' + num(c[2]) + '</small>' : '') + '</dd>'
        + (c[3] ? '<dd class="stat-today">+' + num(c[3]) + ' today</dd>' : '') + '</div>';
    }).join('');
    state.shownTotals = { species: t.species, planes: t.planes, airlines: t.airlines, countries: t.countries, badges: t.badges };
    countUp(el.stats);
    el.stats.hidden = false;
    el.stats.classList.remove('is-loading');
    $('n-dex').textContent = t.species;
    $('n-wanted').textContent = d.wanted.filter(function (w) { return !w.caught; }).length;
    $('n-badges').textContent = t.badges + '/' + t.badgesTotal;
    revealTab($('tab-' + state.tab));   // the counters change the tabs' widths
    menuEdges();
    updateClock();
  }

  // Numbers that went up since the last refresh tick up to their new value.
  function countUp(root) {
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var any = false;
    root.querySelectorAll('.count[data-to]').forEach(function (n) {
      var to = +n.getAttribute('data-to');
      var from = +String(n.textContent).replace(/[^0-9]/g, '');
      if (from === to) return;
      any = true;
      if (still) { n.textContent = num(to); return; }
      var t0 = performance.now(), ms = 900;
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms);
        n.textContent = num(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
    if (any) Sound.blip();
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
    var html = entryStage(item, inSheet)
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
    if (fam) html += '<div class="entry-fam"><button class="mini-h fam-link" type="button" data-family="' + esc(fam.name) + '">'
      + esc(fam.name.replace(/ family$/i, '')) + ' family · ' + fam.members.filter(function (m) { return m.caught; }).length + '/' + fam.members.length
      + ' <span aria-hidden="true">▶</span></button>' + chain(fam.members, item.code) + '</div>';
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
      settleStage(item, el.entry, false);
    }
    if (fromUser) Sound.blip();
  }

  function openSheet(item) {
    el.sheetBody.innerHTML = entryHTML(item, true);
    paintSprites(el.sheetBody);
    settleStage(item, el.sheetBody, true);
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
    var caughtN = d.species.length, leftN = (d.missing || []).length;
    el.shown.innerHTML = '<span class="dc-caught"><b>' + num(caughtN) + '</b> models caught</span>'
      + '<progress max="' + Math.max(1, caughtN + leftN) + '" value="' + caughtN + '" aria-hidden="true"></progress>'
      + '<span class="dc-left"><b>' + num(leftN) + '</b> still out there</span>';
    var target = state.sel && el.list.querySelector('.row[data-code="' + state.sel + '"]');
    if (!target) {
      var first = el.list.querySelector('.row');
      if (first) showEntry(first.getAttribute('data-code'), false);
    } else {
      target.setAttribute('aria-current', 'true');
    }
  }

  /* ---- today ------------------------------------------------------------------- */

  var RADAR_FIRST = 12;   // cards shown before "Show all"
  var LOG_FIRST = 30;     // radio log lines shown before "Show more"
  var MEDALS = ['bronze', 'silver', 'gold', 'platinum', 'platinum'];

  // A badge's little medal for the radio log, painted by planedex-badges.js.
  function badgeMini(id) {
    var d = state.data, b = null, tier = 0;
    d.badges.forEach(function (x) { if (x.id === id) b = x; });
    if (!b) {
      var m = /^(.*)-(\d+)$/.exec(id || '');
      if (m) d.badges.forEach(function (x) { if (x.id === m[1]) { b = x; tier = +m[2]; } });
    }
    if (!b || !BA) return '<span class="log-pic blank"></span>';
    var a = BA.art(b.id);
    var look = b.kind === 'ladder' ? 'medal' : (b.secret ? 'star' : 'wings');
    var metal = b.kind === 'ladder' ? MEDALS[Math.max(0, tier - 1)] : (b.medal || 'gold');
    return '<canvas class="badge-art log-pic" width="40" height="34" aria-hidden="true" data-look="' + look + '" data-icon="' + esc(a[0]) + '"'
      + (a[1] ? ' data-tint="' + esc(a[1]) + '"' : '') + ' data-metal="' + esc(metal) + '"'
      + (b.kind === 'ladder' ? ' data-ribbon="' + (Math.max(0, d.badges.indexOf(b)) % 8) + '"' : '') + '></canvas>';
  }

  // Every type that showed up today, rarest first, each with its photo.
  function radarHTML(d) {
    var seen = d.species.filter(function (s) { return s.today; });
    if (!seen.length) return '';
    var today = d.today.date;
    seen.sort(function (a, b) {
      return b.rarity - a.rarity || (b.todayCount || 0) - (a.todayCount || 0) || a.dex - b.dex;
    });
    var all = state.radarAll || seen.length <= RADAR_FIRST + 2;
    var shown = all ? seen : seen.slice(0, RADAR_FIRST);
    return '<div class="win radar"><p class="win-title">On our radar today <span class="win-sub">'
      + plural(d.today.planes, 'plane', 'planes') + ' · ' + plural(seen.length, 'model', 'models') + '</span></p>'
      + '<ul class="radar-grid">' + shown.map(function (s) {
        var first = parseKey(s.first && s.first.when);
        var fresh = first && first.day === today;
        var pic = photoOf(s.code)
          ? '<img src="' + photoSrc(s.code, 'm') + '" width="360" height="240" alt="" loading="lazy" decoding="async">'
          : spriteTag(s.code, s.types, false, 'radar-sprite');
        return '<li><button class="radar-card r' + s.rarity + '" type="button" data-goto="' + esc(s.code) + '">'
          + '<span class="radar-pic">' + pic + (fresh ? '<span class="tag-new">NEW</span>' : '') + '</span>'
          + '<span class="radar-name">' + esc(s.name) + '</span>'
          + '<span class="radar-meta">' + stars(s.rarity)
          + (s.todayCount ? '<span class="radar-n" title="Different planes of this type today">×' + num(s.todayCount) + '</span>' : '')
          + '</span></button></li>';
      }).join('') + '</ul>'
      + (all ? '' : '<button class="more-btn" type="button" data-more="radar">Show all ' + num(seen.length) + ' ▼</button>')
      + '</div>';
  }

  // The radio log: newest first, one block per hour, each line with a picture
  // (the plane, the badge, or the country's flag) so it scans at a glance.
  function radioHTML(d) {
    var rows = [];
    var lastDay = null, lastHour = null, shown = 0;
    var limit = state.logAll ? d.log.length : LOG_FIRST;
    d.log.forEach(function (e) {
      if (shown >= limit) return;
      var p = parseKey(e.when);
      if (!p) return;
      var line;
      if (e.kind === 'species') {
        var sp = state.byCode[e.code];
        if (!sp) return;
        line = '<li class="log-line k-new">' + thumb(sp, true, 'log-pic')
          + '<span class="lt lt-new">NEW</span><span class="log-x"><button class="link" type="button" data-goto="' + esc(sp.code) + '">'
          + '<span class="log-no">' + no(sp.dex) + '</span> ' + esc(sp.name) + '</button> ' + stars(sp.rarity) + '</span></li>';
      } else if (e.kind === 'badge') {
        line = '<li class="log-line k-badge">' + badgeMini(e.id)
          + '<span class="lt lt-badge">BADGE</span><span class="log-x"><button class="link" type="button" data-tab="badges">' + esc(e.name) + '</button></span></li>';
      } else {
        line = '<li class="log-line k-stamp"><span class="log-pic flag-pic">' + flag(e.code, true) + '</span>'
          + '<span class="lt lt-stamp">STAMP</span><span class="log-x"><button class="link" type="button" data-tab="passport">' + esc(e.name) + '</button></span></li>';
      }
      if (p.day !== lastDay) { rows.push('<li class="log-day">' + esc(dayLabel(p.day)) + '</li>'); lastDay = p.day; lastHour = null; }
      if (p.h !== lastHour) { rows.push('<li class="log-hour"><span>' + esc(p.h == null ? '' : fmtHour(p.h)) + '</span></li>'); lastHour = p.h; }
      rows.push(line);
      shown++;
    });
    var more = !state.logAll && d.log.length > LOG_FIRST;
    return '<div class="win radio"><p class="win-title">Radio log</p><ul class="log">' + rows.join('') + '</ul>'
      + (more ? '<button class="more-btn" type="button" data-more="log">Show more ▼</button>' : '') + '</div>';
  }

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
      var reg = regOf(s);
      var known = reg && (reg in frames) ? frames[reg] : null;
      var pic = cotdPic(s, reg && !(reg in frames) ? { pending: true } : { frame: known });
      cotd = '<div class="win cotd" data-cotd="' + esc(s.code) + '"><p class="win-title">Catch of the day' + (t.catch.isNew ? ' <span class="tag-new">NEW!</span>' : '') + '</p>'
        + '<button class="cotd-btn" type="button" data-goto="' + esc(s.code) + '">' + pic
        + '<span class="cotd-name"><span class="plate-no">' + no(s.dex) + '</span> ' + esc(s.name) + '</span>'
        + '<span class="cotd-meta">' + typeChips(s.types) + stars(s.rarity) + '</span></button>'
        + (known ? cotdCredit(s, known) : '') + '</div>';
    }
    var radar = radarHTML(d);

    el.today.innerHTML = '<div class="today-grid"><div class="today-col">'
      + '<div class="win"><p class="win-title">Daily missions <span class="win-sub">' + done + '/' + t.quests.length + ' done</span></p>'
      + '<ul class="missions">' + missions + '</ul></div>'
      + cotd + quizCard()
      + (radar ? '' : '<p class="today-line"><b>' + num(t.planes) + '</b> planes today' + (t.newSpecies ? ' · <b>' + num(t.newSpecies) + '</b> new' : '') + '</p>')
      + '</div>' + radar + radioHTML(d) + '</div>';
    paintSprites(el.today);
    if (BA) el.today.querySelectorAll('canvas.badge-art').forEach(function (c) { BA.paint(c); });
    if (s) settleCotd(s);
  }

  /* ---- guess the plane: a quiz made from our own catches ------------------------------- */
  /* A blurred photo of a model we've caught and four names to pick from (the wrong ones are
     the same kind of plane when there are enough, so it's a fair test). The photo clears on
     the answer, with the plane's fact. The best streak is kept in this browser. */

  var QUIZ_KEY = 'planedex-quiz-best';
  var quiz = { streak: 0, best: 0, q: null, last: null };
  try { quiz.best = +localStorage.getItem(QUIZ_KEY) || 0; } catch (e) { /* storage off */ }

  function quizPool() { return state.data.species.filter(function (s) { return photoOf(s.code); }); }
  function quizCard() {
    if (quizPool().length < 4) return '';
    return '<div class="win quiz-card"><p class="win-title">Guess the plane <span class="win-sub">Best streak: ' + quiz.best + '</span></p>'
      + '<p class="intro-tip">A blurry photo of a plane we\u2019ve caught. Can you name it?</p>'
      + '<button class="btn primary" type="button" data-quiz="next">Play ▶</button></div>';
  }
  function pickFrom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function nextQuestion() {
    var pool = quizPool();
    if (pool.length < 4) return;
    var answer;
    do { answer = pickFrom(pool); } while (answer.code === quiz.last);
    quiz.last = answer.code;
    var kin = pool.filter(function (s) { return s.code !== answer.code && s.name !== answer.name && s.types[0] === answer.types[0]; });
    var rest = pool.filter(function (s) { return s.code !== answer.code && s.name !== answer.name && s.types[0] !== answer.types[0]; });
    var opts = [answer];
    while (opts.length < 4) {
      var from = kin.length ? kin : rest;
      opts.push(from.splice(Math.floor(Math.random() * from.length), 1)[0]);
    }
    opts.sort(function () { return Math.random() - 0.5; });
    quiz.q = { answer: answer, opts: opts, picked: null };
    renderQuiz();
  }
  function answerQuiz(i) {
    var q = quiz.q;
    if (!q || q.picked != null || !q.opts[i]) return;
    q.picked = i;
    if (q.opts[i] === q.answer) {
      quiz.streak++;
      if (quiz.streak > quiz.best) {
        quiz.best = quiz.streak;
        try { localStorage.setItem(QUIZ_KEY, String(quiz.best)); } catch (e) { /* storage off */ }
      }
      Sound.jingle();
    } else {
      quiz.streak = 0;
      Sound.blip();
    }
    renderQuiz();
  }
  function renderQuiz() {
    var q = quiz.q, done = q.picked != null, right = done && q.opts[q.picked] === q.answer;
    var fact = (lookup(q.answer.code) || {}).fact;
    el.sheetBody.innerHTML = '<button class="sheet-close" type="button" data-close aria-label="Close">✕</button>'
      + '<div class="fam-page quiz"><p class="mini-h">Guess the plane · streak ' + quiz.streak + ' · best ' + quiz.best + '</p>'
      + '<h2 class="fp-title" id="pdx-detail-title" aria-live="polite">' + (done ? (right ? 'Correct!' : 'Not quite!') : 'Which plane is this?') + '</h2>'
      + '<div class="stage photo-stage quiz-stage' + (done ? ' shown' : '') + '">' + photoImg(q.answer.code, done ? q.answer.name : 'A mystery plane') + '</div>'
      + '<div class="quiz-opts">' + q.opts.map(function (o, i) {
        var cls = done ? (o === q.answer ? ' right' : i === q.picked ? ' wrong' : ' dim') : '';
        return '<button class="btn quiz-opt' + cls + '" type="button" data-quiz="pick" data-i="' + i + '"' + (done ? ' aria-disabled="true"' : '') + '>'
          + (done && o === q.answer ? '✓ ' : done && i === q.picked ? '✗ ' : '') + esc(o.name) + '</button>';
      }).join('') + '</div>'
      + (done ? '<div class="textbox"><p><b>' + no(q.answer.dex) + ' ' + esc(q.answer.name) + '.</b> ' + esc(fact || '') + '</p></div>'
        + '<div class="reveal-btns"><button class="btn" type="button" data-goto="' + esc(q.answer.code) + '">See its entry</button>'
        + '<button class="btn primary" type="button" data-quiz="next">Next ▶</button></div>' : '')
      + '</div>';
    if (!el.sheet.open) {
      if (typeof el.sheet.showModal === 'function') el.sheet.showModal();
      else el.sheet.setAttribute('open', '');
    }
    el.sheetBody.scrollTop = 0;
    var focus = el.sheetBody.querySelector(done ? '[data-quiz="next"]' : '.quiz-opt');
    if (focus) focus.focus();
  }

  /* ---- wanted posters ------------------------------------------------------------ */

  function renderWanted(d) {
    var left = d.wanted.filter(function (w) { return !w.caught; }).length;
    el.wanted.innerHTML = '<div class="win intro"><p class="win-title">Most wanted <span class="win-sub">' + num(left) + ' left</span></p></div>'
      + '<div class="posters">' + d.wanted.map(function (w, i) {
        var sp = w.caught && state.byCode[w.code];
        var pic = photoOf(w.code)
          ? '<span class="stage poster-stage photo-stage"><img class="photo-img" src="' + photoSrc(w.code, 'm') + '" srcset="' + photoSrc(w.code, 'm') + ' 360w, '
            + photoSrc(w.code) + ' 900w" sizes="(max-width: 440px) 45vw, 250px" width="900" height="600" alt="' + esc(w.name) + '"' + (i < 4 ? '' : ' loading="lazy"') + ' decoding="async"></span>'
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

  // Family pages (what each family is, how to spot one, a fun fact) come
  // from families.json, loaded once alongside the photo and logo lists.
  function loadFamilyInfo() {
    return fetch('/tools/planedex/families.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (j) {
        state.famInfo = j || {};
        if (state.data) renderFamilies(state.data);
      });
  }
  function icon(name, cls) {
    return '<canvas class="pix-ico ' + (cls || '') + '" width="12" height="12" data-icon="' + esc(name) + '" aria-hidden="true"></canvas>';
  }
  function paintIcons(root) {
    if (BA && BA.paintIcon) root.querySelectorAll('canvas.pix-ico').forEach(function (c) { BA.paintIcon(c); });
  }
  function familyOf(name) {
    return (state.data.families || []).filter(function (f) { return f.name === name; })[0] || null;
  }

  function renderFamilies(d) {
    var info = state.famInfo || {};
    var done = d.families.filter(function (f) { return f.done; }).length;
    var order = d.families.slice().sort(function (a, b) {
      function frac(f) { return f.members.filter(function (m) { return m.caught; }).length / f.members.length; }
      return (b.done - a.done) || (frac(b) - frac(a)) || a.name.localeCompare(b.name);
    });
    el.families.innerHTML = '<div class="win intro"><p class="win-title">Families <span class="win-sub">' + done + '/' + d.families.length + ' complete</span></p>'
      + '<p class="intro-tip">Tap a family to learn what makes it special and how to spot one.</p></div>'
      + '<div class="fam-grid">' + order.map(function (f) {
        var have = f.members.filter(function (m) { return m.caught; }).length;
        var about = info[f.name] && info[f.name].about;
        return '<div class="win fam' + (f.done ? ' done' : '') + '">'
          + '<button class="fam-open" type="button" data-family="' + esc(f.name) + '">'
          + '<span class="fam-h"><span class="fam-name">' + esc(f.name) + '</span>'
          + (f.done ? '<span class="done-tag">COMPLETE</span>' : '<span class="fam-n">' + have + '/' + f.members.length + '</span>') + '</span>'
          + (about ? '<span class="fam-teaser">' + esc(about) + '</span>' : '')
          + '<span class="fam-go">Learn more ▶</span></button>'
          + chain(f.members) + '</div>';
      }).join('') + '</div>';
    paintSprites(el.families);
  }

  // A family's page, in the sheet: what it is, how to spot one, a fun fact, and its members.
  function openFamily(name) {
    var f = familyOf(name);
    if (!f) return;
    var info = (state.famInfo || {})[name] || {};
    var have = f.members.filter(function (m) { return m.caught; }).length;
    var star = f.members.filter(function (m) { return m.caught && photoOf(m.code); })[0]
      || f.members.filter(function (m) { return photoOf(m.code); })[0];
    var hero = star
      ? '<div class="stage photo-stage fp-hero' + (star.caught ? '' : ' not-yet') + '">' + photoImg(star.code, star.name) + '</div>'
      : '';
    var members = f.members.map(function (m) {
      var item = lookup(m.code) || { code: m.code, types: ['jet'] };
      var sp = m.caught && state.byCode[m.code];
      var pic = photoOf(m.code)
        ? '<img src="' + photoSrc(m.code, 'm') + '" width="360" height="240" alt="" loading="lazy" decoding="async">'
        : spriteTag(m.code, item.types, !sp, 'fp-sprite');
      return '<li><button class="fp-m' + (sp ? ' caught' : '') + '" type="button" data-goto="' + esc(m.code) + '">'
        + '<span class="fp-pic">' + pic + '</span>'
        + '<span class="fp-text"><span class="fp-name">' + esc(m.name) + '</span>'
        + (item.fact ? '<span class="fp-fact">' + esc(item.fact) + '</span>' : '') + '</span>'
        + '<span class="fp-status">' + (sp ? no(sp.dex) + ' <b>✓</b>' : 'Not yet') + '</span></button></li>';
    }).join('');
    el.sheetBody.innerHTML = '<button class="sheet-close" type="button" data-close aria-label="Close">✕</button>'
      + '<div class="fam-page"><p class="mini-h">Plane family</p>'
      + '<h2 class="fp-title" id="pdx-detail-title">' + esc(f.name) + '</h2>'
      + '<div class="fp-prog"><progress max="' + f.members.length + '" value="' + have + '" aria-label="Caught ' + have + ' of ' + f.members.length + '"></progress>'
      + '<span>' + have + '/' + f.members.length + ' caught</span>' + (f.done ? '<span class="done-tag">COMPLETE</span>' : '') + '</div>'
      + hero
      + (info.about ? '<div class="textbox fp-about"><p>' + esc(info.about) + '</p></div>' : '')
      + (info.spot ? '<div class="fp-box spot"><p class="fp-h">' + icon('binoculars') + 'How to spot one</p><p>' + esc(info.spot) + '</p></div>' : '')
      + (info.fact ? '<div class="fp-box fact"><p class="fp-h">' + icon('star') + 'Fun fact</p><p>' + esc(info.fact) + '</p></div>' : '')
      + '<p class="fp-h members-h">' + icon('familytree') + 'In this family</p><ul class="fp-members">' + members + '</ul>'
      + (info.wiki ? '<p class="fp-more"><a href="https://en.wikipedia.org/wiki/' + encodeURIComponent(info.wiki.replace(/ /g, '_')) + '" target="_blank" rel="noopener">Read more on Wikipedia ↗</a></p>' : '')
      + '</div>';
    paintSprites(el.sheetBody);
    paintIcons(el.sheetBody);
    if (!el.sheet.open) {
      if (typeof el.sheet.showModal === 'function') el.sheet.showModal();
      else el.sheet.setAttribute('open', '');
    }
    el.sheetBody.scrollTop = 0;
    Sound.blip();
  }

  /* ---- badges ---------------------------------------------------------------------------- */

  function renderBadges(d) {
    var ladders = d.badges.filter(function (b) { return b.kind === 'ladder'; });
    var singles = d.badges.filter(function (b) { return b.kind !== 'ladder' && !b.secret; });
    var secrets = d.badges.filter(function (b) { return b.kind !== 'ladder' && b.secret; });
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
    var more = last && state.revealExtra > 0 ? ' And ' + plural(state.revealExtra, 'more new plane model', 'more new plane models') + ' in the Dex.' : '';
    var sparkles = '<span class="sparkle s1"></span><span class="sparkle s2"></span><span class="sparkle s3"></span>';
    var reg = regOf(s);
    function revealPic(opts) {
      opts = opts || {};
      if (opts.pending) return '<div class="stage reveal-stage photo-stage is-pending"><span class="tuning">Finding <b>' + esc(reg) + '</b>…</span>' + sparkles + '</div>';
      if (opts.frame) {
        return '<div class="stage reveal-stage photo-stage is-airframe"><img class="photo-img' + (opts.fade ? ' fade' : '') + '" src="' + esc(opts.frame.src) + '"'
          + (opts.frame.w && opts.frame.h ? ' width="' + opts.frame.w + '" height="' + opts.frame.h + '"' : '') + ' alt="" decoding="async">'
          + realTag(reg) + sparkles + '</div>';
      }
      return photoOf(s.code)
        ? '<div class="stage reveal-stage photo-stage">' + photoImg(s.code, s.name, false, opts.fade ? 'fade' : '') + modelTag() + sparkles + '</div>'
        : '<div class="stage reveal-stage t-' + esc(s.types[0]) + '"><span class="cloud c1"></span><span class="cloud c2"></span>' + spriteTag(s.code, s.types, false, 'big') + '<span class="ground"></span>' + sparkles + '</div>';
    }
    var pic = revealPic(reg && !(reg in frames) ? { pending: true } : { frame: reg ? frames[reg] : null });
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
    if (reg && !(reg in frames)) {
      lookupFrame(reg, function (frame) {
        var stage = el.reveal.querySelector('.reveal-stage.is-pending');
        if (!stage || state.reveal[state.revealAt] !== s) return;
        var tpl = document.createElement('template');
        tpl.innerHTML = revealPic({ frame: frame, fade: true });
        stage.replaceWith(tpl.content);
        paintSprites(el.reveal);
      });
    }
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
    revealTab($('tab-' + name));
    if (name === 'logbook' && state.data) renderLogbook();
    try { history.replaceState(null, '', name === 'dex' ? location.pathname : '#' + name); } catch (e) { /* not fatal */ }
  }

  // On a phone not every screen fits in the menu row: keep the chosen one in view, and fade
  // whichever edge has more screens past it, with an arrow, so they're easy to find.
  function revealTab(tab) {
    var row = tab && tab.parentNode;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    var left = tab.offsetLeft - row.offsetLeft, right = left + tab.offsetWidth;
    if (left < row.scrollLeft + 24) row.scrollLeft = Math.max(0, left - 40);
    else if (right > row.scrollLeft + row.clientWidth - 24) row.scrollLeft = right - row.clientWidth + 40;
    menuEdges();
  }
  function menuEdges() {
    var row = $('pdx-tabs'), menu = row && row.parentNode;
    if (!menu) return;
    var more = row.scrollWidth - row.clientWidth;
    menu.classList.toggle('more-l', more > 2 && row.scrollLeft > 2);
    menu.classList.toggle('more-r', more > 2 && row.scrollLeft < more - 2);
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

  /* ---- the banner: our kid's radio station catches a plane --------------------------------- */
  /* The title bar's little scene, in original pixel art: our kid in his computer chair at the
     radar screen, with the antenna standing beside him, like the real station. Every half
     minute or so a small plane crosses the strip of sky above the PLANEDEX title (over the
     letters, never through them). As it passes over the antenna, radio waves ping, a blip
     lights up the radar and the kid throws both arms up: "Caught it!".
     Everything is placed in the empty space around the words, measured from the page whenever
     the title bar changes, so the art never covers text. Where there isn't room, parts drop
     out: the speech bubble, then the desk, then the whole scene (the plane still flies).
     Drawn at the screen's own resolution, so the pixels and the bubble's words stay crisp.
     Between flights the scene has a little life of its own: the radar sweeps, keys light up
     as he types in bursts, and he blinks. He looks up as a plane comes near, and the cheer
     has a hop and a few sparkles. Planes come in four tail colors.
     With reduced motion the scene stays put and nothing moves. */

  var Banner = (function () {
    var PAL = {
      k: '#0b1022', n: '#7a4a2a', s: '#f0c39b', S: '#d99b74', h: '#ff9a3d', H: '#d9731f', e: '#d5dce6', d: '#6b7686',
      r: '#e2402f', j: '#3a5a9c', J: '#2b4478', w: '#ffffff', c: '#2a3346', C: '#46557a', a: '#2f6fe0', m: '#9aa7b8',
      M: '#5f6b7c', t: '#b07a45', T: '#7f532b', f: '#1c2333', g: '#0f3d2a', G: '#3ddc84', o: '#f4f8ff', b: '#20304f',
      x: '#c9d4e3', l: '#4ee08a', y: '#ffd84d'
    };
    // 15x16: the computer, its radar screen showing a ring, on a little desk with the keyboard
    var DESK = ['..fffffffff....', '..fgggGgggf....', '..fggGgGggf....', '..fgGgggGgf....', '..fggGgGggf....',
      '..fgggGgggf....', '..fffffffff....', '.....fff.......', '....fffff.mmmm.', 'ttttttttttttttt', 'TTTTTTTTTTTTTTT',
      '.T...........T.', '.T...........T.', '.T...........T.', '.T...........T.', '.T...........T.'];
    // 13x17, in his chair facing the desk (left). TYPE: hands on the keyboard. CHEER: turned round, both arms up.
    var TYPE = ['....kkkkk....', '...kneeenk...', '..knnnnnenk..', '..kssnnnddk..', '..ksksnnddkc.', '.ksssSnnddkCc',
      '..krssssnnkac', '...kksssk.Cac', '...khhhhhkCac', 'kkkhhhhhHkCCc', 'sshhhhhhHkCCc', 'kkkhhhhHHkcCc',
      '...kjjjjjjjjc', '..kjjjjjjjJJc', '..kj.cccccccc', '.kwk....M....', 'krrk.MMMMMMM.'];
    var CHEER = ['ks..keeeek.sk', 'kh.kennnnekhk', '.hkdnnnnnndh.', '.hkdssssssdhc', '.hkdskssksdhc', '.hkdssssssdhc',
      '..kkssrrssCac', '...hkkssk.Cac', '...khhhhhkCac', '...khhhhhkCCc', '...khhhhHkCCc', '...khhhHHkcCc',
      '...kjjjjjjjjc', '..kjjjjjjjJJc', '..kj.cccccccc', '.kwk....M....', 'krrk.MMMMMMM.'];
    // He looks up as the plane comes near; the cheer's second beat has the arms out wide.
    var LOOK = TYPE.slice();
    LOOK[3] = '..ksksnnddk..'; LOOK[4] = '.kssSsnnddkc.'; LOOK[5] = '..ksssnnddkCc';
    var CHEER2 = CHEER.slice();
    CHEER2[0] = '....keeeek...'; CHEER2[1] = 'sk.kennnnek.ks'.slice(0, 13); CHEER2[2] = 'khkdnnnnnndhk';
    var RING = [[6, 1], [7, 2], [8, 3], [7, 4], [6, 5], [5, 4], [4, 3], [5, 2]];   // the radar's ring, clockwise
    var SPARKS = [[-3, 2], [15, 0], [-5, 9], [17, 8], [6, -4]];                     // around the cheering kid
    var TAILS = [null, { a: 'r' }, { a: 'G' }, { a: 'y' }];
    // 7x19: the ADS-B antenna on its stand; the little box has a light (l) that blinks on a catch
    var ANT = ['...w...', '...o...', '...o...', '..xox..', '...o...', '...o...', '..xox..', '...o...', '...o...',
      '..MMM..', '...m...', '...m...', '...m...', '...m...', '...m...', '..kfk..', '..klk..', '.m.m.m.', 'm..m..m'];
    // 19x7: a small airliner flying right
    var PLANE = ['.kk................', '.kak...............', '.kaakkkkkkkkkkkk...', 'kwwwwwwwwwwwwwwwkk.',
      'kxwbwbwbwbwbwbwwwbk', '.kkxxwwwwwwwwwwxkk.', '.....kMMMMk........'];
    var KID_W = 13, KID_H = 17, ANT_W = 7, ANT_H = 19, DESK_W = 15, PLANE_W = 19, PLANE_H = 7;
    var SAY = 'Caught it!';
    var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    var CHEER_FOR = 3.4, WAVE = 1.2;   // seconds
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cv, ctx, hud, meas, lay = null, run = null, timer = 0, pending = 0;
    var unit = 2, dpr = 1, P = 2;      // CSS px per art pixel; device px per CSS px; device px per art pixel

    function sprite(rows, x, y, swap) {
      x = Math.round(x); y = Math.round(y);
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < rows[r].length; c++) {
          var ch = rows[r].charAt(c);
          if (ch === '.') continue;
          ctx.fillStyle = PAL[(swap && swap[ch]) || ch];
          ctx.fillRect((x + c) * P, (y + r) * P, P, P);
        }
      }
    }
    function dot(x, y, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x) * P, Math.round(y) * P, P, P); }

    // The PLANEDEX letters' real top and bottom: the text box is taller than the pixel letters.
    function glyphs(logo, box) {
      // Silkscreen's own proportions: the text box is 1.267em tall with the baseline 81% of the
      // way down, and the capitals stand 0.625em above it. Worked out from the page itself,
      // because some phone browsers blur or block the canvas text measurements.
      var fs = parseFloat(getComputedStyle(logo).fontSize) || 34;
      var base = box.top + box.height * 0.808;
      return { top: base - fs * 0.625, bottom: base + 8 };   // + its 8px shadow
    }

    function measure() {
      var hr = hud.getBoundingClientRect();
      var logo = hud.querySelector('.logo-link');
      if (!hr.width || !hr.height || !logo) return null;
      unit = hr.width >= 900 ? 3 : 2;
      dpr = Math.min(3, window.devicePixelRatio || 1);
      P = Math.max(1, Math.round(unit * dpr));
      var W = Math.round(hr.width * dpr), H = Math.round(hr.height * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      var AW = Math.floor(W / P), AH = Math.floor(H / P);
      function art(r) { return { l: (r.left - hr.left) * dpr / P, t: (r.top - hr.top) * dpr / P, r: (r.right - hr.left) * dpr / P, b: (r.bottom - hr.top) * dpr / P }; }
      // Everything the art must keep clear of: the buttons, the title, and every line of words.
      var obs = [], bar = 0;
      function keep(r) { if (r.width > 0 && r.height > 0) { var a = art(r); obs.push(a); return a; } return null; }
      hud.querySelectorAll('.hud-top a, .hud-top button').forEach(function (b) { var a = keep(b.getBoundingClientRect()); if (a) bar = Math.max(bar, a.b); });
      var range = document.createRange();
      range.selectNodeContents(logo);
      var box = range.getBoundingClientRect();
      var g = glyphs(logo, box);
      var L = art({ left: box.left, right: box.right, top: g.top, bottom: g.bottom });
      obs.push(L);
      var st = hud.querySelector('.station');
      if (st) { range.selectNodeContents(st); [].forEach.call(range.getClientRects(), keep); }
      hud.querySelectorAll('.sky-now > *, .level, .stats').forEach(function (e) { keep(e.getBoundingClientRect()); });

      // The plane's lane: the strip of sky between the buttons and the tops of the letters.
      var bandTop = Math.ceil(bar) + 1, bandBot = Math.floor(L.t) - 1;
      obs.forEach(function (o) { if (o !== L && o.t > bandTop && o.t <= bandBot) bandBot = Math.floor(o.t) - 1; });
      var planeY = bandBot - bandTop + 1 >= PLANE_H + 2 ? Math.round((bandTop + bandBot + 1 - PLANE_H) / 2) : null;

      // The scene: to the right of the title, under the plane's lane, with room above the kid
      // for his speech bubble. The leftmost spot that fits wins.
      var fontPx = unit === 3 ? 16 : 14;
      meas.font = '700 ' + fontPx + 'px ' + FONT;
      var bw = Math.ceil(meas.measureText(SAY).width) + 20, bh = Math.round(fontPx * 1.25) + 12, tail = 6;   // CSS px
      var bubW = Math.ceil(bw * dpr / P), bubH = Math.ceil((bh + tail) * dpr / P);
      var minTop = planeY != null ? planeY + PLANE_H + 1 : bandTop;
      var x0 = Math.ceil(L.r) + 3;
      var spot = null;
      [[true, true], [false, true], [true, false], [false, false]].some(function (o) {
        var desk = o[0], talk = o[1];
        var w = (desk ? DESK_W + 1 : 0) + KID_W + 2 + ANT_W;
        var ground = Math.max(Math.ceil(L.b), minTop + ANT_H, talk ? bandTop + bubH + KID_H : 0);
        for (var x = x0; x + w <= AW - 1; x++) {
          var floor = AH - 2, blocked = false;
          for (var i = 0; i < obs.length && !blocked; i++) {
            var b = obs[i];
            if (b.r <= x || b.l >= x + w || b.b <= minTop) continue;
            if (b.t <= minTop) blocked = true;
            else floor = Math.min(floor, Math.floor(b.t) - 1);
          }
          if (blocked || ground > floor) continue;
          var kidX = x + (desk ? DESK_W + 1 : 0);
          var bubble = null;
          if (talk) {
            var top = ground - KID_H + 1 - bubH;
            var l = Math.max(x0, Math.min(AW - 1 - bubW, Math.round(kidX + KID_W / 2 - bubW / 2)));
            var hit = obs.some(function (b) { return b.r > l && b.l < l + bubW && b.b > top && b.t < top + bubH; });
            if (hit || l < x0) continue;
            bubble = { l: l, t: top, w: bw, h: bh, tail: tail, tailX: kidX + 6, font: fontPx };
          }
          spot = { deskX: desk ? x : null, kidX: kidX, antX: kidX + KID_W + 2, ground: ground, bubble: bubble };
          return true;
        }
        return false;
      });
      return { AW: AW, AH: AH, planeY: planeY, scene: spot };
    }

    // One picture: the scene (idle when f is null), the radio waves, the plane, the bubble.
    function paint(f, planeX) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      var sc = lay && lay.scene;
      if (sc) {
        var gr = sc.ground;
        if (sc.deskX != null) {
          for (var cx = sc.deskX + 13; cx <= sc.antX + 3; cx++) dot(cx, gr, PAL.M);   // the antenna's cable to the computer
          var deskTop = gr - DESK.length + 1;
          sprite(DESK, sc.deskX, deskTop);
          if (f && f.sweep != null) dot(sc.deskX + RING[f.sweep][0], deskTop + RING[f.sweep][1], '#c9ffe0');
          if (f && f.key != null) dot(sc.deskX + 10 + f.key, deskTop + 8, PAL.w);
          if (f && f.blip) dot(sc.deskX + 8, deskTop + 2, PAL.y);
        }
        var kidTop = gr - KID_H + 1 - (f && f.hop ? 1 : 0);
        sprite(f && f.cheer ? (f.cheer === 2 ? CHEER2 : CHEER) : f && f.look ? LOOK : TYPE, sc.kidX, kidTop);
        if (f && f.blink && !f.cheer) dot(sc.kidX + 4, kidTop + (f.look ? 3 : 4), PAL.S);
        if (f && f.sparks) SPARKS.forEach(function (sp, i) {
          if ((i + f.sparks) % 2) return;
          var x = sc.kidX + sp[0], y = kidTop + sp[1], c = i % 2 ? PAL.w : PAL.y;
          dot(x, y, c); dot(x - 1, y, c); dot(x + 1, y, c); dot(x, y - 1, c); dot(x, y + 1, c);
        });
        sprite(ANT, sc.antX, gr - ANT_H + 1, f && f.led ? null : { l: 'f' });
        if (f && f.waves) waves(sc.antX + 3, gr - ANT_H + 1, f.waves);
      }
      if (planeX != null && lay.planeY != null) plane(planeX, lay.planeY, run && run.tail);
      if (f && f.bubble && sc && sc.bubble) bubble(sc.bubble);
    }

    // Rings of radio waves spreading from the antenna's tip, left and right.
    function waves(tx, ty, ages) {
      ages.forEach(function (age) {
        var k = age / WAVE, r = 2 + Math.round(k * 7);
        ctx.globalAlpha = Math.max(0, 1 - k);
        for (var deg = -50; deg <= 50; deg += 8) {
          var a = deg * Math.PI / 180, dx = Math.round(Math.cos(a) * r), dy = Math.round(Math.sin(a) * r);
          dot(tx + dx, ty + 2 + dy, PAL.y);
          dot(tx - dx, ty + 2 + dy, PAL.y);
        }
        ctx.globalAlpha = 1;
      });
    }

    function plane(x, y, tail) {
      x = Math.round(x);
      if (document.documentElement.getAttribute('data-theme') === 'dark') {
        if (Math.floor(performance.now() / 600) % 2) dot(x + 9, y + 2, PAL.r);   // the beacon blinks at night
      } else {
        for (var i = 1; i <= 14; i += 2) { ctx.globalAlpha = 0.5 * (1 - i / 15); dot(x - i, y + 3, PAL.w); }   // a short contrail by day
        ctx.globalAlpha = 1;
      }
      sprite(PLANE, x, y, tail);
    }

    // A comic speech bubble with a pixel outline; the words in the page's own type.
    function bubble(b) {
      var x = Math.round(b.l * P), y = Math.round(b.t * P), w = Math.round(b.w * dpr), h = Math.round(b.h * dpr);
      var k = Math.max(1, Math.round(2 * dpr)), u = Math.max(1, Math.round(dpr * 2));
      ctx.fillStyle = PAL.k;
      ctx.fillRect(x + k, y, w - 2 * k, h);
      ctx.fillRect(x, y + k, w, h - 2 * k);
      ctx.fillStyle = PAL.w;
      ctx.fillRect(x + k, y + k, w - 2 * k, h - 2 * k);
      var tx = Math.round((b.tailX + 0.5) * P), steps = Math.max(2, Math.round(b.tail * dpr / u));
      for (var i = 0; i < steps; i++) {   // the tail points down at the kid
        var half = (steps - i) * u;
        ctx.fillStyle = PAL.k; ctx.fillRect(tx - half - k, y + h - k + i * u, 2 * half + 2 * k, u);
        ctx.fillStyle = PAL.w; ctx.fillRect(tx - half, y + h - k + i * u - (i ? 0 : k), 2 * half, u + (i ? 0 : k));
      }
      ctx.fillStyle = PAL.k; ctx.fillRect(tx - k, y + h - k + steps * u, 2 * k, k);
      ctx.fillStyle = '#1c2b4f';
      ctx.font = '700 ' + Math.round(b.font * dpr) + 'px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SAY, x + w / 2, y + h / 2 + Math.round(dpr / 2));
    }

    // The show's timeline, in seconds from the moment the plane is over the antenna.
    function frame(now) {
      if (!run) return;
      if (!lay) { run = null; schedule(5000); return; }
      var t = (now - run.t0) / 1000;
      var sc = lay.scene;
      var px = run.x0 + t * run.v;                                    // the plane's left edge
      var at = sc && lay.planeY != null ? (sc.antX + 3 - PLANE_W / 2 - run.x0) / run.v : run.fallback;
      var dt = t - at, f = idle(now);
      if (f && sc && dt > -2.6 && dt <= -0.4 && lay.planeY != null) f.look = true;
      if (sc && dt > -0.4) {
        var ages = [-0.4, 0, 0.4].map(function (s) { return dt - s; }).filter(function (a) { return a >= 0 && a < WAVE; });
        var blink = Math.floor(dt * 4) % 2 === 0;
        var clear = !sc.bubble || lay.planeY == null || sc.bubble.t >= lay.planeY + PLANE_H || px > sc.bubble.l + sc.bubble.w * dpr / P;
        f = {
          waves: ages,
          led: dt < CHEER_FOR && blink,
          blip: dt >= 0 && dt < CHEER_FOR && blink,
          cheer: dt >= 0.3 && dt < CHEER_FOR ? (dt < 1.9 && Math.floor(dt * 3.3) % 2 ? 2 : 1) : 0,
          hop: dt >= 0.3 && dt < 1.5 && Math.floor(dt * 3.3) % 2 === 0,
          sparks: dt >= 0.3 && dt < 2.1 ? 1 + Math.floor(dt * 4) % 2 : 0,
          look: dt < 0.3,
          sweep: Math.floor(now / 250) % 8,
          bubble: dt >= 0.5 && dt < CHEER_FOR && clear
        };
      }
      var flying = lay.planeY != null && px <= lay.AW + 2;
      paint(f, flying ? px : null);
      if (!flying && (!sc || dt >= CHEER_FOR)) { run = null; paint(idle(now)); schedule(30000 + Math.random() * 20000); return; }
      requestAnimationFrame(frame);
    }

    function go() {
      if (document.hidden || !lay) { schedule(5000); return; }
      run = { t0: performance.now(), v: unit === 3 ? 28 : 22, x0: -PLANE_W - 2, fallback: 1.5,   // art pixels a second
        tail: TAILS[Math.floor(Math.random() * TAILS.length)] };
      requestAnimationFrame(frame);
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(go, ms); }

    // Between flights: the radar sweeps, he types in bursts (keys light up) and blinks now and then.
    function idle(now) {
      if (still) return null;
      var typing = now % 7000 < 3200;
      return { sweep: Math.floor(now / 250) % 8, key: typing && Math.floor(now / 200) % 3 ? Math.floor(now / 200) * 7 % 4 : null, blink: now % 4300 < 160 };
    }

    // Re-measure whenever the title bar changes (data arriving, the weather line, fonts, resizing).
    function relayout() {
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = 0;
        lay = measure();
        if (!run && lay) paint(idle(performance.now()));
      });
    }

    return {
      start: function () {
        cv = $('pdx-banner');
        hud = document.querySelector('.hud');
        if (!cv || !hud || !cv.getContext) return;
        ctx = cv.getContext('2d');
        meas = document.createElement('canvas').getContext('2d');
        if (!ctx || !meas) return;
        if (window.ResizeObserver) new ResizeObserver(relayout).observe(hud);
        var inner = hud.querySelector('.hud-in');
        if (window.MutationObserver && inner) new MutationObserver(relayout).observe(inner, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
        window.addEventListener('resize', relayout);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
        relayout();
        if (!still) {
          schedule(3500);
          setInterval(function () { if (!run && lay && !document.hidden) paint(idle(performance.now())); }, 200);
        }
      }
    };
  })();

  /* ---- sound button (day and night come from the real sun: planedex-sky.js) ---- */

  function setupButtons() {
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
    loadFamilyInfo();
    Banner.start();
    if (TABS.indexOf(location.hash.slice(1)) >= 0) state.tab = location.hash.slice(1);
    $('pdx-tabs').addEventListener('scroll', menuEdges, { passive: true });
    window.addEventListener('resize', menuEdges);
    menuEdges();

    document.addEventListener('click', function (e) {
      var v = e.target.closest('.voice-btn');
      if (v) { Voice.play(v); return; }
      var t = e.target.closest('[data-code], [data-goto], [data-tab], [data-close], [data-rarity], [data-credits], [data-family], [data-more], [data-home], [data-quiz]');
      if (!t) return;
      if (t.hasAttribute('data-quiz')) {
        if (t.getAttribute('data-quiz') === 'pick') answerQuiz(+t.getAttribute('data-i'));
        else { Sound.select(); nextQuestion(); }
        return;
      }
      if (t.hasAttribute('data-home')) {  // the PLANEDEX title: back to the Dex
        e.preventDefault();
        closeSheet();
        Sound.select();
        selectTab('dex');
        window.scrollTo({ top: 0 });
        return;
      }
      if (t.hasAttribute('data-family')) { openFamily(t.getAttribute('data-family')); return; }
      if (t.hasAttribute('data-more')) {
        var which = t.getAttribute('data-more');
        if (which === 'radar') state.radarAll = true; else state.logAll = true;
        Sound.blip();
        renderToday(state.data);
        var next = which === 'radar' ? el.today.querySelectorAll('.radar-card')[RADAR_FIRST] : el.today.querySelectorAll('.log-line .link')[LOG_FIRST];
        if (next) next.focus({ preventScroll: true });
        return;
      }
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
