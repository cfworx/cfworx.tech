/* Planedex badge art: pixel medals for the collections, pilot wings for
   achievements and stars for the secrets, drawn on small canvases the way
   the plane sprites are. All original artwork.

   PlanedexBadges.paint(canvas) reads the canvas's data attributes:
     data-look   "medal" (collections), "wings" (achievements),
                 "star" (an earned secret) or "mystery" (a hidden one)
     data-icon   one of the icon names below
     data-metal  bronze, silver, gold, platinum or steel (not earned yet)
     data-ribbon an index into RIBBONS, for medals
     data-tint   optional color swaps for the icon, like "y:p,b:q"

   PlanedexBadges.paintIcon(canvas) draws just the data-icon (12x12). */
(function () {
  'use strict';

  var W = 40, H = 34;
  var INK = '#1c2b4f';
  var PAL = {
    k: '#1c2b4f', w: '#ffffff', r: '#e2402f', b: '#2f6fe4', s: '#8ccaff', y: '#ffcc33', g: '#3faa55',
    o: '#f08a24', p: '#8b5cf6', n: '#8a5a3b', e: '#9aa6b8', d: '#4a5568', c: '#43c6db', m: '#ff7eb6',
    l: '#b6ef6a', t: '#f3dfb6', h: '#fff3c4', v: '#5b2f91', a: '#c9302c', f: '#2b8a3e', q: '#1f4fb3'
  };
  // 12x12 icons, top row first; '.' is see-through, letters are PAL colors.
  var ICONS = {
    arrowup: '.....kk..... ....kyyk.... ...kyyyyk... ..kyyyyyyk.. .kkkkyykkkk. ....kyyk.... ..kkkyykkk.. .kwwkyykwwk. kwwwwkkwwwwk kwwwwwwwwwwk .kkkkkkkkkk. ............',
    balloon: '...kkkkkk... ..krrwwrrk.. .krrrwwrrrk. .krrrwwrrrk. .krrrwwrrrk. ..krrwwrrk.. ...krwwrk... ....kkkk.... ....k..k.... ...kkkkkk... ...knnnnk... ...kkkkkk...',
    binoculars: '............ ..kkk..kkk.. .kdddkkkdddk .kdddkkdddk. kddddddddddk kdkkkddkkkdk kkssskkssskk kkssskkssskk kdkkkddkkkdk .kkkk..kkkk. ............ ............',
    bomber: '............ ............ .....kk..... ....kddk.... ...kddddk... ..kddddddk.. .kddddddddk. kddddddddddk kdkdkddkdkdk .k.k.kk.k.k. ............ ............',
    boomerang: '............ kkkkk....... koooook..... kkkkooook... ....kkoook.. .......kook. .......kook. ......kook.. .....kook... ....kook.... ....kkk..... ............',
    box: '............ ..kkkkkkkk.. .knnnnnnnnk. kkkkkkkkkkkk knnntnnnnnnk knnntnnnnnnk kkkktkkkkkkk knnntnnnnnnk knnntnnnnnnk knnntnnnnnnk kkkkkkkkkkkk ............',
    brush: '.........kk. ........knk. .......knk.. ......knk... .....knk.... ....kkkk.... ...kbbbk.... ..kbbbbk.... .kbbbbk..... kbbbbk...... kbbkk....... kkk.........',
    cactus: '.....kk..... ....kgfk.... ..k.kgfk.... .kgkkgfk.k.. .kgfkgfkkgk. .kggggfkgfk. ..kkkgfgggk. ....kgfkkk.. ....kgfk.... kkkkkkkkkkkk kttttttttttk kkkkkkkkkkkk',
    calendar: '..kk....kk.. .kkkkkkkkkk. .krrrrrrrrk. .kkkkkkkkkk. .kwwwwwwwwk. .kwkwkwkwwk. .kwwwwwwwwk. .kwkwkwkwwk. .kwwwwwwwwk. .kwkwkwrrwk. .kwwwwwrrwk. .kkkkkkkkkk.',
    clipboard: '....kkkk.... ..kkeeeekk.. .knkkkkkknk. .knwwwwwwnk. .knwwwwwgnk. .knwwwwggnk. .knwgwggwnk. .knwggwwwnk. .knwwgwwwnk. .knwwwwwwnk. .knnnnnnnnk. .kkkkkkkkkk.',
    clock: '...kkkkkk... ..kwwwwwwk.. .kwwwwkwwwk. kwwwwwkwwwwk kwwwwwkwwwwk kwwwwwkkkwwk kwwwwwwwwwwk kwkwwwwwwkwk .kwwwwwwwwk. ..kwwwkwwk.. ...kkkkkk... ............',
    cloud: '............ ............ ....kkkk.... ...kwwwwk... .kkkwwwwkkk. kwwwwwwwwwwk kwwwwwsswwwk kwwwwwwwwwwk .kkkkkkkkkk. ............ ............ ............',
    clover: '............ ...kk..kk... ..kggkkggk.. ..kgggggfk.. ...kgggfk... kkkkkgfkkkkk kggggggggffk kgggkgfkgffk .kkk.kfk.kk. .....kfk.... ......kk.... ............',
    compass: '...kkkkkk... ..kwwwwwwk.. .kwwwrrwwwk. kwwwwrrwwwwk kwwwwrrwwwwk kwwwwkkwwwwk kwwwwbbwwwwk kwwwwbbwwwwk .kwwwbbwwwk. ..kwwwwwwk.. ...kkkkkk... ............',
    crown: '............ k....k....k. kyk.kyk.kyk. kyykyyykyyk. kyyyyyyyyyk. kyyryyyryyk. kyyyyyyyyyk. kkkkkkkkkkk. knnnnnnnnnk. kkkkkkkkkkk. ............ ............',
    dex: '..kkkkkkkk.. .kwwwwwwwwk. .kwsssssswk. .kwsskssswk. .kwskkksswk. .kwsskssswk. .kwggggggwk. .kwwwwwwwwk. .kwkkkkkwwk. .kwwwwwwwwk. .kwkkkwwwwk. ..kkkkkkkk..',
    drop: '.....kk..... .....kk..... ....kssk.... ....kssk.... ...kssbsk... ..kssbbbsk.. ..kwsbbbbk.. .kwssbbbbbk. .kwsbbbbbbk. ..kbbbbbbk.. ...kkbbkk... .....kk.....',
    drumstick: '............ ...kkkk..... ..knnnnk.... .knnnnnnk... .knnnnnnk... .knnnnnk.... ..knnnk..... ...kkwk..... .....kwk.... ....kwwwk... ....kwkwk... .....k.k....',
    eagle: '............ k....kk....k kk..kwwk..kk kdk.kwyk.kdk kddkkwwkkddk .kddddddddk. ..kddddddk.. ...kddddk... ...kdkkdk... ..kyk..kyk.. ............ ............',
    familytree: '....kkkk.... ....kyyk.... ....kyyk.... ....kkkk.... .....kk..... ..kkkkkkkk.. ..kk....kk.. .kkkk..kkkk. .kggk..kbbk. .kggk..kbbk. .kkkk..kkkk. ............',
    fighter: '.....kk..... ....kddk.... ....kdsk.... ....kddk.... ...kddddk... ..kdddddddk. .kddddddddk. kdddkddkdddk kkkkkddkkkkk ...kddddk... ..kddkkddk.. ..kkk..kkk..',
    firework: '.....k...... ..k..y..k... ...k.y.k.... ....kyk..... kyyyyryyyyk. ....kyk..... ...k.y.k.... ..k..y..k... .....k...... ..........k. .........kpk ..........k.',
    flame: '....k....... ...kok...... ...kook..k.. ..kooook.kk. ..kooyook.k. .koooyyook.. .kooyyyyook. kooyyhyyook. kooyyhhyyok. kooyyhhyyok. .kooyyyyok.. ..kkkkkkk...',
    frog: '............ ..kk....kk.. .kwkk..kkwk. .kkgggggggk. kgggggggggk. kgkkkkkkkgk. kgggggggggk. .kgggggggk.. kgk.....kgk. kgk.....kgk. kkkk...kkkk. ............',
    gem: '............ ..kkkkkkkk.. .kmpppmpppk. kmpppmmpppvk kkkkkkkkkkkk .kpppmpppvk. ..kppmppvk.. ...kpmpvk... ....kppk.... .....kk..... ............ ............',
    giant: '............ ....kkk..... ...kwbwk.... ...kwwwk.... kkkkwwwkkkk. kwwwwwwwwwk. kbkkwwwkkbk. ...kwwwk.... ..kkwwwkk... .kwwwwwwwk.. .kkkkkkkkk.. ............',
    gift: '...kk..kk... ..krrkkrrk.. ...kkrrkk... kkkkkrrkkkkk kgggkrrkgggk kkkkkrrkkkkk .kggkrrkggk. .kggkrrkggk. .kggkrrkggk. .kggkrrkggk. .kkkkkkkkkk. ............',
    globe: '...kkkkkk... ..kbbggbbk.. .kbgggbbbbk. kbbgggbbggbk kbbbggbbgggk kbbbbgbbbggk kbgbbbbbbbbk kbggbbbgbbbk kbgggbbggbbk .kbggbbbbbk. ..kbbbbbbk.. ...kkkkkk...',
    globering: '...kkkkkk... ..kbbggbbk.. .kbggbbbyyk. kbbgggbyybbk kbbbgyybgggk kbbyybbbbggk kbyybbbbbbbk kyybbbgbbbbk kybgggbbggbk .kbggbbbbbk. ..kbbbbbbk.. ...kkkkkk...',
    hat: '..........kk ........kwwk ......kkrkk. .....krrrk.. ....krrrrk.. ...krrrrrk.. ..krrrrrrrk. .krrrrrrrrk. kwwwwwwwwwwk kwwwwwwwwwwk .kkkkkkkkkk. ............',
    heart: '............ .kkk...kkk.. kmmmk.kmmrk. kmwmmkmmrrk. kmmmmmmrrrk. kmmmmmrrrrk. .kmmmrrrrk.. ..kmrrrrk... ...krrrk.... ....krk..... .....k...... ............',
    heli: 'kkkkkkkkkkk. ....kk...... ..kkkkkk.... .kssbbbbk... kssbbbbbbkkk kbbbbbbbbbbk .kbbbbbbbk.k ..kkkkkkk... ..k.....k... .kkkkkkkkk.. ............ ............',
    helmet: '............ ...kkkkkk... ..kwwwwwwk.. .kwwrrrrwwk. .kwwwwwwwwk. kwwkkkkkkwwk kwkssssssskk kwkssssssskk kwwkkkkkkkwk .kwwwwwwwwk. ..kkkkkkkk.. ............',
    hourglass: 'kkkkkkkkkkkk knnnnnnnnnnk .kwyyyyyywk. ..kwyyyywk.. ...kwyywk... ....kwwk.... ....kwwk.... ...kwwywk... ..kwwyyywk.. .kwyyyyyywk. knnnnnnnnnnk kkkkkkkkkkkk',
    house: '.....kk..... ....krrk.... ...krrrrk... ..krrrrrrk.. .krrrrrrrrk. kkkkkkkkkkkk .kttttttttk. .ktkktkkttk. .ktkktknntk. .kttttknntk. .kttttknntk. .kkkkkkkkkk.',
    jumbo: '............ ............ ...........k ..kkkk....kk .kwswkkkkkwk kwwwwwwwwwwk kwwwwwwwwwwk .kbbbbbbbbbk ..kkkkkkkkk. ....kbbk.... ....kkkk.... ............',
    lettera: '....kkkk.... ...kbbbbk... ..kbbkkbbk.. ..kbk..kbk.. .kbbk..kbbk. .kbbkkkkbbk. .kbbbbbbbbk. kbbkkkkkkbbk kbbk....kbbk kbbk....kbbk kkkk....kkkk ............',
    lighthouse: '.....kk..... ....kyyk.... ...kkkkkk... ....kwwk.... ....krrk.... ....kwwk.... ...krrrrk... ...kwwwwk... ..krrrrrrk.. kkkkkkkkkkkk kbbsbbbbsbbk kkkkkkkkkkkk',
    moon: '....kkkk.... ..kkyyyk.... .kyyyyk..... .kyyyk...k.. kyyyyk..kyk. kyyyyk...k.. kyyyyk...... kyyyyyk..... .kyyyyykkkk. .kyyyyyyyyk. ..kkyyyykk.. ....kkkk....',
    one: '............ .....kkk.... ....kyyk.... ...kyyyk.... ....kyyk.... ....kyyk.... ....kyyk.... ....kyyk.... ...kkyykk... ...kyyyyk... ...kkkkkk... ............',
    owl: '............ .k........k. .kk......kk. .knkkkkkknk. .knnnnnnnnk. knwwwnnwwwnk knwkwnnwkwnk knwwwyywwwnk .knnnyynnnk. .kntnnnntnk. ..knnnnnnk.. ...kykkyk...',
    pine: '.....kk..... ....kgfk.... ...kggffk... ..kggggffk.. ...kgggfk... ..kgggggfk.. .kggggggffk. ..kggggffk.. .kgggggggfk. kkkkkkkkkkkk .....kn..... .....kk.....',
    plane: '....kkk..... ....kwk..... ....kwk..... .kkkkwkkkk.. kbwwwwwwwbk. .kkkkwkkkk.. ....kwk..... ....kwk..... ...kkwkk.... ..kbwwwbk... ..kkkkkkk... ............',
    prop: '.....kk..... ....kook.... ....kook.... ....kook.... ....kook.... ..kkkkkkkk.. .kddkddkddk. ..kkkkkkkk.. ....kook.... ....kook.... ....kook.... .....kk.....',
    pumpkin: '.....kk..... ....kfk..... ..kkkkkkkk.. .kooooooook. koookoookook kookkookkook kooooooooook kokooooookok koookkkkoook .kooooooook. ..kkkkkkkk.. ............',
    question: '...kkkkkk... ..kwwwwwwk.. .kwwkkkkwwk. .kwk....kwk. .kkk...kwwk. .....kkwwk.. ....kwwkk... ....kwwk.... ....kkkk.... ....kwwk.... ....kwwk.... ....kkkk....',
    radio: '.........k.. ........k... ..kkkkkkkkk. .kdddddddddk .kdkkkkkkkdk .kdkskwkskdk .kdkkkkkkkdk .kddddddddk. .kdrkdrkddk. .kddddddddk. .kkkkkkkkkk. ............',
    rotor: 'k..........k .k........k. ..k......k.. ...kk..kk... ....kddk.... ....kdyk.... ....kddk.... ...kk..kk... ..k......k.. .k........k. k..........k ............',
    seven: '............ ..kkkkkkkk.. ..kbbbbbbk.. ..kkkkkbbk.. ......kbk... .....kbbk... .....kbk.... ....kbbk.... ....kbk..... ...kbbk..... ...kkkk..... ............',
    siren: '............ k...kkkk...k .k.krrrrk.k. ...krwrrk... ..krwrrrrk.. ..krrrrrrk.. ..krrrrrrk.. .kkkkkkkkkk. .kddddddddk. .kkkkkkkkkk. ............ ............',
    star: '.....kk..... .....kyk.... ....kyyk.... kkkkkyyykkkk kyyyyyyyyyyk .kyyyyyyyyk. ..kyyyyyyk.. ..kyyyyyyk.. .kyyykkyyyk. .kyyk..kyyk. kkkk....kkkk ............',
    sunwave: '............ ....kkkk.... ...kyyyyk... ..kyyyyyyk.. ..kyyyyyyk.. kkkkkkkkkkkk kbbbsbbbbsbk kbsbbbsbbbbk kbbbbbbbsbbk kqqqqqqqqqqk kkkkkkkkkkkk ............',
    ticket: '............ ............ kkkkkkkkkkkk kyyyykyyyyyk kyrryyykkkyk kyrrykyyyyyk kyyyyyykkyyk kyrrykyyyyyk kyyyyyykkkyk kkkkkkkkkkkk ............ ............',
    trophy: 'kkkkkkkkkkkk kyyyyyyyyhyk kkyyyyyyhykk kykyyyyyyyky kkkyyyyyykkk ...kyyyyk... ....kyyk.... ....kyyk.... ...kyyyyk... ..kkkkkkkk.. ..knnnnnnk.. ..kkkkkkkk..',
    weight: '............ ............ .kk......kk. kddk....kddk kddkkkkkkddk kdddddddwddk kddkkkkkkddk kddk....kddk .kk......kk. ............ ............ ............',
    // weather, for the header
    sun: '.....oo..... .o...oo...o. ..o.kkkk.o.. ...kyyyyk... ..kyhhyyyk.. ookyhyyyykoo ookyyyyyykoo ..kyyyyyyk.. ...kyyyyk... ..o.kkkk.o.. .o...oo...o. .....oo.....',
    suncloud: '.o...o...... ..kkkk...... okyhyyk..... .kyyyykkk... kyyykkwwwk.. kyykwwwwwwk. .kkkwwwwwwkk ..kwwwwwwwwk .kwwwwwwwwwk .kwwwwwsswwk ..kkkkkkkkk. ............',
    mooncloud: '..kkk....... .kyyk....... kyyk........ kyyk..kkk... kyyykkwwwk.. .kyykwwwwwk. ..kkkwwwwwkk ..kwwwwwwwwk .kwwwwwwwwwk .kwwwwwsswwk ..kkkkkkkkk. ............',
    rain: '....kkkk.... ...kwwwwk... .kkkwwwwkkk. kwwwwwwwwwwk kwwwwwwsswwk .kkkkkkkkkk. ..b...b...b. .b...b...b.. ............ ...b...b...b ..b...b...b. ............',
    snow: '....kkkk.... ...kwwwwk... .kkkwwwwkkk. kwwwwwwwwwwk kwwwwwwsswwk .kkkkkkkkkk. ..s.....s... .sbs...sbs.. ..s..s..s... ....sbs..... .....s...... ............',
    fog: '............ ..kkkk...... .keeeekkkk.. keeeeeeeeek. .kkkkkkkkk.. ............ .eeeeeeeee.. ............ ...eeeeeeeee ............ eeeeeeeee... ............',
    storm: '....kkkk.... ...keeeek... .kkkeeeekkk. keeeeeeeeeek keeeeeeddeek .kkkkkkkkkk. .....kyyk... ....kyyk.... ...kyyyyyk.. .....kyyk... ....kyyk.... ....kk......'
  };

  // dark, base, light, shine
  var METALS = {
    bronze:   ['#7a3d16', '#b8622a', '#de9455', '#f6c79a'],
    silver:   ['#5b6676', '#a3afbd', '#d3dbe4', '#ffffff'],
    gold:     ['#93630d', '#d9a520', '#f7d154', '#fff3b0'],
    platinum: ['#2f7891', '#6fc2da', '#b4ecf8', '#ffffff'],
    steel:    ['#3a4254', '#5d667b', '#7b859a', '#98a1b4']
  };
  var RIBBONS = [
    ['#e2402f', '#ffffff'], ['#2f6fe4', '#ffcc33'], ['#3faa55', '#ffffff'], ['#8b5cf6', '#ffcc33'],
    ['#f08a24', '#1c2b4f'], ['#43c6db', '#ffffff'], ['#ff7eb6', '#ffffff'], ['#1c2b4f', '#ffcc33']
  ];

  function Grid() { this.a = new Array(W * H); }
  Grid.prototype.set = function (x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) this.a[y * W + x] = c; };
  Grid.prototype.get = function (x, y) { return x >= 0 && y >= 0 && x < W && y < H ? this.a[y * W + x] : null; };
  Grid.prototype.rect = function (x0, y0, x1, y1, c) {
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) this.set(x, y, c);
  };
  // A one-pixel ink outline around everything drawn so far.
  Grid.prototype.outline = function () {
    var add = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
      }
    }
    for (var i = 0; i < add.length; i++) this.set(add[i][0], add[i][1], INK);
  };

  // A shaded metal disc: rim lit from the top left, a lighter face and a shine.
  function disc(g, cx, cy, r, m) {
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) continue;
        var c;
        if (d > r - 1.6) c = dx + dy < -2 ? m[2] : (dx + dy > 2 ? m[0] : m[1]);
        else if (d > r - 2.4) c = m[0];
        else c = (dx < -1.5 && dy < -1.5 && d > r - 4.4) ? m[3] : m[2];
        g.set(x, y, c);
      }
    }
  }

  function gray(hex) {
    var n = parseInt(hex.slice(1), 16);
    var l = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
    var v = Math.round(70 + l * 0.45);
    return 'rgb(' + v + ',' + (v + 4) + ',' + (v + 14) + ')';
  }

  function icon(g, name, ox, oy, tint, dim) {
    var rows = (ICONS[name] || ICONS.question).split(' ');
    for (var y = 0; y < 12; y++) {
      for (var x = 0; x < 12; x++) {
        var ch = rows[y].charAt(x);
        if (ch === '.') continue;
        if (tint && tint[ch]) ch = tint[ch];
        var c = ch === 'k' ? INK : PAL[ch];
        g.set(ox + x, oy + y, dim && ch !== 'k' ? gray(c) : c);
      }
    }
  }

  function medal(g, m, ribbon, ico, tint, locked) {
    var rb = locked ? ['#8d96a8', '#b3bac8'] : RIBBONS[ribbon % RIBBONS.length];
    g.rect(14, 0, 25, 11, rb[0]);
    g.rect(17, 0, 18, 11, rb[1]);
    g.rect(21, 0, 22, 11, rb[1]);
    disc(g, 20, 22, 11, m);
    icon(g, ico, 14, 16, tint, locked);
  }

  function wings(g, m, ico, tint, locked) {
    var feathers = [[1, 8, 10], [3, 11, 13], [5, 14, 16], [8, 17, 18]];
    feathers.forEach(function (f) {
      for (var y = f[1]; y <= f[2]; y++) {
        var c = y === f[1] ? m[2] : (y === f[2] ? m[0] : m[1]);
        for (var x = f[0]; x <= 14; x++) { g.set(x, y, c); g.set(W - 1 - x, y, c); }
      }
    });
    // a banner behind the bottom of the badge, with swallowtail ends
    var band = locked ? ['#7b859a', '#5d667b'] : ['#e2402f', '#a12a1f'];
    for (var by = 23; by <= 28; by++) {
      for (var bx = 5; bx <= 34; bx++) {
        if ((bx <= 6 || bx >= 33) && (by === 25 || by === 26)) continue;
        g.set(bx, by, by === 23 ? band[1] : by === 28 ? band[1] : band[0]);
      }
    }
    disc(g, 20, 16, 10, m);
    icon(g, ico, 14, 10, tint, locked);
  }

  function star(g, m, ico, tint) {
    var cx = 20, cy = 16, pts = [];
    for (var i = 0; i < 16; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? 10.5 : 16;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var px = x + 0.5, py = y + 0.5, inside = false;
        for (var j = 0, k = pts.length - 1; j < pts.length; k = j++) {
          if ((pts[j][1] > py) !== (pts[k][1] > py)
            && px < (pts[k][0] - pts[j][0]) * (py - pts[j][1]) / (pts[k][1] - pts[j][1]) + pts[j][0]) inside = !inside;
        }
        if (inside) g.set(x, y, (px - cx) + (py - cy) < 0 ? m[2] : m[1]);
      }
    }
    disc(g, cx, cy, 9, m);
    icon(g, ico, 14, 10, tint, false);
  }

  function mystery(g) {
    for (var y = 3; y <= 30; y++) {
      for (var x = 8; x <= 31; x++) {
        var corner = (x === 8 || x === 31) && (y === 3 || y === 30);
        if (corner) continue;
        var edge = x === 8 || x === 31 || y === 3 || y === 30;
        g.set(x, y, edge ? ((x + y) % 2 ? '#ffcc33' : '#2a3a66') : '#2a3a66');
      }
    }
    icon(g, 'question', 14, 11, { w: 'h' }, false);
    g.set(11, 7, '#ffcc33'); g.set(28, 25, '#ffcc33'); g.set(27, 7, '#8ccaff');
  }

  function parseTint(s) {
    if (!s) return null;
    var t = {};
    s.split(',').forEach(function (p) { var kv = p.split(':'); if (kv.length === 2) t[kv[0]] = kv[1]; });
    return t;
  }

  function paint(canvas) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var look = canvas.getAttribute('data-look') || 'medal';
    var metalName = canvas.getAttribute('data-metal') || 'steel';
    var m = METALS[metalName] || METALS.steel;
    var locked = metalName === 'steel';
    var ico = canvas.getAttribute('data-icon') || 'question';
    var tint = parseTint(canvas.getAttribute('data-tint'));
    var g = new Grid();
    if (look === 'wings') wings(g, m, ico, tint, locked);
    else if (look === 'star') star(g, m, ico, tint);
    else if (look === 'mystery') mystery(g);
    else medal(g, m, +canvas.getAttribute('data-ribbon') || 0, ico, tint, locked);
    g.outline();
    if (metalName === 'platinum') {  // a little sparkle
      [[3, 3], [36, 6], [34, 30]].forEach(function (p) { if (!g.get(p[0], p[1])) g.set(p[0], p[1], '#ffffff'); });
    }
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var c = g.get(x, y);
        if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
      }
    }
  }

  // Just an icon (12x12, outline included), for little labels around the page.
  function paintIcon(canvas) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var rows = (ICONS[canvas.getAttribute('data-icon')] || ICONS.question).split(' ');
    var tint = parseTint(canvas.getAttribute('data-tint'));
    canvas.width = 12;
    canvas.height = 12;
    ctx.clearRect(0, 0, 12, 12);
    for (var y = 0; y < 12; y++) {
      for (var x = 0; x < 12; x++) {
        var ch = rows[y].charAt(x);
        if (ch === '.') continue;
        if (tint && tint[ch]) ch = tint[ch];
        ctx.fillStyle = ch === 'k' ? INK : PAL[ch];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Which icon each badge wears (and color swaps, so shared icons look different).
  var ART = {
    species: ['dex'], planes: ['plane'], airlines: ['ticket'], countries: ['globe'], families: ['familytree'],
    missions: ['clipboard'], rare: ['gem'], high: ['arrowup'], busyday: ['calendar'], rush: ['clock'],
    zooday: ['binoculars'], airshow: ['firework'], friends: ['heart'], journey: ['compass'], vintage: ['hourglass'],
    first: ['one'], nightowl: ['owl'], jumbo: ['jumbo'], pacific: ['sunwave'], atlantic: ['lighthouse'],
    freshpaint: ['brush'], salute: ['star', 'y:w'], rotorhead: ['heli'], freight: ['box'], hometeam: ['drop', 's:h,b:o'],
    family: ['house'], testpilot: ['helmet'], warbird: ['prop'], firewatch: ['drop'], epic: ['star', 'y:p'],
    desert: ['cactus'], downunder: ['boomerang'], graveyard: ['moon'], dreamday: ['cloud'], triple7: ['seven', 'b:y'],
    choppers: ['heli', 'b:r,s:h'], cargoking: ['crown'], heavylifters: ['weight'], tankers: ['plane', 'w:e,b:d'],
    fighters: ['fighter'], bombers: ['bomber'], giants: ['giant'], boeing: ['seven'], bushpilot: ['pine'],
    rotorrally: ['rotor'], fireseason: ['flame'], oddball: ['balloon'], mayday: ['siren'], airbus: ['lettera'],
    world: ['globering'], legend: ['star'], legends: ['trophy'], af1: ['eagle'],
    santa: ['hat'], christmas: ['gift'], newyear: ['firework', 'y:h,p:c'], july4: ['firework', 'y:r,p:b'],
    halloween: ['pumpkin'], turkey: ['drumstick'], leapday: ['frog'], lucky7: ['clover'], radio: ['radio']
  };
  function art(id) { return ART[id] || ['star']; }

  window.PlanedexBadges = { paint: paint, paintIcon: paintIcon, art: art, icons: Object.keys(ICONS), W: W, H: H };
})();
