/* DVD Tracker, /tools/dvds/. Plain JavaScript, no libraries.

   Read-only on purpose: the collection is data/dvds.yaml, edited by
   hand and pushed. Hugo embeds it in the page as JSON (#dvd-data); this
   script renders it and searches it. Nothing is ever written back.

   Search is forgiving, because it gets used one-handed in a store.
   Case, punctuation, accents and a leading "The" don't matter;
   "spiderman" finds Spider-Man; Roman numerals, ordinals and number
   words match digits ("shrek 3" finds Shrek the Third); a small typo
   still finds the title; and words from a cover that aren't part of
   the title ("special edition", "complete series") are skipped when
   nothing matches them. A format word narrows the question:
   "skyfall blu-ray" asks whether you own the Blu-ray.

   Every query gets a verdict:
     own   - every word matched a title you have
     warn  - you have it, but not in the format you typed, or only a
             near-spelling matched ("Did you mean ...?")
     none  - nothing matched; similar titles are listed underneath */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  function $(id) { return doc.getElementById(id); }

  var dataEl = $('dvd-data');
  var listEl = $('dvd-list');
  if (!dataEl || !listEl || !window.JSON || !Array.prototype.includes) { return; }

  /* ---- constants ---------------------------------------------------- */

  var PREFS_KEY = 'cfworx-dvds-prefs';     /* remembered filters and sort only */
  var FORMAT_ORDER = ['dvd', 'bluray', '4k'];
  var FORMAT_NAME = { dvd: 'DVD', bluray: 'Blu-ray', '4k': '4K UHD' };
  var FORMAT_BADGE = { dvd: 'DVD', bluray: 'Blu-ray', '4k': '4K' };

  /* Words that don't have to match: articles, and the extra words
     printed on a cover that aren't part of the title. */
  var SOFT = new Set(('the a an of and in on at to for ' +
    'season seasons complete series collection collectors collector box set ' +
    'volume vol disc discs edition special extended directors cut unrated ' +
    'theatrical version widescreen fullscreen full screen remastered ' +
    'anniversary movie film').split(' '));

  /* Roman numerals, number words and ordinals, all mapped to digits. */
  var NUM = {
    i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8',
    ix: '9', x: '10', xi: '11', xii: '12',
    one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7',
    eight: '8', nine: '9', ten: '10',
    first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6',
    seventh: '7', eighth: '8', ninth: '9', tenth: '10'
  };

  var ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="m5.5 12.5 4.2 4.2 8.8-9.4"/></svg>',
    cross: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/></svg>',
    bang: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" d="M12 6v8"/><circle cx="12" cy="18.6" r="1.9" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    drive: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="1.6" y="4.2" width="12.8" height="7.6" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="11.4" cy="8" r="1.1" fill="currentColor"/><path d="M4.2 8h3.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    shelf: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1.8 13.6h12.4M3.6 12.8V4.6M6.2 12.8V3.4M8.8 12.8V5.6M10.8 12.8l2.2-7.6"/></g></svg>',
    box: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M2 5.2h12v8.4H2zM1.6 2.6h12.8v2.6H1.6z"/><path d="M6.4 8.2h3.2" stroke-linecap="round"/></g></svg>'
  };

  /* ---- small helpers -------------------------------------------------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  function readStore(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: fine */ }
  }

  function isoDay(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function prettyDate(iso) {
    var p = iso.split('-');
    return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }

  function dayLabel(iso) {
    if (!iso) { return 'Earlier'; }
    var now = new Date();
    if (iso === isoDay(now)) { return 'Today'; }
    now.setDate(now.getDate() - 1);
    if (iso === isoDay(now)) { return 'Yesterday'; }
    return prettyDate(iso);
  }

  /* ---- text normalization -------------------------------------------- */

  /* Lowercase, strip accents, "&" -> "and", drop apostrophes so
     "There's" and "theres" are the same word. */
  function fold(s) {
    return String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/\u00df/g, 'ss').replace(/\u00e6/g, 'ae').replace(/\u0153/g, 'oe').replace(/\u00f8/g, 'o')
      .replace(/&/g, ' and ')
      .replace(/['\u2018\u2019\u02bc`\u00b4]/g, '');
  }

  function words(s) {
    var f = fold(s).replace(/[^a-z0-9]+/g, ' ').trim();
    return f ? f.split(' ') : [];
  }

  /* Hyphenated and dotted words joined up: Spider-Man -> spiderman. */
  function joined(s) {
    var m = fold(s).match(/[a-z0-9]+(?:[-\u2010-\u2014.\/][a-z0-9]+)+/g) || [];
    return m.map(function (w) { return w.replace(/[^a-z0-9]/g, ''); });
  }

  function seasonNumbers(s) {
    var out = [];
    String(s || '').replace(/(\d+)\s*[-\u2013\u2014]\s*(\d+)|(\d+)/g, function (m, a, b, c) {
      if (c) {
        out.push(+c);
      } else {
        a = +a; b = +b;
        if (b >= a && b - a <= 40) { for (var i = a; i <= b; i++) { out.push(i); } }
        else { out.push(a, b); }
      }
      return m;
    });
    return out.filter(function (n, i) { return out.indexOf(n) === i; });
  }

  function seasonsText(s) {
    var nums = seasonNumbers(s);
    var pretty = String(s).trim().replace(/\s*[-\u2013\u2014]\s*/g, '\u2013');
    if (!nums.length) { return pretty; }
    return (nums.length === 1 ? 'Season ' : 'Seasons ') + pretty;
  }

  function formatKey(x) {
    var s = String(x).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s === 'dvd' || s === 'dvds') { return 'dvd'; }
    if (s === 'bluray' || s === 'bd' || s === 'br' || s === 'blu') { return 'bluray'; }
    if (s === '4k' || s === 'uhd' || s === '4kuhd' || s === 'uhd4k' || s === '4kultrahd') { return '4k'; }
    return s || null;
  }

  function rankFormat(f) {
    var i = FORMAT_ORDER.indexOf(f);
    return i === -1 ? 99 : i;
  }

  function byFormat(a, b) { return rankFormat(a) - rankFormat(b); }

  function toFormats(f) {
    var list = Array.isArray(f) ? f : [(f === undefined || f === null || f === '') ? 'dvd' : f];
    var out = [];
    list.forEach(function (x) {
      var k = formatKey(x);
      if (k && out.indexOf(k) === -1) { out.push(k); }
    });
    if (!out.length) { out.push('dvd'); }
    return out.sort(byFormat);
  }

  function formatName(f) { return FORMAT_NAME[f] || f.toUpperCase(); }

  function formatList(fs) {
    var names = fs.map(formatName);
    if (names.length < 2) { return names.join(''); }
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function cls(f) { return String(f).replace(/[^a-z0-9]/g, ''); }

  /* Where a title lives: "hdd01" (ripped to that media drive; the disc
     is boxed), "shelf" (Blu-rays stay on the shelf), or any label. */
  function locLabel(loc) {
    var s = String(loc || '').trim();
    if (!s) { return ''; }
    if (/^hdd[\s-]*\d+$/i.test(s)) { return s.replace(/[\s-]/g, '').toUpperCase(); }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function locIcon(loc) {
    if (/^(hdd|drive|disk|nas|ssd|usb)/i.test(String(loc).trim())) { return ICON.drive; }
    return /shelf/i.test(loc) ? ICON.shelf : ICON.box;
  }

  function locTag(loc) {
    return loc ? '<span class="loc">' + locIcon(loc) + esc(locLabel(loc)) + '</span>' : '';
  }

  /* ---- the collection ------------------------------------------------- */

  function makeItem(raw, index) {
    if (typeof raw === 'string') { raw = { title: raw }; }
    if (!raw || typeof raw !== 'object') { return null; }
    var title = String(raw.title === undefined || raw.title === null ? '' : raw.title).trim();
    if (!title) { return null; }

    var y = parseInt(raw.year, 10);
    var year = (y >= 1870 && y <= 2200) ? y : null;
    var tv = String(raw.type || '').toLowerCase() === 'tv';
    var kids = raw.kids === true || String(raw.kids).toLowerCase() === 'true';
    var text = function (v) { return (v === undefined || v === null) ? '' : String(v).trim(); };
    var seasons = text(raw.seasons);
    var notes = text(raw.notes);
    var location = text(raw.location);
    var added = String(raw.added || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(added)) { added = ''; }

    var tw = words(title);
    var tokens = new Set(tw);
    tw.forEach(function (w, i) {
      /* A lone first-word "I", "V" or "X" is a word (I Am Legend), not a numeral. */
      if (NUM[w] && !(i === 0 && w.length === 1)) { tokens.add(NUM[w]); }
    });
    joined(title).forEach(function (w) { tokens.add(w); });
    if (year) { tokens.add(String(year)); }
    if (tv) {
      tokens.add('tv');
      seasonNumbers(seasons).forEach(function (n) { tokens.add(String(n)); });
    }
    words(notes).forEach(function (w) { tokens.add(w); });
    words(location).forEach(function (w) { tokens.add(w); });
    if (location) { tokens.add(words(location).join('')); }   /* "hdd 01" finds hdd01 */

    var key = tw.slice();
    if (key.length > 1 && (key[0] === 'the' || key[0] === 'a' || key[0] === 'an')) { key.shift(); }

    return {
      id: 'm' + index,
      title: title,
      year: year,
      formats: toFormats(raw.format),
      tv: tv,
      kids: kids,
      seasons: seasons,
      notes: notes,
      location: location,
      added: added,
      order: index,
      words: tw,
      tokens: Array.from(tokens),
      compact: tw.join(''),
      sortKey: key.join(' '),
      first: key.length ? key[0] : ''
    };
  }

  function parseJSON(text) {
    try { return JSON.parse(text); } catch (e) { return null; }
  }

  var raw = parseJSON(dataEl.textContent);
  if (!Array.isArray(raw)) { raw = []; }

  var items = [];
  var byId = new Map();
  var formatsPresent = [];
  var locationsPresent = [];

  function rebuild() {
    items = [];
    raw.forEach(function (r, i) {
      var it = makeItem(r, i);
      if (it) { items.push(it); }
    });
    byId = new Map(items.map(function (it) { return [it.id, it]; }));

    formatsPresent = [];
    items.forEach(function (it) {
      it.formats.forEach(function (f) { if (formatsPresent.indexOf(f) === -1) { formatsPresent.push(f); } });
    });
    formatsPresent.sort(byFormat);

    /* Locations, compared case-insensitively ("HDD01" and "hdd01" are
       one place). '' collects titles with no location yet. */
    var seen = new Map();
    items.forEach(function (it) {
      var k = it.location.toLowerCase();
      if (!seen.has(k)) { seen.set(k, it.location); }
    });
    locationsPresent = Array.from(seen.keys()).sort(function (a, b) {
      if (!a) { return 1; }
      if (!b) { return -1; }
      return a.localeCompare(b, 'en', { numeric: true });
    }).map(function (k) { return { key: k, label: k ? locLabel(seen.get(k)) : 'No location' }; });
  }

  /* ---- search --------------------------------------------------------- */

  function parseQuery(input) {
    var s = fold(input)
      .replace(/\bblu[\s-]*rays?\b/g, ' bluray ')
      .replace(/\b4\s+k\b/g, ' 4k ')
      .replace(/\bultra[\s-]*hd\b/g, ' uhd ');
    var trailing = /\s$/.test(input);
    var toks = s.replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    var want = [];
    var terms = [];
    toks.forEach(function (t, i) {
      var f = (t === 'dvd' || t === 'dvds') ? 'dvd'
        : (t === 'bluray') ? 'bluray'
        : (t === '4k' || t === 'uhd') ? '4k' : null;
      if (f) {
        if (want.indexOf(f) === -1) { want.push(f); }
        return;
      }
      terms.push({
        raw: t,
        canon: (NUM[t] && !(i === 0 && t.length === 1)) ? NUM[t] : null,
        soft: SOFT.has(t) || /^\d+(st|nd|rd|th)$/.test(t),
        numeric: /^\d+$/.test(t),
        last: i === toks.length - 1 && !trailing
      });
    });
    return {
      text: input.trim(),
      terms: terms,
      want: want,
      compact: terms.map(function (t) { return t.raw; }).join(''),
      phrase: terms.map(function (t) { return t.raw; }).join(' ')
    };
  }

  /* Optimal string alignment distance (Levenshtein plus swapped
     neighbours), giving up early once it's past `max`. */
  function osa(a, b, max) {
    var m = a.length, n = b.length;
    if (Math.abs(m - n) > max) { return max + 1; }
    var r2 = new Array(n + 1).fill(0), r1 = new Array(n + 1), r0 = new Array(n + 1);
    for (var j = 0; j <= n; j++) { r1[j] = j; }
    for (var i = 1; i <= m; i++) {
      r0[0] = i;
      var low = i;
      for (j = 1; j <= n; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        var v = Math.min(r1[j] + 1, r0[j - 1] + 1, r1[j - 1] + cost);
        if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) {
          v = Math.min(v, r2[j - 2] + 1);
        }
        r0[j] = v;
        if (v < low) { low = v; }
      }
      if (low > max) { return max + 1; }
      var t = r2; r2 = r1; r1 = r0; r0 = t;
    }
    return r1[n];
  }

  function nearMiss(q, t, last) {
    var max = q.length >= 7 ? 2 : 1;
    if (Math.abs(q.length - t.length) <= max && osa(q, t, max) <= max) { return true; }
    /* Still typing: compare against the start of the word. */
    if (last && t.length > q.length) {
      for (var L = q.length - 1; L <= q.length + 1; L++) {
        if (L >= 4 && L < t.length && osa(q, t.slice(0, L), max) <= max) { return true; }
      }
    }
    return false;
  }

  /* 3 = whole word, 2 = start of a word, 1 = typo, 0 = no match.
     A number only counts as the start of something (a year being
     typed: "201" -> 2012) from three digits on; a lone "2" is a
     sequel number, and must not match 2004. */
  function matchTerm(term, it) {
    var q = term.raw;
    var best = 0;
    var prefixOk = !term.numeric || (term.last && q.length >= 3);
    for (var k = 0; k < it.tokens.length; k++) {
      var t = it.tokens[k];
      if (t === q || (term.canon && t === term.canon)) { return 3; }
      if (!best && prefixOk && t.length > q.length && t.lastIndexOf(q, 0) === 0) { best = 2; }
    }
    if (best) { return best; }
    if (q.length >= 5 && !term.numeric) {
      for (k = 0; k < it.tokens.length; k++) {
        if (it.tokens[k].length >= 4 && nearMiss(q, it.tokens[k], term.last)) { return 1; }
      }
    }
    return 0;
  }

  function score(it, q) {
    var r = { item: it, strong: false, typoOnly: false, points: 0, words: 0 };
    var matched = 0, missing = 0, solid = 0, typos = 0;
    q.terms.forEach(function (term) {
      var s = matchTerm(term, it);
      if (!s) {
        if (!term.soft) { missing++; }
        return;
      }
      matched++;
      r.points += s;
      if (s === 1) { typos++; }
      else if (!term.soft) {
        solid++;
        if (!term.numeric && term.raw.length >= 2) { r.words++; }
      }
    });

    if (!q.terms.length) {
      r.strong = true;                       /* the query was only a format word */
    } else if (matched && !missing) {
      r.strong = true;
    } else if (q.compact.length >= 4 && it.compact.indexOf(q.compact) !== -1) {
      r.strong = true;                       /* "spiderman", "euro trip", "biodome" */
      solid = Math.max(solid, 1);
      r.points += 4;
    }
    r.typoOnly = r.strong && q.terms.length > 0 && solid === 0 && typos > 0;

    if (q.terms.length) {
      var head = q.terms[0].raw;
      if (it.sortKey === q.phrase || it.words.join(' ') === q.phrase) { r.points += 8; }
      if (it.first && it.first.lastIndexOf(head, 0) === 0) { r.points += 2; }
    }
    if (q.want.length && hasWanted(it, q.want)) { r.points += 1; }
    return r;
  }

  function byTitle(a, b) {
    return a.sortKey.localeCompare(b.sortKey, 'en', { numeric: true }) || (a.year || 0) - (b.year || 0);
  }

  function hasWanted(it, want) {
    return it.formats.some(function (f) { return want.indexOf(f) !== -1; });
  }

  /* Did the query name the whole title, not just part of it? "jurassic
     park" only partly matches Jurassic Park III, so the answer names
     the title instead of a bare "You own it". */
  function isWholeTitle(it, q) {
    if (q.compact && (q.compact === it.compact || q.compact === it.sortKey.replace(/ /g, ''))) { return true; }
    return it.words.every(function (w, i) {
      if (SOFT.has(w)) { return true; }
      var alias = (NUM[w] && !(i === 0 && w.length === 1)) ? NUM[w] : null;
      return q.terms.some(function (t) {
        return t.raw === w || (alias && (t.raw === alias || t.canon === alias)) || (t.canon && t.canon === w);
      });
    });
  }

  function search(q) {
    var scored = items.map(function (it) { return score(it, q); });
    var strong = scored.filter(function (r) { return r.strong; });
    strong.sort(function (a, b) {
      return (b.points - a.points) || byTitle(a.item, b.item);
    });
    var sure = strong.filter(function (r) { return !r.typoOnly; });

    var state;
    var hits = sure;
    if (!strong.length) {
      state = 'none';
    } else if (!sure.length) {
      state = 'maybe';
    } else if (q.want.length) {
      hits = sure.filter(function (r) { return hasWanted(r.item, q.want); });
      state = hits.length ? 'own' : 'format';
    } else {
      state = 'own';
    }

    /* "Similar" means most of the words matched, or the title starts
       with the same word (usually the franchise: "terminator 2" ->
       The Terminator). One shared common word isn't enough. */
    var similar = [];
    if (state === 'none') {
      var wordTerms = q.terms.filter(function (t) { return !t.soft && !t.numeric && t.raw.length >= 2; });
      var need = Math.max(1, Math.ceil(wordTerms.length * 2 / 3));
      var lead = wordTerms[0];
      similar = scored.filter(function (r) {
        if (r.strong || !r.words) { return false; }
        if (r.words >= need) { return true; }
        var f = r.item.first;
        return !!lead && (f === lead.raw || (lead.last && f.length > lead.raw.length && f.lastIndexOf(lead.raw, 0) === 0));
      });
      similar.sort(function (a, b) {
        return (b.words - a.words) || (b.points - a.points) || byTitle(a.item, b.item);
      });
      similar = similar.slice(0, 8);
    }
    return { state: state, strong: strong, sure: sure, hits: hits, similar: similar };
  }

  /* ---- rendering ------------------------------------------------------ */

  /* Wraps the typed prefixes of each title word in <mark>. Works on the
     original text so punctuation and capitals stay as they are. */
  function highlight(title, terms) {
    if (!terms || !terms.length) { return esc(title); }
    var marks = [];
    var re = /[A-Za-z0-9\u00c0-\u024f'\u2019]+/g;
    var m;
    while ((m = re.exec(title))) {
      var word = m[0], start = m.index, norm = '', map = [];
      for (var k = 0; k < word.length; k++) {
        var f = fold(word[k]).replace(/[^a-z0-9]/g, '');
        for (var c = 0; c < f.length; c++) { norm += f[c]; map.push(start + k); }
      }
      if (!norm) { continue; }
      var best = 0;
      terms.forEach(function (t) {
        if (t.raw.length <= norm.length && norm.lastIndexOf(t.raw, 0) === 0 && t.raw.length > best) { best = t.raw.length; }
      });
      if (best) {
        for (k = map[0]; k <= map[best - 1]; k++) { marks[k] = true; }
      }
    }
    var out = '', open = false;
    for (var i = 0; i < title.length; i++) {
      if (marks[i] && !open) { out += '<mark>'; open = true; }
      if (!marks[i] && open) { out += '</mark>'; open = false; }
      out += esc(title[i]);
    }
    return open ? out + '</mark>' : out;
  }

  function badges(it) {
    return it.formats.map(function (f) {
      return '<span class="fmt fmt-' + cls(f) + '">' + esc(FORMAT_BADGE[f] || f.toUpperCase()) + '</span>';
    }).join('');
  }

  function subLine(it) {
    var bits = [];
    var kind = it.tv ? (it.kids ? "Kids' TV" : 'TV') : (it.kids ? 'Kids' : '');
    if (it.tv && it.seasons) {
      kind += ', ' + seasonsText(it.seasons).toLowerCase();
    }
    if (it.location) { bits.push(locTag(it.location)); }
    if (kind) { bits.push('<span>' + esc(kind) + '</span>'); }
    return bits.length ? '<span class="row-sub">' + bits.join('') + '</span>' : '';
  }

  function row(it, terms) {
    var spine = it.formats.map(function (f) { return '<i class="f-' + cls(f) + '"></i>'; }).join('');
    return '<li><button class="row" type="button" data-id="' + esc(it.id) + '">' +
      '<span class="spine" aria-hidden="true">' + spine + '</span>' +
      '<span class="row-main"><span class="row-title">' + highlight(it.title, terms) + '</span>' + subLine(it) + '</span>' +
      '<span class="row-end">' + (it.year ? '<span class="row-year">' + it.year + '</span>' : '') +
      '<span class="fmts">' + badges(it) + '</span></span>' +
      '</button></li>';
  }

  function shelf(list, terms) {
    return '<ul class="shelf">' + list.map(function (it) { return row(it, terms); }).join('') + '</ul>';
  }

  /* -- totals at the top: how many of each format -- */

  function paintTotals() {
    var n = { dvd: 0, bluray: 0, '4k': 0 };
    items.forEach(function (it) {
      it.formats.forEach(function (f) { if (n.hasOwnProperty(f)) { n[f]++; } });
    });
    var total = function (f, count, one, many) {
      return '<span class="total total-' + f + '"><b>' + count + '</b> ' + (count === 1 ? one : many) + '</span>';
    };
    totalsEl.innerHTML = total('dvd', n.dvd, 'DVD', 'DVDs') + ' ' +
      total('bluray', n.bluray, 'Blu-ray', 'Blu-rays') +
      (n['4k'] ? ' ' + total('4k', n['4k'], '4K UHD', '4K UHD') : '');
  }

  /* -- browse mode -- */

  var prefs = readStore(PREFS_KEY, {});
  if (!prefs || typeof prefs !== 'object') { prefs = {}; }
  prefs = {
    kind: ['all', 'movie', 'tv', 'kids'].indexOf(prefs.kind) === -1 ? 'all' : prefs.kind,
    format: typeof prefs.format === 'string' ? prefs.format : '',
    location: typeof prefs.location === 'string' ? prefs.location : null,   /* null = any */
    sort: ['title', 'newest', 'oldest', 'added', 'location'].indexOf(prefs.sort) === -1 ? 'title' : prefs.sort
  };

  function savePrefs() { writeStore(PREFS_KEY, prefs); }

  function passes(it) {
    if (prefs.kind === 'movie' && it.tv) { return false; }
    if (prefs.kind === 'tv' && !it.tv) { return false; }
    if (prefs.kind === 'kids' && !it.kids) { return false; }
    if (prefs.format && it.formats.indexOf(prefs.format) === -1) { return false; }
    if (prefs.location !== null && it.location.toLowerCase() !== prefs.location) { return false; }
    return true;
  }

  var SORTS = {
    title: byTitle,
    newest: function (a, b) { return ((b.year || 0) - (a.year || 0)) || byTitle(a, b); },
    oldest: function (a, b) { return ((a.year || 9999) - (b.year || 9999)) || byTitle(a, b); },
    added: function (a, b) {
      return (b.added || '').localeCompare(a.added || '') || byTitle(a, b);
    },
    location: function (a, b) {
      var x = a.location.toLowerCase(), y = b.location.toLowerCase();
      if (x !== y) {
        if (!x) { return 1; }
        if (!y) { return -1; }
        return x.localeCompare(y, 'en', { numeric: true });
      }
      return byTitle(a, b);
    }
  };

  function groupOf(it) {
    if (prefs.sort === 'title') {
      var c = it.sortKey.charAt(0);
      return /[a-z]/.test(c) ? c.toUpperCase() : '#';
    }
    if (prefs.sort === 'added') { return dayLabel(it.added); }
    if (prefs.sort === 'location') { return it.location ? locLabel(it.location) : 'No location'; }
    return it.year ? (Math.floor(it.year / 10) * 10) + 's' : 'Year unknown';
  }

  function chip(attr, value, label, n, on) {
    return '<button class="chip" type="button" data-' + attr + '="' + esc(value) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      esc(label) + ' <span class="n">' + n + '</span></button>';
  }

  function renderChips() {
    var count = function (fn) { return items.filter(fn).length; };
    var kinds = [
      ['all', 'All', items.length],
      ['movie', 'Movies', count(function (it) { return !it.tv; })],
      ['tv', 'TV', count(function (it) { return it.tv; })],
      ['kids', 'Kids', count(function (it) { return it.kids; })]
    ];
    if (prefs.kind !== 'all' && !kinds.some(function (k) { return k[0] === prefs.kind && k[2]; })) { prefs.kind = 'all'; }
    if (prefs.format && formatsPresent.indexOf(prefs.format) === -1) { prefs.format = ''; }
    if (prefs.location !== null && !locationsPresent.some(function (l) { return l.key === prefs.location; })) { prefs.location = null; }

    var html = kinds.filter(function (k) { return k[0] === 'all' || k[2]; }).map(function (k) {
      return chip('kind', k[0], k[1], k[2], prefs.kind === k[0]);
    }).join('');
    /* Format and location chips only once there's a choice to make. */
    if (formatsPresent.length > 1) {
      html += '<span class="chip-gap" aria-hidden="true"></span>' + formatsPresent.map(function (f) {
        return chip('format', f, FORMAT_BADGE[f] || f.toUpperCase(),
          count(function (it) { return it.formats.indexOf(f) !== -1; }), prefs.format === f);
      }).join('');
    }
    if (locationsPresent.length > 1) {
      html += '<span class="chip-gap" aria-hidden="true"></span>' + locationsPresent.map(function (l) {
        return chip('loc', l.key, l.label,
          count(function (it) { return it.location.toLowerCase() === l.key; }), prefs.location === l.key);
      }).join('');
    }
    chipsEl.innerHTML = html;
    sortEl.value = prefs.sort;
  }

  function renderBrowse() {
    renderChips();
    var shown = items.filter(passes).sort(SORTS[prefs.sort]);
    shownEl.textContent = (shown.length === items.length) ? plural(items.length, 'title') : shown.length + ' of ' + items.length;

    if (!items.length) {
      listEl.innerHTML = '<div class="empty"><p>No titles yet. They come from <code>data/dvds.yaml</code>.</p></div>';
      return;
    }
    if (!shown.length) {
      listEl.innerHTML = '<div class="empty"><p>Nothing matches these filters.</p><button class="btn-quiet" type="button" data-action="reset-filters">Show everything</button></div>';
      return;
    }
    var html = '';
    var current = null;
    var bucket = [];
    function flush() {
      if (!bucket.length) { return; }
      html += '<section class="group"><h2>' + esc(current) + '</h2>' + shelf(bucket) + '</section>';
      bucket = [];
    }
    shown.forEach(function (it) {
      var g = groupOf(it);
      if (g !== current) { flush(); current = g; }
      bucket.push(it);
    });
    flush();
    listEl.innerHTML = html;
  }

  /* -- search mode -- */

  var lastState = '';
  var lastVerdict = '';

  function verdictMark(icon) {
    return '<div class="verdict-mark" aria-hidden="true"><span class="disc"></span><span class="verdict-badge">' + icon + '</span></div>';
  }

  function titleWithYear(it) {
    return esc(it.title) + (it.year ? ' (' + it.year + ')' : '');
  }

  function whereLines(locs) {
    return locs.length ? '<p class="verdict-loc"><span class="visually-hidden">Location: </span>' + locs.map(locTag).join('') + '</p>' : '';
  }

  function whereLine(it) {
    return whereLines(it.location ? [it.location] : []);
  }

  /* Copies of the same film on separate lines (the DVD on a drive, the
     Blu-ray on the shelf) read as one answer: formats and locations
     of every copy of `it` among the results. */
  function copiesOf(it, results) {
    var fmts = [], locs = [], count = 0;
    results.forEach(function (r) {
      var x = r.item;
      if (x.sortKey !== it.sortKey || x.year !== it.year) { return; }
      count++;
      x.formats.forEach(function (f) { if (fmts.indexOf(f) === -1) { fmts.push(f); } });
      if (x.location && locs.indexOf(x.location) === -1) { locs.push(x.location); }
    });
    fmts.sort(byFormat);
    return { formats: fmts, locations: locs, count: count };
  }

  function renderSearch(q) {
    var res = search(q);
    var v = '';
    var mood = 'is-own';
    var it;
    var seasons = function (x) { return x.tv && x.seasons ? ' ' + esc(seasonsText(x.seasons)) + '.' : ''; };

    if (res.state === 'own') {
      var whole = res.hits.filter(function (r) { return isWholeTitle(r.item, q); });
      if (whole.length) {
        it = whole[0].item;
        var c = copiesOf(it, whole);
        var more = res.hits.length - c.count;
        v = '<h2>You own it</h2><p>' + titleWithYear(it) + ', on ' + esc(formatList(c.formats)) + '.' + seasons(it) +
          (more ? ' ' + more + ' more below.' : '') + '</p>' + whereLines(c.locations);
      } else if (res.hits.length === 1) {
        /* Partial match: say which title it is, so a sequel or a
           longer title can't pass for the one in your hand. */
        it = res.hits[0].item;
        v = '<h2>You own ' + esc(it.title) + '</h2><p>' + (it.year ? 'From ' + it.year + ', on ' : 'On ') +
          esc(formatList(it.formats)) + '.' + seasons(it) + '</p>' + whereLine(it);
      } else {
        v = '<h2>You own ' + res.hits.length + ' matches</h2><p>Open one for the details.</p>';
      }
      v = verdictMark(ICON.check) + '<div class="verdict-text">' + v + '</div>';
    } else if (res.state === 'format') {
      mood = 'is-warn';
      it = res.sure[0].item;
      var owned = copiesOf(it, res.sure);
      v = verdictMark(ICON.bang) + '<div class="verdict-text"><h2>You own it on ' + esc(formatList(owned.formats)) + '</h2>' +
        '<p>' + titleWithYear(it) + '. Not on ' + esc(formatList(q.want)) + '.</p>' + whereLines(owned.locations) + '</div>';
    } else if (res.state === 'maybe') {
      mood = 'is-warn';
      it = res.strong[0].item;
      v = verdictMark(ICON.bang) + '<div class="verdict-text"><h2>Did you mean ' + esc(it.title) + '?</h2>' +
        '<p>Closest spelling in your collection' + (it.year ? ', from ' + it.year : '') + '.</p>' + whereLine(it) + '</div>';
    } else {
      mood = 'is-none';
      v = verdictMark(ICON.cross) + '<div class="verdict-text"><h2>Not in your collection</h2>' +
        '<p>Nothing in your collection matches \u201c' + esc(q.text) + '\u201d.</p></div>';
    }

    /* Only touch the card when the answer changed: no flicker while
       typing, and screen readers don't hear the same answer twice.
       "is-new" lets the disc spin in once when the answer becomes yes. */
    if (v !== lastVerdict) {
      verdictEl.className = 'verdict ' + mood + (res.state !== lastState ? ' is-new' : '');
      verdictEl.innerHTML = v;
      lastVerdict = v;
    }
    lastState = res.state;
    verdictEl.hidden = false;

    var list = '';
    if (res.state === 'none') {
      if (res.similar.length) {
        list = '<h2 class="list-head">Similar titles you own</h2>' + shelf(res.similar.map(function (r) { return r.item; }), q.terms);
      }
    } else {
      var shown = res.strong.map(function (r) { return r.item; });
      if (q.want.length) {
        /* Copies in the asked-for format first. */
        shown.sort(function (a, b) { return (hasWanted(b, q.want) ? 1 : 0) - (hasWanted(a, q.want) ? 1 : 0); });
      }
      list = shelf(shown, q.terms);
    }
    listEl.innerHTML = list;
  }

  /* ---- page wiring ------------------------------------------------------ */

  var input = $('dvd-q');
  var clearBtn = $('dvd-clear');
  var form = $('dvd-search');
  var bar = $('dvd-searchbar');
  var verdictEl = $('dvd-verdict');
  var controls = $('dvd-controls');
  var chipsEl = $('dvd-chips');
  var sortEl = $('dvd-sort');
  var shownEl = $('dvd-shown');
  var totalsEl = $('dvd-totals');
  var toastEl = $('dvd-toast');

  var searching = false;
  var frame = 0;

  function render() {
    searching = input.value.trim().length > 0;
    controls.hidden = searching;
    if (searching) {
      renderSearch(parseQuery(input.value));
    } else {
      verdictEl.hidden = true;
      verdictEl.innerHTML = '';
      lastState = '';
      lastVerdict = '';
      renderBrowse();
    }
  }

  function schedule() {
    if (frame) { return; }
    frame = requestAnimationFrame(function () { frame = 0; render(); });
  }

  function isNarrow() { return !window.matchMedia('(min-width: 960px)').matches; }
  function isTouch() { return window.matchMedia('(pointer: coarse)').matches; }

  /* Marks where the search bar sits before it sticks: used to tell
     when it's stuck, and to scroll back to it. */
  var sentinel = doc.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  bar.parentNode.insertBefore(sentinel, bar);

  /* If you were scrolled down the list when you started typing, jump
     back up so the answer is right under the search box. */
  function revealResults() {
    if (!isNarrow()) { return; }
    var top = sentinel.getBoundingClientRect().top + window.pageYOffset;
    if (window.pageYOffset > top + 1) { window.scrollTo(0, top); }
  }

  input.addEventListener('input', function () {
    var was = searching;
    clearBtn.hidden = !input.value;
    if (!was && input.value.trim()) { revealResults(); }
    schedule();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      input.value = '';
      clearBtn.hidden = true;
      render();
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    render();
    if (isTouch()) { input.blur(); }   /* put the keyboard away so the answer is visible */
  });

  clearBtn.addEventListener('click', function () {
    input.value = '';
    clearBtn.hidden = true;
    render();
    input.focus();
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) { return; }
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) { return; }
    if (doc.querySelector('dialog[open]')) { return; }
    e.preventDefault();
    input.focus();
    input.select();
  });

  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) { return; }
    if (b.dataset.kind) {
      prefs.kind = b.dataset.kind;
    } else if (b.dataset.format) {
      prefs.format = prefs.format === b.dataset.format ? '' : b.dataset.format;
    } else if (b.hasAttribute('data-loc')) {
      var k = b.getAttribute('data-loc');
      prefs.location = prefs.location === k ? null : k;
    }
    savePrefs();
    render();
  });

  sortEl.addEventListener('change', function () {
    prefs.sort = sortEl.value;
    savePrefs();
    render();
  });

  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-id], [data-action]');
    if (!b) { return; }
    if (b.dataset.id) { openDetail(b.dataset.id); return; }
    if (b.dataset.action === 'reset-filters') {
      prefs.kind = 'all';
      prefs.format = '';
      prefs.location = null;
      savePrefs();
      render();
    }
  });

  /* Keep the sticky letter headings just under the sticky search bar. */
  function measureBar() { root.style.setProperty('--bar-h', bar.offsetHeight + 'px'); }
  measureBar();
  if (window.ResizeObserver) { new ResizeObserver(measureBar).observe(bar); }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---- toast ------------------------------------------------------------ */

  var toastTimer = 0;
  function toast(message, action) {
    toastEl.innerHTML = '<span>' + esc(message) + '</span>' + (action ? '<button type="button">' + esc(action.label) + '</button>' : '');
    if (action) {
      toastEl.querySelector('button').addEventListener('click', function () { toastEl.hidden = true; action.run(); });
    }
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, action ? 9000 : 3200);
  }

  /* ---- title details ------------------------------------------------------ */

  var detail = $('dvd-detail');
  var detailBody = $('dvd-detail-body');
  var canDialog = typeof detail.showModal === 'function';

  function closeDetail() {
    if (canDialog) { detail.close(); } else { detail.removeAttribute('open'); }
  }

  detail.addEventListener('click', function (e) {
    if (e.target === detail || e.target.closest('[data-close]')) { closeDetail(); }
  });

  function imdbUrl(it) {
    return 'https://www.imdb.com/find/?q=' + encodeURIComponent(it.title + (it.year ? ' ' + it.year : ''));
  }

  function openDetail(id) {
    var it = byId.get(id);
    if (!it) { return; }
    var facts = '';
    if (it.year) { facts += '<dt>Released</dt><dd>' + it.year + '</dd>'; }
    facts += '<dt>Type</dt><dd>' + (it.tv ? 'TV' : 'Movie') + (it.kids ? ', for kids' : '') + '</dd>';
    if (it.tv && it.seasons) { facts += '<dt>Seasons</dt><dd>' + esc(seasonsText(it.seasons).replace(/^Seasons? /, '')) + '</dd>'; }
    facts += '<dt>Format</dt><dd>' + esc(formatList(it.formats)) + '</dd>';
    if (it.location) { facts += '<dt>Location</dt><dd>' + locTag(it.location) + '</dd>'; }
    if (it.notes) { facts += '<dt>Notes</dt><dd>' + esc(it.notes) + '</dd>'; }
    if (it.added) { facts += '<dt>Added</dt><dd>' + esc(prettyDate(it.added)) + '</dd>'; }

    detailBody.innerHTML =
      '<div class="sheet-head"><h2 id="dvd-detail-title">' + esc(it.title) + '</h2>' +
      '<button class="icon-btn" type="button" data-close aria-label="Close">' + ICON.close + '</button></div>' +
      '<div class="detail-fmts">' + badges(it) + '</div>' +
      '<dl class="facts">' + facts + '</dl>' +
      '<div class="sheet-actions"><a class="btn-quiet" href="' + esc(imdbUrl(it)) + '" target="_blank" rel="noopener noreferrer">Look it up on IMDb</a></div>';
    if (canDialog) { detail.showModal(); } else { detail.setAttribute('open', ''); }
  }

  /* ---- theme ------------------------------------------------------------ */

  var themeBtn = $('dvd-theme');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var themeMetas = doc.querySelectorAll('meta[name="theme-color"]');

  function effectiveTheme() {
    var t = root.dataset.theme;
    if (t === 'dark' || t === 'light') { return t; }
    return darkQuery.matches ? 'dark' : 'light';
  }

  function paintTheme() {
    var dark = effectiveTheme() === 'dark';
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    if (root.dataset.theme) {
      for (var i = 0; i < themeMetas.length; i++) { themeMetas[i].setAttribute('content', dark ? '#0d1426' : '#eef0f4'); }
    }
  }

  themeBtn.hidden = false;
  themeBtn.addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* not remembered: fine */ }
    paintTheme();
  });
  if (darkQuery.addEventListener) { darkQuery.addEventListener('change', paintTheme); }
  paintTheme();

  /* ---- offline, install, updates ----------------------------------------- */

  var offlineEl = $('dvd-offline');
  function paintOnline() { offlineEl.hidden = navigator.onLine !== false; }
  window.addEventListener('online', paintOnline);
  window.addEventListener('offline', paintOnline);
  paintOnline();

  var installBtn = $('dvd-install');
  var installPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', function () {
    if (!installPrompt) { return; }
    installPrompt.prompt();
    installPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', function () { installBtn.hidden = true; });

  /* The service worker serves the saved copy first (instant, and it
     works with no signal), then fetches the live page in the
     background. When that one differs, it sends it here and the new
     list is swapped in without a reload. */
  function onFreshPage(html) {
    var fresh = new DOMParser().parseFromString(html, 'text/html');
    var el = fresh.getElementById('dvd-data');
    var next = el ? parseJSON(el.textContent) : null;
    var changed = false;
    if (Array.isArray(next) && JSON.stringify(next) !== JSON.stringify(raw)) {
      raw = next;
      rebuild();
      paintTotals();
      render();
      changed = true;
    }
    var src = function (d) {
      var s = d.querySelector('script[src*="/js/dvds"]');
      var c = d.querySelector('link[rel="stylesheet"]');
      return (s ? s.getAttribute('src') : '') + '|' + (c ? c.getAttribute('href') : '');
    };
    if (src(fresh) !== src(doc)) {
      toast(changed ? 'List updated, and the tracker has a new version.' : 'The tracker has a new version.',
        { label: 'Reload', run: function () { location.reload(); } });
    } else if (changed) {
      toast('List updated: ' + plural(items.length, 'title'));
    }
  }

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.addEventListener('message', function (e) {
      var m = e.data;
      if (m && m.type === 'dvd-page-updated' && typeof m.html === 'string') { onFreshPage(m.html); }
    });
    navigator.serviceWorker.register('/tools/dvds/sw.js', { scope: '/tools/dvds/' }).catch(function () {});
  }

  /* ---- start -------------------------------------------------------------- */

  rebuild();
  paintTotals();
  controls.hidden = false;

  var startQuery = new URLSearchParams(location.search).get('q');
  if (startQuery) {
    input.value = startQuery;
    clearBtn.hidden = false;
  }
  render();

  /* On a computer, be ready to type. On a phone, wait for a tap so the
     keyboard doesn't cover the list. */
  if (!isTouch() && !startQuery) { input.focus(); }
})();
