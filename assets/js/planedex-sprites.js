/* Planedex pixel sprites. Draws every aircraft as a 48x24 side-view
   pixel sprite from a handful of shape rules (fuselage, tail, wings,
   engines, props, rotors), then outlines it automatically. Planes not
   caught yet come out as silhouettes.

   Loaded before planedex.js, which calls
   PlanedexSprites.paint(canvas, code, types, silhouette).
   Canvases are drawn pixel by pixel; nothing here touches styles, so
   the site's strict CSP is fine with it. */
(function () {
  'use strict';

  var W = 48, H = 24;
  var COL = {
    o: '#15203a',  /* outline */
    w: '#f4f8ff',  /* body */
    g: '#c3d1e3',  /* belly */
    b: '#2a4a80',  /* windows */
    c: '#132546',  /* cockpit */
    e: '#aab6c6',  /* engine */
    i: '#47546a',  /* intakes, gear, struts */
    p: '#a4afbf',  /* prop blur */
    r: '#2b3653',  /* rotor blades */
    m: '#a5aeb8',  /* military grey */
    n: '#848f9b',  /* military belly */
    y: '#f5c534',  /* firefighter yellow */
    k: '#c42b2b'   /* firefighter red */
  };
  var NO_OUTLINE = { p: 1, r: 1 };
  var TYPE_HEX = {
    jet: '#2459c9', regional: '#0b78a6', heavy: '#6a3fd4', jumbo: '#c0185a',
    bizjet: '#0a776d', turboprop: '#c27a00', prop: '#3d8a16', rotor: '#d4500f',
    military: '#56682c', fire: '#c42b2b'
  };

  function Grid() { this.a = new Array(W * H); }
  Grid.prototype.px = function (x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) this.a[y * W + x] = c; };
  Grid.prototype.h = function (x0, x1, y, c) { for (var x = x0; x <= x1; x++) this.px(x, y, c); };
  Grid.prototype.v = function (x, y0, y1, c) { for (var y = y0; y <= y1; y++) this.px(x, y, c); };
  Grid.prototype.r = function (x0, y0, x1, y1, c) { for (var y = y0; y <= y1; y++) this.h(x0, x1, y, c); };
  Grid.prototype.get = function (x, y) { return (x < 0 || x >= W || y < 0 || y >= H) ? null : this.a[y * W + x]; };

  /* ---- shapes ---------------------------------------------------------- */
  /* x0/x1 tail and nose ends, y top row, h height, nose = how far the top
     rows tuck in at the nose, up = belly rows that sweep up to the tail.
     pods: [x, y, length, rows] under the wing; rear: [x, y, length] on
     the tail; hpods hang from a high wing; props: [x, y] wing nacelles. */
  var SHAPES = {
    narrow:    { x0: 6, x1: 42, y: 10, h: 6, nose: 3, up: 2, fin: { w: 8, h: 7 }, win: 'row', wing: [18, 30], pods: [[22, 17, 6, 2]] },
    narrowL:   { x0: 4, x1: 44, y: 10, h: 6, nose: 3, up: 2, fin: { w: 8, h: 7 }, win: 'row', wing: [18, 31], pods: [[22, 17, 6, 2]] },
    narrowMil: { x0: 6, x1: 42, y: 10, h: 6, nose: 3, up: 2, fin: { w: 8, h: 7 }, win: 'cock', wing: [18, 30], pods: [[22, 17, 6, 2]], mil: true },
    regional:  { x0: 10, x1: 38, y: 11, h: 5, nose: 3, up: 2, fin: { w: 7, h: 6 }, win: 'row', wing: [20, 29], pods: [[22, 16, 4, 2]] },
    rearjet:   { x0: 10, x1: 38, y: 11, h: 5, nose: 3, up: 2, fin: { w: 6, h: 6, t: true }, win: 'row', wing: [21, 30], rear: [13, 11, 6] },
    bizjet:    { x0: 14, x1: 36, y: 12, h: 4, nose: 3, up: 1, fin: { w: 5, h: 5, t: true }, win: 'few', wing: [22, 30], rear: [16, 12, 5] },
    vjet:      { x0: 16, x1: 34, y: 12, h: 4, nose: 3, up: 1, fin: { w: 4, h: 3 }, win: 'few', wing: [22, 29], top: [18, 10, 5] },
    wide:      { x0: 3, x1: 44, y: 9, h: 7, nose: 4, up: 3, fin: { w: 10, h: 8 }, win: 'row', wing: [16, 30], pods: [[20, 16, 8, 3]] },
    tankerW:   { x0: 3, x1: 44, y: 9, h: 7, nose: 4, up: 3, fin: { w: 10, h: 8 }, win: 'cock', wing: [16, 30], pods: [[20, 16, 8, 3]], boom: true, mil: true },
    jumbo:     { x0: 3, x1: 44, y: 10, h: 7, nose: 4, up: 3, fin: { w: 10, h: 8 }, win: 'row', hump: true, wing: [15, 31], pods: [[13, 17, 6, 3], [24, 17, 6, 3]] },
    lcf:       { x0: 3, x1: 44, y: 11, h: 7, nose: 4, up: 3, fin: { w: 10, h: 8 }, win: 'cock', bulge: true, wing: [15, 31], pods: [[13, 18, 6, 3], [24, 18, 6, 3]] },
    a380:      { x0: 3, x1: 44, y: 7, h: 10, nose: 5, up: 3, fin: { w: 10, h: 6 }, win: 'two', wing: [14, 31], pods: [[13, 17, 6, 3], [24, 17, 6, 3]] },
    airlifter: { x0: 5, x1: 42, y: 10, h: 7, nose: 2, up: 3, fin: { w: 8, h: 7, t: true }, win: 'cock', hwing: [15, 31], hpods: [[19, 11, 6, 2]], mil: true },
    herc:      { x0: 7, x1: 40, y: 11, h: 6, nose: 2, up: 3, fin: { w: 8, h: 7 }, win: 'cock', hwing: [17, 31], props: [[25, 11]], mil: true },
    lifter:    { x0: 2, x1: 45, y: 9, h: 9, nose: 3, up: 3, fin: { w: 10, h: 7, t: true }, win: 'cock', hwing: [14, 33], hpods: [[16, 10, 6, 2], [27, 10, 6, 2]] },
    bomber:    { x0: 4, x1: 43, y: 11, h: 4, nose: 2, up: 1, fin: { w: 8, h: 9 }, win: 'cock', hwing: [13, 33], pods: [[15, 16, 4, 2], [25, 16, 4, 2]], mil: true },
    tanker:    { x0: 6, x1: 42, y: 10, h: 6, nose: 3, up: 2, fin: { w: 8, h: 8 }, win: 'cock', wing: [17, 31], pods: [[14, 17, 4, 2], [25, 17, 4, 2]], boom: true, mil: true },
    singleprop:{ x0: 16, x1: 34, y: 12, h: 4, nose: 2, up: 1, fin: { w: 4, h: 5, t: true }, win: 'few', wing: [22, 30], prop: true },
    caravan:   { x0: 14, x1: 35, y: 12, h: 5, nose: 2, up: 1, fin: { w: 5, h: 5 }, win: 'few', hwing: [20, 30], strut: true, prop: true, gear: 'tri' },
    duster:    { x0: 15, x1: 35, y: 13, h: 4, nose: 2, up: 1, fin: { w: 4, h: 5 }, win: 'canopy', wing: [22, 30], prop: true, gear: 'tail', hopper: true, fire: true },
    twinprop:  { x0: 12, x1: 36, y: 12, h: 4, nose: 3, up: 1, fin: { w: 5, h: 5, t: true }, win: 'few', wing: [21, 31], props: [[27, 14]] },
    twinpropH: { x0: 12, x1: 36, y: 12, h: 4, nose: 3, up: 1, fin: { w: 5, h: 5 }, win: 'few', hwing: [20, 31], props: [[26, 11]] },
    dash8:     { x0: 8, x1: 40, y: 12, h: 5, nose: 3, up: 2, fin: { w: 6, h: 7, t: true }, win: 'row', hwing: [18, 32], props: [[25, 11]] },
    highwing:  { x0: 16, x1: 32, y: 13, h: 4, nose: 2, up: 1, fin: { w: 4, h: 4 }, win: 'cabin', hwing: [20, 30], strut: true, prop: true, gear: 'tri' },
    tailwheel: { x0: 16, x1: 32, y: 13, h: 4, nose: 2, up: 1, fin: { w: 4, h: 4 }, win: 'cabin', hwing: [20, 30], strut: true, prop: true, gear: 'tail' },
    lowwing:   { x0: 16, x1: 32, y: 13, h: 4, nose: 2, up: 1, fin: { w: 4, h: 4 }, win: 'canopy', wing: [21, 29], prop: true, gear: 'tri' },
    twinpiston:{ x0: 15, x1: 33, y: 13, h: 4, nose: 2, up: 1, fin: { w: 4, h: 5 }, win: 'canopy', wing: [20, 30], props: [[26, 15]] },
    scooper:   { x0: 10, x1: 37, y: 12, h: 6, nose: 2, up: 2, fin: { w: 6, h: 6 }, win: 'cock', hwing: [18, 31], props: [[22, 11], [29, 11]], fire: true }
  };

  var BY_CODE = {
    A388: 'a380', B742: 'jumbo', B744: 'jumbo', B748: 'jumbo', VC25: 'jumbo', BLCF: 'lcf',
    A124: 'lifter', C5M: 'lifter', C17: 'airlifter', C130: 'herc', B52: 'bomber',
    K35R: 'tanker', KC46: 'tankerW', P8: 'narrowMil', V22: 'tilt', CL2T: 'scooper', AT8T: 'duster',
    B752: 'narrowL', B753: 'narrowL', E145: 'rearjet', CRJ9: 'rearjet', CRJ7: 'rearjet',
    DH8D: 'dash8', SF50: 'vjet', PC12: 'singleprop', P46T: 'singleprop', C208: 'caravan',
    BE20: 'twinprop', MU2: 'twinpropH',
    C172: 'highwing', C72R: 'highwing', C182: 'highwing', T206: 'highwing',
    C185: 'tailwheel', M7: 'tailwheel',
    P28A: 'lowwing', P28R: 'lowwing', BE19: 'lowwing', SR20: 'lowwing', SR22: 'lowwing', S22T: 'lowwing',
    AEST: 'twinpiston', R22: 'heliS', R44: 'heliS', B212: 'heliMil'
  };

  function shapeFor(code, types) {
    if (BY_CODE[code]) return BY_CODE[code];
    types = types || [];
    var has = function (t) { return types.indexOf(t) >= 0; };
    if (has('rotor')) return has('military') ? 'heliMil' : 'heli';
    if (has('jumbo')) return 'jumbo';
    if (has('heavy')) return has('military') ? 'airlifter' : 'wide';
    if (has('regional')) return 'regional';
    if (has('bizjet')) return 'bizjet';
    if (has('turboprop')) return 'twinprop';
    if (has('prop')) return 'lowwing';
    if (has('military')) return 'narrowMil';
    return 'narrow';
  }

  /* ---- drawing ----------------------------------------------------------- */

  function plane(P) {
    var g = new Grid();
    var body = P.mil ? 'm' : P.fire ? 'y' : 'w';
    var belly = P.mil ? 'n' : P.fire ? 'k' : 'g';
    var x0 = P.x0, x1 = P.x1, y = P.y, h = P.h, bot = y + h - 1;
    var fw = P.fin ? P.fin.w : 3;
    var mid = Math.round((x0 + x1) / 2);

    /* tail fin: leading edge sweeps back toward the top */
    if (P.fin) {
      for (var r = 1; r <= P.fin.h; r++) {
        var xa = x0 + 1 - Math.floor(r / 3);
        var xb = x0 + 1 + fw - Math.round(r * (fw - 3) / P.fin.h);
        g.h(xa, xb, y - r, 'A');
      }
      if (P.fin.t) g.h(x0 - Math.floor(P.fin.h / 3) - 2, x0 + 4, y - P.fin.h, 'A');
    }
    /* upper deck (747) or the Dreamlifter's swollen back */
    if (P.hump) {
      g.h(x1 - 16, x1 - 5, y - 1, body);
      g.h(x1 - 14, x1 - 7, y - 2, body);
    }
    if (P.bulge) {
      for (var k = 1; k <= 3; k++) g.h(x0 + 5 + k * 2, x1 - 6 - k * 2, y - k, body);
    }
    if (P.hopper) g.h(mid - 2, mid + 2, y - 1, body);

    /* fuselage */
    for (var i = 0; i < h; i++) {
      var noseIn = Math.max(0, (P.nose || 3) - i);
      if (i === h - 1) noseIn = Math.max(noseIn, 1);
      var fromBottom = h - 1 - i;
      var tailIn = fromBottom < (P.up || 0) ? (P.up - fromBottom) * 3 : 0;
      g.h(x0 + tailIn, x1 - noseIn, y + i, i === h - 1 ? belly : body);
    }

    /* tailplane (a T-tail already has one on top of the fin) */
    if (!(P.fin && P.fin.t)) g.h(x0 - 2, x0 + 5, y + 1, 'A');

    /* windows, cockpit, cheatline */
    var wy = y + 1;
    if (P.win === 'row') {
      for (var wx = x0 + fw + 3; wx <= x1 - 6; wx += 2) g.px(wx, wy, 'b');
    } else if (P.win === 'two') {
      for (var w2 = x0 + fw + 3; w2 <= x1 - 7; w2 += 2) { g.px(w2, y + 2, 'b'); g.px(w2, y + 5, 'b'); }
    } else if (P.win === 'few') {
      for (var w3 = mid - 3; w3 <= x1 - 6; w3 += 3) g.px(w3, wy, 'b');
    } else if (P.win === 'cabin') {
      g.h(mid + 1, mid + 4, wy, 'b');
    } else if (P.win === 'canopy') {
      g.h(mid + 1, mid + 5, y - 1, 'b');
      g.h(mid + 2, mid + 4, y - 2, 'b');
    }
    if (P.hump) for (var uw = x1 - 13; uw <= x1 - 8; uw += 2) g.px(uw, y - 1, 'b');
    var cockRow = y + 1;
    var cockX = x1 - Math.max(0, (P.nose || 3) - 1);
    g.px(cockX - 1, cockRow, 'c');
    g.px(cockX - 2, cockRow, 'c');
    if (h >= 5 && P.win !== 'cock') g.h(x0 + fw + 2, x1 - 4, y + Math.floor(h / 2) + (P.win === 'two' ? 1 : 0), 'A');
    if (P.win === 'cock' && !P.mil && !P.fire && h >= 6) g.h(x0 + fw + 2, x1 - 4, y + Math.floor(h / 2), 'A');

    /* wings */
    if (P.wing) g.h(P.wing[0], P.wing[1], bot + 1, 'i');
    if (P.hwing) {
      g.h(P.hwing[0], P.hwing[1], y - 1, body);
      g.h(P.hwing[0] + 2, P.hwing[1] - 1, y - 2, body);
    }
    if (P.strut && P.hwing) {
      var sx = P.hwing[0] + 6;
      for (var s = 0; s < h; s++) g.px(sx - Math.floor(s / 2), y + s, 'i');
    }

    /* engines */
    (P.pods || []).forEach(function (q) {
      g.r(q[0], q[1], q[0] + q[2], q[1] + q[3] - 1, 'e');
      g.v(q[0] + q[2], q[1], q[1] + q[3] - 1, 'i');
      g.px(q[0] + 2, q[1] - 1, 'g');
    });
    (P.hpods || []).forEach(function (q) {
      g.r(q[0], q[1], q[0] + q[2], q[1] + q[3] - 1, 'e');
      g.v(q[0] + q[2], q[1], q[1] + q[3] - 1, 'i');
    });
    if (P.rear) {
      g.r(P.rear[0], P.rear[1], P.rear[0] + P.rear[2], P.rear[1] + 1, 'e');
      g.v(P.rear[0] + P.rear[2], P.rear[1], P.rear[1] + 1, 'i');
    }
    if (P.top) {
      g.r(P.top[0], P.top[1], P.top[0] + P.top[2], P.top[1] + 1, 'e');
      g.px(P.top[0] + P.top[2], P.top[1], 'i');
    }
    (P.props || []).forEach(function (q) {
      g.r(q[0] - 3, q[1], q[0] + 2, q[1] + 1, 'e');
      g.v(q[0] + 3, q[1] - 3, q[1] + 4, 'p');
      g.px(q[0] + 3, q[1], 'i');
    });
    if (P.prop) {
      var cy = y + Math.floor(h / 2);
      g.v(x1 + 1, y - 2, bot + 2, 'p');
      g.px(x1 + 1, cy, 'i');
    }

    /* landing gear on the little ones */
    if (P.gear) {
      var mx = P.gear === 'tail' ? x1 - 6 : mid - 1;
      g.v(mx, bot + 1, bot + 1, 'i');
      g.r(mx - 1, bot + 2, mx, bot + 3, 'i');
      if (P.gear === 'tri') { g.v(x1 - 3, bot + 1, bot + 1, 'i'); g.r(x1 - 3, bot + 2, x1 - 2, bot + 3, 'i'); }
      else g.px(x0 + 2, bot + 1, 'i');
    }
    if (P.boom) {
      for (var bm = 0; bm < 6; bm++) g.px(x0 + 5 - bm, bot + 1 + Math.floor(bm / 1.5), 'i');
    }
    return g;
  }

  function heli(small, mil) {
    var g = new Grid();
    var body = mil ? 'm' : 'w', belly = mil ? 'n' : 'g';
    var cx0 = small ? 22 : 20, cx1 = small ? 31 : 34, cy0 = small ? 11 : 10, cy1 = 16;
    for (var y = cy0; y <= cy1; y++) {
      var inL = y === cy0 ? 2 : y === cy0 + 1 ? 1 : 0;
      var inR = y <= cy0 + 2 ? 3 - (y - cy0) : y === cy1 ? 1 : 0;
      g.h(cx0 + inL, cx1 - inR, y, y === cy1 ? belly : body);
    }
    g.r(small ? 9 : 6, cy0 + 2, cx0, cy0 + 3, body);            /* tail boom */
    var tx = small ? 8 : 5;
    g.r(tx, cy0 - 1, tx + 2, cy0 + 3, 'A');                       /* tail fin */
    g.r(cx1 - 5, cy0 + 1, cx1 - 2, cy0 + 3, 'b');                 /* windshield */
    g.r(cx0 + 3, cy0 + 2, cx0 + 6, cy0 + 3, 'b');                 /* cabin window */
    g.h(cx0, cx1 - 1, cy0 + 4, 'A');                              /* stripe */
    var mx = Math.round((cx0 + cx1) / 2);
    g.v(mx, cy0 - 2, cy0 - 1, 'i');                               /* mast */
    g.h(small ? 12 : 7, small ? 41 : 46, cy0 - 3, 'r');          /* main rotor */
    g.v(tx + 1, cy0 - 4, cy0 - 2, 'r');                           /* tail rotor */
    g.h(tx - 1, tx + 3, cy0 - 3, 'r');
    g.h(cx0 - 2, cx1 + 1, cy1 + 3, 'i');                          /* skids */
    g.v(cx0 + 2, cy1 + 1, cy1 + 2, 'i');
    g.v(cx1 - 3, cy1 + 1, cy1 + 2, 'i');
    return g;
  }

  function tilt() {
    var g = new Grid();
    g.r(9, 8, 11, 12, 'A');
    for (var i = 0; i < 5; i++) {
      var noseIn = Math.max(0, 2 - i);
      g.h(8 + (i === 4 ? 3 : 0), 40 - noseIn, 12 + i, i === 4 ? 'n' : 'm');
    }
    g.h(18, 32, 11, 'm');
    g.r(24, 5, 26, 11, 'e');
    g.h(13, 37, 4, 'r');
    g.px(37, 13, 'c'); g.px(36, 13, 'c');
    g.h(16, 30, 17, 'i');
    return g;
  }

  function outline(g) {
    var out = new Grid();
    out.a = g.a.slice();
    function solid(x, y) { var k = g.get(x, y); return k && !NO_OUTLINE[k]; }
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (g.a[y * W + x]) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) out.a[y * W + x] = 'o';
      }
    }
    return out;
  }

  function build(shape) {
    if (shape === 'heli') return heli(false, false);
    if (shape === 'heliS') return heli(true, false);
    if (shape === 'heliMil') return heli(false, true);
    if (shape === 'tilt') return tilt();
    return plane(SHAPES[shape] || SHAPES.narrow);
  }

  var cache = {};
  function sheet(shape, accent, sil) {
    var key = shape + '|' + accent + '|' + (sil ? 1 : 0);
    if (cache[key]) return cache[key];
    var g = outline(build(shape));
    var c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    var ctx = c.getContext('2d');
    for (var i = 0; i < W * H; i++) {
      var k = g.a[i];
      if (!k) continue;
      ctx.fillStyle = sil ? (k === 'o' ? '#0b1020' : '#1f2942') : (k === 'A' ? accent : COL[k]);
      ctx.fillRect(i % W, Math.floor(i / W), 1, 1);
    }
    cache[key] = c;
    return c;
  }

  function paint(canvas, code, types, sil) {
    if (!canvas || !canvas.getContext) return;
    var shape = shapeFor(code, types);
    var accent = TYPE_HEX[(types && types[0]) || 'jet'] || TYPE_HEX.jet;
    var ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(sheet(shape, accent, sil), 0, 0);
  }

  window.PlanedexSprites = { paint: paint, shapeFor: shapeFor, shapes: Object.keys(SHAPES).concat(['heli', 'heliS', 'heliMil', 'tilt']), W: W, H: H };
})();
