/* Planedex sky: the page's background is a live pixel-art sky over Spokane.

   - Day and night follow the real sun in Spokane, worked out right here
     (no network needed), so there's no light/dark button: the page turns
     to its night colors a little after sunset and back a little before
     sunrise, and the sky glows orange and pink around both.
   - The weather comes from /api/planedex?sky (Open-Meteo, cached for ten
     minutes): clouds from the cloud cover, rain, snow, fog, storms and
     wildfire smoke, plus the temperature and air quality shown in the
     header. Without it the sky is simply clear.
   - Clouds drift with the wind. By day a little plane crosses now and
     then; at night stars twinkle and a plane's lights blink across.
   - One low-resolution canvas behind the page (4 screen pixels per sky
     pixel, so it matches the sprites), about 20 frames a second, paused
     while the tab is hidden. With reduced motion it's a still picture.
   - Loaded in <head> without defer, so the theme is right on first paint.
     The site's CSP blocks inline styles, and nothing here sets any. */
(function () {
  'use strict';

  var LAT = 47.6588, LON = -117.426;   // Spokane, the city (not the station)
  var PX = 4;                          // screen pixels per sky pixel
  var FPS = 20;
  var NIGHT_BELOW = -3;                // sun altitude (degrees) where the page goes dark
  var API = '/api/planedex?sky';
  var REFRESH_MS = 10 * 60 * 1000;
  var root = document.documentElement;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the sun ---------------------------------------------------------- */

  // The sun's height above the horizon in degrees (NOAA's short formulas,
  // good to a fraction of a degree, plenty for picking colors).
  function sunAltitude(date) {
    var rad = Math.PI / 180;
    var d = date.getTime() / 86400000 - 10957.5;               // days since J2000.0
    var g = (357.529 + 0.98560028 * d) * rad;
    var q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    var e = (23.439 - 0.00000036 * d) * rad;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var gmst = 18.697374558 + 24.06570982441908 * d;           // hours
    var ha = (gmst * 15 + LON) * rad - ra;
    var lat = LAT * rad;
    return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / rad;
  }

  var sun = sunAltitude(new Date());
  function setTheme() {
    var t = sun > NIGHT_BELOW ? 'light' : 'dark';
    if (root.dataset.theme !== t) root.dataset.theme = t;
  }
  setTheme();

  /* ---- colors ------------------------------------------------------------- */

  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  // Sky color at the top and at the horizon, by sun altitude.
  var GRADE = [
    [-12, '#08122b', '#1a2b57'],
    [-7, '#0f1c45', '#2e2c5c'],
    [-3, '#24387a', '#a9597a'],
    [0, '#3d6ab0', '#f08d68'],
    [4, '#5a9ee0', '#ffd49c'],
    [10, '#6cc4ff', '#cdeeff']
  ].map(function (g) { return [g[0], hex(g[1]), hex(g[2])]; });

  function skyColors(alt) {
    if (alt <= GRADE[0][0]) return [GRADE[0][1], GRADE[0][2]];
    for (var i = 1; i < GRADE.length; i++) {
      if (alt <= GRADE[i][0]) {
        var t = (alt - GRADE[i - 1][0]) / (GRADE[i][0] - GRADE[i - 1][0]);
        return [mix(GRADE[i - 1][1], GRADE[i][1], t), mix(GRADE[i - 1][2], GRADE[i][2], t)];
      }
    }
    var last = GRADE[GRADE.length - 1];
    return [last[1], last[2]];
  }

  /* ---- weather ------------------------------------------------------------ */

  // Open-Meteo's WMO weather codes.
  var LABELS = {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Freezing fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail'
  };
  function kindOf(code) {
    if (code == null || code <= 1) return 'clear';
    if (code === 2) return 'partly';
    if (code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'cloudy';
  }
  function intensityOf(code) {
    if ([51, 56, 61, 66, 71, 80, 85, 77].indexOf(code) >= 0) return 0.55;
    if ([55, 57, 65, 67, 75, 82, 86].indexOf(code) >= 0) return 1.6;
    if (code >= 95) return 1.4;
    return 1;
  }
  // US EPA air quality bands.
  function aqiBand(v) {
    if (v <= 50) return [1, 'Good'];
    if (v <= 100) return [2, 'Moderate'];
    if (v <= 150) return [3, 'Unhealthy for some'];
    if (v <= 200) return [4, 'Unhealthy'];
    if (v <= 300) return [5, 'Very unhealthy'];
    return [6, 'Hazardous'];
  }

  var wx = { kind: 'clear', cover: 10, wind: 6, windX: 1, intensity: 1, aqi: null };
  function useWeather(w) {
    var code = typeof w.code === 'number' ? w.code : null;
    var kind = kindOf(code);
    var cover = typeof w.cloud === 'number' ? clamp(w.cloud, 0, 100) : ({ clear: 10, partly: 45, cloudy: 95 }[kind] || 90);
    if (kind === 'rain' || kind === 'snow' || kind === 'drizzle' || kind === 'storm') cover = Math.max(cover, 85);
    var dirX = typeof w.windDir === 'number' ? -Math.sin(w.windDir * Math.PI / 180) : 1;  // wind FROM the west blows clouds east
    wx = {
      kind: kind, code: code, cover: cover,
      wind: typeof w.wind === 'number' ? w.wind : 6,
      windX: Math.abs(dirX) < 0.25 ? (dirX < 0 ? -0.25 : 0.25) : dirX,
      intensity: intensityOf(code), aqi: typeof w.aqi === 'number' ? w.aqi : null,
      temp: w.temp
    };
  }

  /* ---- the header readout --------------------------------------------------- */

  function iconFor(kind, night) {
    return { clear: night ? 'moon' : 'sun', partly: night ? 'mooncloud' : 'suncloud', cloudy: 'cloud', fog: 'fog',
      drizzle: 'rain', rain: 'rain', snow: 'snow', storm: 'storm' }[kind] || 'cloud';
  }
  function showWeather(w) {
    var box = document.getElementById('pdx-sky-now');
    if (!box) return;
    var night = sun <= NIGHT_BELOW;
    var label = LABELS[w.code] || '';
    if (night && w.code <= 1) label = w.code === 0 ? 'Clear night' : 'Mostly clear';
    var html = '<span class="sky-where">Spokane now</span>'
      + '<span class="sky-wx"><canvas class="pix-ico" width="12" height="12" data-icon="' + iconFor(kindOf(w.code), night) + '" aria-hidden="true"></canvas>'
      + (typeof w.temp === 'number' ? '<b>' + Math.round(w.temp) + '°F</b> ' : '') + label + '</span>';
    if (typeof w.aqi === 'number') {
      var b = aqiBand(w.aqi);
      html += '<span class="sky-aqi a' + b[0] + '" title="Air quality index (US EPA scale)">Air quality <b>' + Math.round(w.aqi) + '</b> ' + b[1] + '</span>';
    }
    html += '<a class="sky-src" href="https://open-meteo.com/" target="_blank" rel="noopener">Weather by Open-Meteo.com</a>';
    box.innerHTML = html;
    var c = box.querySelector('canvas');
    if (c && window.PlanedexBadges && window.PlanedexBadges.paintIcon) window.PlanedexBadges.paintIcon(c);
    box.hidden = false;
  }

  /* ---- the picture -------------------------------------------------------------- */

  var canvas, ctx, W = 0, H = 0, seed = 1;
  var stars = [], clouds = [], drops = [], plane = null, nextPlane = 0, flashUntil = 0, nextFlash = 0;
  var last = 0, raf = 0, lastShown = null;

  function rand() {  // small, repeatable random numbers (mulberry32)
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // A cloud's shape: round puffs on a flat bottom, as a 0/1/2/3 mask
  // (outside / body / shade underneath / lit top edge).
  function cloudMask(w, h) {
    var m = new Uint8Array(w * h), puffs = [], n = 3 + Math.floor(rand() * 3), x, y, i;
    for (i = 0; i < n; i++) {
      var r = h * (0.38 + rand() * 0.3);
      var cx = r + (w - 2 * r) * (i + 0.5) / n + (rand() - 0.5) * r * 0.6;
      puffs.push([cx, h - r * (0.85 + rand() * 0.3), r]);
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        for (i = 0; i < puffs.length; i++) {
          var dx = x + 0.5 - puffs[i][0], dy = y + 0.5 - puffs[i][1];
          if (dx * dx + dy * dy <= puffs[i][2] * puffs[i][2]) { m[y * w + x] = 1; break; }
        }
      }
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (!m[y * w + x]) continue;
        if (y >= h - 2) m[y * w + x] = 2;
        else if (y === 0 || !m[(y - 1) * w + x]) m[y * w + x] = 3;
      }
    }
    return m;
  }

  // Cloud colors (body, shade, lit edge) for the time of day and the weather.
  function cloudColors() {
    var day = clamp((sun + 6) / 12, 0, 1);
    var dusk = clamp(1 - Math.abs(sun - 1) / 6, 0, 1);
    var grey = clamp((wx.cover - 60) / 40, 0, 1) * 0.7 + (wx.kind === 'rain' || wx.kind === 'storm' ? 0.3 : 0);
    var body = mix(hex('#3b4a70'), hex('#ffffff'), day);
    var shade = mix(hex('#2a3557'), hex('#d8e3f0'), day);
    var lit = mix(hex('#5c6f9c'), hex('#ffffff'), day);
    body = mix(body, mix(hex('#2f394f'), hex('#b9c4cf'), day), clamp(grey, 0, 1));
    shade = mix(shade, mix(hex('#222a3c'), hex('#909dab'), day), clamp(grey, 0, 1));
    if (dusk > 0 && grey < 0.8) {  // sunset light on the clouds
      body = mix(body, hex('#ffc9b8'), dusk * 0.55);
      shade = mix(shade, hex('#c07a95'), dusk * 0.5);
      lit = mix(lit, hex('#ffe3a8'), dusk * 0.7);
    }
    return [null, body, shade, lit];
  }

  function paintCloud(cl, colors) {
    var c = cl.img || (cl.img = document.createElement('canvas'));
    c.width = cl.w;
    c.height = cl.h;
    var g = c.getContext('2d');
    var data = g.createImageData(cl.w, cl.h);
    for (var i = 0; i < cl.m.length; i++) {
      var k = cl.m[i];
      if (!k) continue;
      var col = colors[k];
      data.data[i * 4] = col[0];
      data.data[i * 4 + 1] = col[1];
      data.data[i * 4 + 2] = col[2];
      data.data[i * 4 + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }

  function recolor() {
    var colors = cloudColors();
    clouds.forEach(function (cl) { paintCloud(cl, colors); });
    lastShown = Math.round(sun * 2) + '|' + wx.kind + '|' + wx.cover;
  }

  // Lay out stars, clouds and rain for this window size and weather.
  function build() {
    seed = 20261108;
    var i, n;
    stars = [];
    n = Math.round(W * H / 130);
    for (i = 0; i < n; i++) {
      stars.push({ x: rand(), y: rand() * 0.78, big: rand() < 0.1, tw: rand() < 0.35, ph: rand() * 20 });
    }
    clouds = [];
    var per = W / 100 * (1 + wx.cover / 100 * 6);
    [[0, 0.55], [1, 1]].forEach(function (layer) {
      var count = Math.max(1, Math.round(per * (layer[0] ? 0.6 : 0.8)));
      for (var j = 0; j < count; j++) {
        var near = layer[0] === 1;
        var w = Math.round(near ? 26 + rand() * 20 : 15 + rand() * 12);
        var h = Math.round(w * (0.3 + rand() * 0.08));
        clouds.push({
          near: near, w: w, h: h, m: cloudMask(w, h),
          x: rand() * (W + w) - w,
          y: (near ? 0.1 + rand() * 0.62 : 0.04 + rand() * 0.5) * H,
          v: (near ? 1.3 + rand() * 0.9 : 0.6 + rand() * 0.5) * (0.6 + Math.min(wx.wind, 30) / 15),
          a: layer[1] * (near ? 1 : 0.8)
        });
      }
    });
    drops = [];
    var k = wx.kind;
    n = k === 'rain' || k === 'storm' ? W * H / 28 : k === 'drizzle' ? W * H / 60 : k === 'snow' ? W * H / 40 : 0;
    n = Math.min(1600, Math.round(n * wx.intensity));
    for (i = 0; i < n; i++) {
      drops.push({ x: rand() * W, y: rand() * H, v: k === 'snow' ? 6 + rand() * 6 : k === 'drizzle' ? 40 + rand() * 20 : 70 + rand() * 40,
        ph: rand() * 6.28, big: rand() < 0.15 });
    }
    recolor();
  }

  function resize() {
    var w = Math.max(40, Math.ceil((canvas.clientWidth || window.innerWidth) / PX));
    var h = Math.max(40, Math.ceil((canvas.clientHeight || window.innerHeight) / PX));
    if (w === W && Math.abs(h - H) < 6) return;  // phone toolbars sliding in and out
    W = canvas.width = w;
    H = canvas.height = h;
    build();
    draw(performance.now());
  }

  /* ---- planes ---- */

  // A little side-on airliner, facing right: tail, body, wing and engine.
  var PLANE = ['b.........', 'bb........', 'bbwwwwwwww.', '.wwwwwwwwwk', '...dd......'];
  function launchPlane(now) {
    var dir = rand() < 0.5 ? 1 : -1;
    plane = { dir: dir, x: dir > 0 ? -14 : W + 14, y: Math.round((0.08 + rand() * 0.42) * H), v: 6 + rand() * 5, trail: [] };
    nextPlane = now + (still ? 1e12 : 25000 + rand() * 50000);
  }
  function drawPlane(now) {
    var p = plane, night = sun <= NIGHT_BELOW;
    var body = night ? [42, 52, 82] : [244, 248, 255], tail = night ? [42, 52, 82] : [226, 64, 47], eng = night ? [30, 38, 62] : [138, 150, 168];
    // contrail on clear, bright days, high up
    if (!night && wx.cover < 70 && p.y < H * 0.4) {
      for (var i = 0; i < p.trail.length; i++) {
        var t = p.trail[i];
        ctx.fillStyle = css([255, 255, 255], 0.55 * (1 - i / p.trail.length));
        ctx.fillRect(t[0], t[1], 1, 1);
      }
    }
    for (var y = 0; y < PLANE.length; y++) {
      for (var x = 0; x < PLANE[y].length; x++) {
        var ch = PLANE[y].charAt(x);
        if (ch === '.') continue;
        var col = ch === 'b' ? tail : ch === 'd' ? eng : ch === 'k' ? [28, 43, 79] : body;
        ctx.fillStyle = css(col);
        ctx.fillRect(Math.round(p.dir > 0 ? p.x + x : p.x + 10 - x), p.y + y, 1, 1);
      }
    }
    if (night) {  // blinking lights: red beacon, white strobe at the tail
      var cx = Math.round(p.dir > 0 ? p.x : p.x + 10);
      if (Math.floor(now / 500) % 2) { ctx.fillStyle = '#ff4a3d'; ctx.fillRect(Math.round(p.x + 5), p.y + 1, 1, 1); }
      if (now % 1300 < 120) { ctx.fillStyle = '#ffffff'; ctx.fillRect(cx, p.y, 1, 1); }
      ctx.fillStyle = Math.floor(now / 700) % 2 ? '#3dff7a' : '#ff4a3d';
      ctx.fillRect(Math.round(p.x + 5), p.y + 4, 1, 1);
    }
  }

  /* ---- each frame ---- */

  function step(dt, now) {
    var i;
    for (i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      cl.x += cl.v * wx.windX * dt;
      if (wx.windX > 0 && cl.x > W) cl.x = -cl.w;
      if (wx.windX < 0 && cl.x < -cl.w) cl.x = W;
    }
    var k = wx.kind, slant = wx.windX * Math.min(wx.wind, 40) / 4;
    for (i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.v * dt;
      d.x += (k === 'snow' ? Math.sin(now / 900 + d.ph) * 3 + slant * 0.6 : slant) * dt;
      if (d.y > H) { d.y -= H + 3; d.x = rand() * W; }
      if (d.x > W) d.x -= W; else if (d.x < 0) d.x += W;
    }
    var clearEnough = wx.cover < 92 && k !== 'fog' && k !== 'storm';
    if (!plane && clearEnough && now > nextPlane) launchPlane(now);
    if (plane) {
      plane.x += plane.v * plane.dir * dt;
      plane.trail.unshift([Math.round(plane.dir > 0 ? plane.x - 1 : plane.x + 11), plane.y + 3]);
      if (plane.trail.length > 46) plane.trail.length = 46;
      if (plane.x < -60 || plane.x > W + 60) plane = null;
    }
    if (k === 'storm' && !still && now > nextFlash) {
      flashUntil = now + 140;
      nextFlash = now + 7000 + rand() * 12000;
    }
  }

  function draw(now) {
    if (!ctx) return;
    var night = sun <= NIGHT_BELOW, i;
    var sky = skyColors(sun);
    var grey = clamp((wx.cover - 55) / 45, 0, 1) * 0.6 + (wx.kind === 'rain' || wx.kind === 'storm' ? 0.2 : 0) + (wx.kind === 'fog' ? 0.35 : 0);
    var day = clamp((sun + 6) / 12, 0, 1);
    var top = mix(sky[0], mix(hex('#141a28'), hex('#9fb0c2'), day), clamp(grey, 0, 0.85));
    var low = mix(sky[1], mix(hex('#252d3b'), hex('#d6dee6'), day), clamp(grey, 0, 0.85));
    if (wx.aqi != null && wx.aqi > 100) {  // wildfire smoke turns the sky brown
      var smoke = clamp((wx.aqi - 100) / 250, 0, 0.6);
      top = mix(top, mix(hex('#3a2a1c'), hex('#c79a62'), day), smoke);
      low = mix(low, mix(hex('#5a4028'), hex('#e8c08a'), day), smoke);
    }
    // the sky, in bands like an old game
    var bands = 14;
    for (i = 0; i < bands; i++) {
      ctx.fillStyle = css(mix(top, low, i / (bands - 1)));
      ctx.fillRect(0, Math.floor(H * i / bands), W, Math.ceil(H / bands) + 1);
    }
    // stars
    var vis = clamp((NIGHT_BELOW - sun) / 7, 0, 1) * (1 - Math.min(wx.cover, 96) / 100);
    if (vis > 0.02) {
      // three brightness levels, so it's a handful of color changes a frame, not hundreds
      var levels = [0.8, 0.95, 0.35];
      for (var lv = 0; lv < 3; lv++) {
        ctx.fillStyle = css([255, 250, 225], vis * levels[lv]);
        for (i = 0; i < stars.length; i++) {
          var s = stars[i];
          var on = Math.sin(now / 700 + s.ph) > -0.2;
          if ((s.tw ? (on ? 1 : 2) : 0) !== lv) continue;
          ctx.fillRect(Math.floor(s.x * W), Math.floor(s.y * H), 1, 1);
        }
      }
      ctx.fillStyle = css([255, 250, 225], vis * 0.4);
      for (i = 0; i < stars.length; i++) {  // a little cross of light around the bright ones
        if (!stars[i].big) continue;
        var sx = Math.floor(stars[i].x * W), sy = Math.floor(stars[i].y * H);
        ctx.fillRect(sx - 1, sy, 1, 1); ctx.fillRect(sx + 1, sy, 1, 1);
        ctx.fillRect(sx, sy - 1, 1, 1); ctx.fillRect(sx, sy + 1, 1, 1);
      }
    }
    // a gray cloud deck when it's overcast
    if (wx.cover >= 80) {
      var deck = mix(hex('#262f45'), hex('#c3ccd6'), day);
      var deep = Math.round(H * (0.12 + (wx.cover - 80) / 20 * 0.16));
      ctx.fillStyle = css(deck, 0.9);
      ctx.fillRect(0, 0, W, deep);
      for (var x = 0; x < W; x++) {  // a lumpy bottom edge
        var bump = Math.round(2 + Math.sin(x * 0.35) * 1.5 + Math.sin(x * 0.11 + 1) * 2);
        ctx.fillRect(x, deep, 1, Math.max(0, bump));
      }
    }
    // far clouds, the plane, near clouds
    for (i = 0; i < clouds.length; i++) {
      if (clouds[i].near) continue;
      ctx.globalAlpha = clouds[i].a;
      ctx.drawImage(clouds[i].img, Math.round(clouds[i].x), Math.round(clouds[i].y));
    }
    ctx.globalAlpha = 1;
    if (plane) drawPlane(now);
    for (i = 0; i < clouds.length; i++) {
      if (!clouds[i].near) continue;
      ctx.globalAlpha = clouds[i].a;
      ctx.drawImage(clouds[i].img, Math.round(clouds[i].x), Math.round(clouds[i].y));
    }
    ctx.globalAlpha = 1;
    // rain, drizzle or snow
    if (drops.length) {
      var k = wx.kind;
      ctx.fillStyle = k === 'snow' ? (night ? 'rgba(225,235,255,0.85)' : 'rgba(255,255,255,0.95)')
        : (night ? 'rgba(150,175,220,0.55)' : 'rgba(225,238,255,0.7)');
      for (i = 0; i < drops.length; i++) {
        var d = drops[i];
        if (k === 'snow') ctx.fillRect(Math.floor(d.x), Math.floor(d.y), d.big ? 2 : 1, d.big ? 2 : 1);
        else ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1, k === 'drizzle' ? 2 : 3);
      }
    }
    // fog: a soft white veil with slow bands
    if (wx.kind === 'fog') {
      var fogc = night ? [120, 130, 150] : [235, 240, 245];
      ctx.fillStyle = css(fogc, 0.28);
      ctx.fillRect(0, 0, W, H);
      for (i = 0; i < 3; i++) {
        var fy = Math.round(H * (0.45 + i * 0.17) + Math.sin(now / 9000 + i) * 3);
        ctx.fillStyle = css(fogc, 0.32);
        ctx.fillRect(0, fy, W, Math.round(H * 0.07));
      }
    }
    // lightning: one soft flash, never strobing
    if (now < flashUntil) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 2) return;
    var dt = Math.min(0.25, (now - (last || now)) / 1000);
    last = now;
    step(dt, now);
    draw(now);
  }
  function run() {
    if (still || raf || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Once a minute: where's the sun now? Flip the theme and recolor at dusk and dawn.
  function tick() {
    sun = sunAltitude(new Date());
    setTheme();
    var key = Math.round(sun * 2) + '|' + wx.kind + '|' + wx.cover;
    if (key !== lastShown && canvas) { recolor(); draw(performance.now()); }
  }

  var shown = null;
  function fetchWeather() {
    fetch(API, { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (w) {
        if (!w || w.error) return;
        var before = wx.kind + '|' + wx.cover;
        useWeather(w);
        shown = w;
        showWeather(w);
        if (canvas && before !== wx.kind + '|' + wx.cover) build();
        if (canvas) draw(performance.now());
      })
      .catch(function () { /* keep the clear sky */ });
  }

  function start() {
    canvas = document.createElement('canvas');
    canvas.className = 'sky';
    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    document.body.insertBefore(canvas, document.body.firstChild);
    root.classList.add('sky-on');
    nextPlane = performance.now() + (still ? 1e12 : 4000);
    resize();
    window.addEventListener('resize', function () { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); return; }
      tick();
      run();
    });
    setInterval(function () { tick(); if (shown) showWeather(shown); }, 60000);
    fetchWeather();
    setInterval(fetchWeather, REFRESH_MS);
    run();
  }

  window.PlanedexSky = { sunAltitude: sunAltitude, night: function () { return sun <= NIGHT_BELOW; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
