/* Ski Run for /games/ski/. An original downhill game in the spirit of
   the skiing game that came with old Windows: plain JavaScript on a
   <canvas>, no libraries, nothing fetched. All the art is the little
   character grids below, drawn at 2x.

   Steer:  move the mouse, use the arrow keys / A and D, or touch the
           slope on either side of the skier.
   Tuck:   hold Space or the mouse button (or a second finger) to go faster.
   Keys:   F2 new run, P pause.

   Trees, rocks and stumps wipe you out; bumps and ramps send you into
   the air (style points). After 1000 m an avalanche comes down behind
   you: every wipe-out lets it catch up. Best distance is remembered in
   localStorage. */
(function () {
  "use strict";

  var canvas = document.getElementById("ski");
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext("2d");
  var statusEl = document.getElementById("ski-status");
  var hud = document.getElementById("ski-hud"), banner = document.getElementById("ski-banner"), hudText = "", bannerText = "";
  var SCALE = 2;

  var PAL = {
    K: "#000000", W: "#ffffff", R: "#e00000", B: "#0038c8", N: "#000080", S: "#f8c898", G: "#008000", g: "#00a800",
    T: "#885020", Y: "#ffd800", L: "#c0c0c0", D: "#808080", C: "#78b8f8", O: "#ff9000", P: "#b040c0"
  };

  var ART = {
    down: ["...RRRR...", "..RRRRRR..", "..SSSSSS..", "..SKSSKS..", "..SSSSSS..", ".BBBBBBBB.", "DBBBYBBBBD", "D.BBYBBB.D", "D.BBBBBB.D", "D..NNNN..D", "...NNNN...", "...N..N...", "..KK..KK..", "..KK..KK..", "..KK..KK..", "..K....K.."],
    left: ["....RRRR..", "...RRRRRR.", "...SSSSSS.", "...KSSKSS.", "...SSSSSS.", "..BBBBBBB.", ".DBBBBBBBD", "D.BBBBBB.D", "..BBBBBB..", "...NNNN...", "..NNNN....", ".NN.NN....", "KK..KK....", ".KK..KK...", "..KK..KK..", "...KK..KK."],
    side: ["....RRRR....", "...RRRRRR...", "...SSSSSS...", "...KSSKSS...", "...SSSSSS...", "...BBBBBB...", "..DBBBBBBD..", ".D.BBBBBB.D.", "D..BBBBBB..D", "...NNNNNN...", "...NN..NN...", "...NN..NN...", "KKKKKKKKKKK.", ".KKKKKKKKKKK"],
    crash: ["............", "..K......K..", "...K.RR.K...", "....RRRR....", "..NNSSSSBB..", ".NNNSKKSBBB.", "..NNSSSSBB..", "....BBBB....", "...K.BB.K...", "..K......K..", ".WWWWWWWWWW.", "WWWLWWWWLWWW"],
    air: ["...RRRR...", "..RRRRRR..", "..SSSSSS..", "..SKSSKS..", "D.SSSSSS.D", ".DBBBBBBD.", "..BBYBBB..", "..BBYBBB..", "..BBBBBB..", "..NNNNNN..", ".NN....NN.", "KK......KK", "KK......KK"],
    tree: ["......g......", ".....ggg.....", "....ggGgg....", "...ggGGGgg...", "....gGGGg....", "...ggGGGgg...", "..ggGGGGGgg..", ".ggGGGGGGGgg.", "...gGGGGGg...", "..ggGGGGGgg..", ".ggGGGGGGGgg.", "ggGGGGGGGGGgg", ".....TTT.....", ".....TTT.....", ".....TTT....."],
    pine: ["....W....", "...WgW...", "..WgGgW..", "...gGg...", "..gGGGg..", ".WgGGGgW.", "..gGGGg..", ".gGGGGGg.", "gGGGGGGGg", "....T....", "....T...."],
    snowy: ["......W......", ".....WWW.....", "....WWgWW....", "...WWgGgWW...", "....gGGGg....", "...WWGGGWW...", "..WWgGGGgWW..", ".ggGGGGGGGgg.", "...WWGGGWW...", "..WWgGGGgWW..", ".ggGGGGGGGgg.", "ggGGGGGGGGGgg", ".....TTT.....", ".....TTT....."],
    rock: ["....DDDD....", "..DDLLLLDD..", ".DLLWLLLLDD.", "DLLWLLLLLLDD", "DLLLLLLLLDDD", "DDLLLLLDDDDK", ".KKKKKKKKKK."],
    stump: [".TTTTTT.", "TYYYYYYT", "TYTTTTYT", "TTYYYYTT", "TTTTTTTT", ".TTTTTT."],
    bump: ["....LLLLLL....", "..LLWWWWWWLL..", ".LWWWWWWWWWWL.", "LWWWWWWWWWWWWL"],
    ramp: ["RRYYRRYYRRYYRRYY", "YYRRYYRRYYRRYYRR", "CCCCCCCCCCCCCCCC", "CWWWWWWWWWWWWWWC", ".CWWWWWWWWWWWWC."],
    flagL: ["KRRRR", "KRRR.", "KRR..", "K....", "K....", "K....", "K...."],
    flagR: ["KBBBB", "KBBB.", "KBB..", "K....", "K....", "K....", "K...."]
  };

  /* pre-draw every sprite (and a mirrored copy) once */
  var SPR = {};
  function bake(name, rows, flip) {
    var w = 0; rows.forEach(function (r) { w = Math.max(w, r.length); });
    var c = document.createElement("canvas"); c.width = w; c.height = rows.length;
    var g = c.getContext("2d");
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch !== ".") { g.fillStyle = PAL[ch]; g.fillRect(flip ? w - 1 - x : x, y, 1, 1); }
      }
    });
    SPR[name] = c;
  }
  Object.keys(ART).forEach(function (k) { bake(k, ART[k], false); });
  bake("right", ART.left, true);
  bake("sideR", ART.side, true);

  var KINDS = [
    { s: "tree", hit: 5, solid: true, w: 6 }, { s: "pine", hit: 4, solid: true, w: 5 }, { s: "snowy", hit: 5, solid: true, w: 4 },
    { s: "rock", hit: 5, solid: true, w: 3 }, { s: "stump", hit: 3, solid: true, w: 2 },
    { s: "bump", hit: 6, solid: false, jump: 14, w: 4 }, { s: "ramp", hit: 7, solid: false, jump: 34, w: 2 }
  ];
  var WEIGHT = 0; KINDS.forEach(function (k) { WEIGHT += k.w; });

  var W = 320, H = 240;
  var p, things, nextRow, running, paused, over, best, lastT, steerTarget, tuck, keys = {}, aval, msgTimer, touchIds = {};
  try { best = Number(localStorage.getItem("cfw.ski.best") || 0); } catch (e) { best = 0; }

  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = Math.max(120, Math.floor((r.width - 4) / SCALE));
    H = Math.max(100, Math.floor((r.height - 4) / SCALE));
    canvas.width = W; canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    draw();
  }

  function reset() {
    p = { x: 0, y: 0, steer: 0, speed: 0, air: 0, airV: 0, down: 0, style: 0, crashes: 0, stopped: true };
    things = []; nextRow = 60; over = false; paused = false; running = true;
    aval = null; steerTarget = null; tuck = false;
    spawnUntil(H * 1.5);
    say("Steer with the mouse or the arrow keys. Hold Space (or a second finger) to tuck and go faster.");
  }

  function say(t) { if (statusEl) { statusEl.textContent = t; } }

  function spawnUntil(yMax) {
    while (nextRow < yMax) {
      var dist = nextRow / 8;                       /* metres */
      var n = 1 + (Math.random() < Math.min(0.75, 0.25 + dist / 2500) ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
      for (var i = 0; i < n; i++) {
        var roll = Math.random() * WEIGHT, kind = KINDS[0];
        for (var k = 0; k < KINDS.length; k++) { roll -= KINDS[k].w; if (roll <= 0) { kind = KINDS[k]; break; } }
        things.push({ k: kind, x: p.x + (Math.random() - 0.5) * (W + 240), y: nextRow + Math.random() * 20 });
      }
      nextRow += 26 + Math.random() * 14;
    }
  }

  function step(dt) {
    if (!running || paused || over) { return; }
    var f = dt / 16.67;
    /* steering: keys win over the pointer */
    var want = p.steer;
    if (keys.left && !keys.right) { want = -1; }
    else if (keys.right && !keys.left) { want = 1; }
    else if (keys.down) { want = 0; }
    else if (steerTarget !== null) { want = Math.max(-1, Math.min(1, (steerTarget - W / 2) / (W * 0.28))); }
    if (p.air <= 0 && p.down <= 0) { p.steer += (want - p.steer) * Math.min(1, 0.2 * f); }

    if (p.down > 0) {                              /* picking yourself up */
      p.down -= dt; p.speed = 0;
    } else {
      var top = (tuck || keys.tuck ? 3.6 : 2.2) * (1 - 0.5 * Math.abs(p.steer));
      p.speed += (top - p.speed) * 0.05 * f;
      p.x += p.steer * 1.9 * p.speed / 2.2 * f * (p.air > 0 ? 0.6 : 1) * 1.4;
      p.y += p.speed * f;
    }
    if (p.air > 0) { p.air += p.airV * f; p.airV -= 0.35 * f; if (p.air <= 0) { p.air = 0; p.airV = 0; } }

    /* collisions (only on the ground) */
    if (p.air <= 0 && p.down <= 0) {
      for (var i = 0; i < things.length; i++) {
        var t = things[i];
        if (t.done) { continue; }
        if (Math.abs(t.x - p.x) < t.k.hit + 3 && Math.abs(t.y - p.y) < 5) {
          t.done = true;
          if (t.k.solid) { p.down = 900; p.crashes++; p.steer = 0; say("Wipe-out! " + (aval ? "The avalanche is gaining..." : "Shake it off.")); }
          else { p.air = 0.1; p.airV = t.k.jump / 6; p.style += t.k.jump > 20 ? 50 : 10; }
          break;
        }
      }
    }
    spawnUntil(p.y + H * 1.5);
    things = things.filter(function (t) { return t.y > p.y - H; });

    /* the avalanche: appears after 1000 m and never slows down */
    var metres = p.y / 8;
    if (!aval && metres > 1000) { aval = { y: p.y - H * 1.1, v: 2.45 }; say("AVALANCHE! Tuck and get out of its way."); }
    if (aval) {
      aval.v = Math.min(3.3, aval.v + 0.00006 * dt);
      aval.y += aval.v * f;
      if (aval.y > p.y - 4) { finish(); }
    }
  }

  function finish() {
    over = true;
    var metres = Math.floor(p.y / 8);
    var record = metres > best;
    if (record) { best = metres; try { localStorage.setItem("cfw.ski.best", String(best)); } catch (e) { /* fine */ } }
    say("Buried at " + metres + " m" + (record ? ", a new best!" : " (best " + best + " m).") + " Press F2 or click for a new run.");
  }

  function sprite(name, x, y) {
    var s = SPR[name];
    ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height));
  }

  function draw() {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    if (!p) { return; }
    var camX = p.x - W / 2, camY = p.y - Math.floor(H * 0.36);
    /* faint ski tracks / snow texture so movement reads on an empty slope */
    ctx.fillStyle = "#e4ecf4";
    for (var gy = Math.floor(camY / 24) * 24; gy < camY + H; gy += 24) {
      for (var gx = Math.floor(camX / 40) * 40; gx < camX + W + 40; gx += 40) {
        var h = (gx * 73856093 ^ gy * 19349663) >>> 0;
        ctx.fillRect(Math.round(gx + (h % 31) - camX), Math.round(gy + ((h >> 5) % 17) - camY), 3 + (h >> 9) % 4, 1);
      }
    }
    var list = things.slice().sort(function (a, b) { return a.y - b.y; });
    var drawn = false;
    function drawPlayer() {
      var px = W / 2, py = p.y - camY;
      if (p.air > 0) { ctx.fillStyle = "#c8d0d8"; ctx.fillRect(Math.round(px - 5), Math.round(py - 1), 10, 2); }
      var name = p.down > 0 ? "crash" : p.air > 0 ? "air" : p.steer < -0.75 ? "side" : p.steer > 0.75 ? "sideR" : p.steer < -0.2 ? "left" : p.steer > 0.2 ? "right" : "down";
      sprite(name, px, py - p.air * 2 + 2);
    }
    list.forEach(function (t) {
      if (!drawn && t.y > p.y) { drawPlayer(); drawn = true; }
      sprite(t.k.s, t.x - camX, t.y - camY + 2);
    });
    if (!drawn) { drawPlayer(); }

    if (aval) {
      var ay = aval.y - camY;
      if (ay > -40) {
        ctx.fillStyle = "#dfe7ee"; ctx.fillRect(0, 0, W, Math.max(0, Math.round(ay)));
        for (var x = 0; x < W; x += 6) {
          var wob = Math.sin((x + aval.y * 3) / 9) * 4 + Math.sin((x * 3 + aval.y) / 5) * 2;
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x, Math.round(ay + wob - 6), 6, 8);
          ctx.fillStyle = "#9fb0c0"; ctx.fillRect(x, Math.round(ay + wob + 2), 6, 1);
        }
      }
    }

    /* the read-out box and the banner are ordinary text laid over the canvas */
    var read = "Dist: " + Math.floor(p.y / 8) + " m\nSpeed: " + Math.round(p.speed * 6) + " m/s\nStyle: " + p.style + "\nBest: " + best + " m";
    if (hud && read !== hudText) { hudText = read; hud.textContent = read; hud.hidden = false; }
    var note = over ? "BURIED!  " + Math.floor(p.y / 8) + " m" : (paused ? "PAUSED" : "");
    if (banner && note !== bannerText) { bannerText = note; banner.textContent = note; banner.hidden = !note; }
  }

  function frame(t) {
    var dt = Math.min(50, t - (lastT || t));
    lastT = t;
    step(dt);
    draw();
    window.requestAnimationFrame(frame);
  }

  /* ---- input ----------------------------------------------------------------- */

  function pointerX(e) { var r = canvas.getBoundingClientRect(); return (e.clientX - r.left) * (W / r.width); }

  canvas.addEventListener("pointermove", function (e) { steerTarget = pointerX(e); });
  canvas.addEventListener("pointerdown", function (e) {
    canvas.focus({ preventScroll: true });
    if (over) { reset(); return; }
    steerTarget = pointerX(e);
    touchIds[e.pointerId] = true;
    /* mouse button, or a second finger, = tuck */
    tuck = e.pointerType === "mouse" ? true : Object.keys(touchIds).length > 1;
    e.preventDefault();
  });
  function lift(e) { delete touchIds[e.pointerId]; tuck = e.pointerType === "mouse" ? false : Object.keys(touchIds).length > 1; }
  canvas.addEventListener("pointerup", lift);
  canvas.addEventListener("pointercancel", lift);
  canvas.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { tuck = false; } });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  var KEYMAP = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "down", s: "down", S: "down", " ": "tuck", f: "tuck", F: "tuck" };
  document.addEventListener("keydown", function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") { return; }
    if (e.key === "F2") { e.preventDefault(); reset(); return; }
    if (e.key === "p" || e.key === "P") { paused = !paused; return; }
    var k = KEYMAP[e.key];
    if (!k) { return; }
    e.preventDefault();
    keys[k] = true;
    if (k !== "tuck") { steerTarget = null; }       /* the keyboard has the wheel now */
    if (over && k === "tuck") { reset(); }
  });
  document.addEventListener("keyup", function (e) { var k = KEYMAP[e.key]; if (k) { keys[k] = false; } });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ski]");
    if (!b) { return; }
    var k = b.getAttribute("data-ski");
    if (window.CFDesktop) { window.CFDesktop.closeMenus(); }
    if (k === "new") { reset(); }
    else if (k === "pause") { paused = !paused; }
    else if (k === "howto" && window.CFDesktop) {
      window.CFDesktop.message("Steer with the mouse, the arrow keys, or by touching the slope. Hold Space or the mouse button (or a second finger) to tuck and go faster. Trees, rocks and stumps wipe you out; bumps and ramps are jumps. After 1000 m, stay ahead of the avalanche.", "How to Play", "info");
    }
  });

  document.addEventListener("visibilitychange", function () { if (document.hidden && running && !over) { paused = true; } });
  if (window.ResizeObserver) { new ResizeObserver(resize).observe(canvas.parentElement); }
  window.addEventListener("resize", resize);

  reset();
  resize();
  window.requestAnimationFrame(frame);
})();
