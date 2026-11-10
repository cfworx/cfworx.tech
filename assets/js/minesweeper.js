/* Minesweeper for /games/minesweeper/. Plain JavaScript, no libraries,
   nothing fetched. The whole game (frame, counters, face, field) is
   drawn on one <canvas> in real pixels and scaled up in whole steps by
   CSS, so it stays sharp at any size.

   Mouse:  left click uncovers, right click plants a flag (then a "?"
           if Marks is on), middle click or a click on a number clears
           around it once its flags are placed.
   Touch:  tap uncovers, long press flags; "Flag mode" swaps the two.
   Keys:   F2 starts a new game.

   Level, tile size and best times are remembered in localStorage. */
(function () {
  "use strict";

  var canvas = document.getElementById("mines");
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext("2d");

  var LEVELS = {
    beginner:     { cols: 9,  rows: 9,  mines: 10, name: "Beginner" },
    intermediate: { cols: 16, rows: 16, mines: 40, name: "Intermediate" },
    expert:       { cols: 30, rows: 16, mines: 99, name: "Expert" }
  };
  var CELL = 16, LEFT = 12, TOP = 55, RIGHT = 8, BOTTOM = 8;
  var FACE = "#c0c0c0", HI = "#ffffff", SH = "#808080", K = "#000000";
  var NUM_COLORS = ["", "#0000ff", "#008000", "#ff0000", "#000080", "#800000", "#008080", "#000000", "#808080"];

  var DIGITS = {
    1: ["...XX...", "..XXX...", ".XXXX...", "...XX...", "...XX...", "...XX...", "...XX...", "...XX...", ".XXXXXX.", ".XXXXXX."],
    2: [".XXXXXX.", "XXXXXXXX", "XX....XX", "......XX", "....XXX.", "..XXX...", ".XXX....", "XXX.....", "XXXXXXXX", "XXXXXXXX"],
    3: ["XXXXXXX.", "XXXXXXXX", "......XX", "......XX", "..XXXXX.", "..XXXXX.", "......XX", "......XX", "XXXXXXXX", "XXXXXXX."],
    4: ["..XX.XX.", "..XX.XX.", ".XX..XX.", ".XX..XX.", "XXXXXXXX", "XXXXXXXX", ".....XX.", ".....XX.", ".....XX.", ".....XX."],
    5: ["XXXXXXXX", "XXXXXXXX", "XX......", "XX......", "XXXXXXX.", "XXXXXXXX", "......XX", "......XX", "XXXXXXXX", "XXXXXXX."],
    6: [".XXXXXX.", "XXXXXXX.", "XX......", "XX......", "XXXXXXX.", "XXXXXXXX", "XX....XX", "XX....XX", "XXXXXXXX", ".XXXXXX."],
    7: ["XXXXXXXX", "XXXXXXXX", "......XX", ".....XX.", "....XX..", "....XX..", "...XX...", "...XX...", "..XX....", "..XX...."],
    8: [".XXXXXX.", "XXXXXXXX", "XX....XX", "XX....XX", ".XXXXXX.", ".XXXXXX.", "XX....XX", "XX....XX", "XXXXXXXX", ".XXXXXX."]
  };
  var MINE = ["......X......", "......X......", "..X.XXXXX.X..", "...XXXXXXX...", "..XXWWXXXXX..", "..XXWWXXXXX..", "XXXXXXXXXXXXX",
              "..XXXXXXXXX..", "..XXXXXXXXX..", "...XXXXXXX...", "..X.XXXXX.X..", "......X......", "......X......"];
  var FLAG = ["....RR...", "..RRRR...", ".RRRRR...", "..RRRR...", "....RR...", ".....X...", ".....X...", "...XXXX..", ".XXXXXXXX", ".XXXXXXXX"];
  var QMARK = [".XXXX.", "XX..XX", "....XX", "...XX.", "..XX..", "..XX..", "......", "..XX..", "..XX.."];

  function load(key, fallback) { try { var v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* fine */ } }

  var levelKey = LEVELS[load("cfw.mines.level", "")] ? load("cfw.mines.level", "") : "beginner";
  var marks = load("cfw.mines.marks", "0") === "1";
  var bigPref = load("cfw.mines.big", "");       /* "" = decide from the screen */
  var flagMode = false;

  var L, W, H, cells, state, minesLeft, seconds, timer, firstClick, face, pressed, zoom;

  /* ---- drawing ---------------------------------------------------------- */

  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function bitmap(rows, x, y, colors) {
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r].charAt(c);
        if (ch !== ".") { rect(x + c, y + r, 1, 1, colors[ch]); }
      }
    }
  }
  /* a bevelled box: `t` pixels of light on the top/left, dark on the bottom/right */
  function bevel(x, y, w, h, t, light, dark) {
    for (var i = 0; i < t; i++) {
      rect(x + i, y + i, w - 2 * i - 1, 1, light); rect(x + i, y + i, 1, h - 2 * i - 1, light);
      rect(x + i + 1, y + h - 1 - i, w - 2 * i - 1, 1, dark); rect(x + w - 1 - i, y + i + 1, 1, h - 2 * i - 1, dark);
    }
  }

  function led(x, y, value) {
    var s = value < 0 ? "-" + ("0" + Math.min(99, -value)).slice(-2) : ("00" + Math.min(999, value)).slice(-3);
    bevel(x, y, 41, 25, 1, SH, HI);
    rect(x + 1, y + 1, 39, 23, K);
    var SEG = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abfgcd", "-": "g" };
    for (var i = 0; i < 3; i++) {
      var ox = x + 1 + i * 13, oy = y + 1, onSeg = SEG[s.charAt(i)] || "";
      "abcdefg".split("").forEach(function (seg) {
        var c = onSeg.indexOf(seg) !== -1 ? "#ff0000" : "#2c0000", j;
        if (seg === "a") { for (j = 0; j < 3; j++) { rect(ox + 2 + j, oy + 1 + j, 9 - 2 * j, 1, c); } }
        if (seg === "d") { for (j = 0; j < 3; j++) { rect(ox + 2 + j, oy + 21 - j, 9 - 2 * j, 1, c); } }
        if (seg === "g") { rect(ox + 3, oy + 10, 7, 1, c); rect(ox + 2, oy + 11, 9, 1, c); rect(ox + 3, oy + 12, 7, 1, c); }
        if (seg === "f") { for (j = 0; j < 3; j++) { rect(ox + 1 + j, oy + 2 + j, 1, 8 - 2 * j + (j ? 1 : 0), c); } }
        if (seg === "b") { for (j = 0; j < 3; j++) { rect(ox + 11 - j, oy + 2 + j, 1, 8 - 2 * j + (j ? 1 : 0), c); } }
        if (seg === "e") { for (j = 0; j < 3; j++) { rect(ox + 1 + j, oy + 13 + (j ? 0 : 0), 1, 8 - j - (j ? j - 1 : 0), c); } }
        if (seg === "c") { for (j = 0; j < 3; j++) { rect(ox + 11 - j, oy + 13, 1, 8 - j - (j ? j - 1 : 0), c); } }
      });
    }
  }

  function faceBox() { return { x: Math.round(W / 2) - 13, y: 15, w: 26, h: 26 }; }

  function drawFace(down) {
    var b = faceBox();
    rect(b.x, b.y, b.w, b.h, SH);
    rect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, FACE);
    if (down) { rect(b.x + 1, b.y + 1, b.w - 2, 1, SH); rect(b.x + 1, b.y + 1, 1, b.h - 2, SH); }
    else { bevel(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 2, HI, SH); }
    var ox = b.x + 4 + (down ? 1 : 0), oy = b.y + 4 + (down ? 1 : 0), x, y;
    /* a round yellow face, 17 pixels across */
    for (y = 0; y < 17; y++) {
      for (x = 0; x < 17; x++) {
        var d = Math.sqrt((x - 8) * (x - 8) + (y - 8) * (y - 8));
        if (d <= 8.4) { rect(ox + x, oy + y, 1, 1, d > 7.4 ? K : "#ffff00"); }
      }
    }
    function p(px, py, w, h) { rect(ox + px, oy + py, w || 1, h || 1, K); }
    if (face === "dead") {
      [[4, 5], [9, 5]].forEach(function (e) { p(e[0], e[1]); p(e[0] + 2, e[1]); p(e[0] + 1, e[1] + 1); p(e[0], e[1] + 2); p(e[0] + 2, e[1] + 2); });
      p(6, 11, 5, 1); p(5, 12); p(11, 12);
    } else if (face === "cool") {
      p(2, 5, 13, 1); p(3, 6, 4, 2); p(10, 6, 4, 2); p(4, 8, 2, 1); p(11, 8, 2, 1); p(1, 6); p(15, 6);
      p(4, 10); p(12, 10); p(5, 11); p(11, 11); p(6, 12, 5, 1);
    } else if (face === "ooh") {
      p(5, 5, 2, 2); p(10, 5, 2, 2);
      p(7, 10, 3, 1); p(6, 11); p(10, 11); p(6, 12); p(10, 12); p(7, 13, 3, 1);
    } else {
      p(5, 5, 2, 2); p(10, 5, 2, 2);
      p(4, 10); p(12, 10); p(5, 11); p(11, 11); p(6, 12, 5, 1);
    }
  }

  function drawCell(c, r) {
    var cell = cells[r * L.cols + c], x = LEFT + c * CELL, y = TOP + r * CELL;
    rect(x, y, CELL, CELL, FACE);
    var isDown = pressed && pressed.indexOf(r * L.cols + c) !== -1 && !cell.open && cell.mark !== 1;
    if (cell.open || isDown) {
      if (cell.open && cell.boom) { rect(x, y, CELL, CELL, "#ff0000"); }
      rect(x, y, CELL, 1, SH); rect(x, y, 1, CELL, SH);
      if (cell.open && cell.mine) { bitmap(MINE, x + 2, y + 2, { X: K, W: HI }); }
      else if (cell.open && cell.n) { bitmap(DIGITS[cell.n], x + 4, y + 3, { X: NUM_COLORS[cell.n] }); }
      return;
    }
    bevel(x, y, CELL, CELL, 2, HI, SH);
    if (cell.mark === 1) {
      bitmap(FLAG, x + 4, y + 3, { R: "#ff0000", X: K });
      if (cell.wrong) {   /* a flag that was not on a mine */
        rect(x, y, CELL, CELL, FACE); rect(x, y, CELL, 1, SH); rect(x, y, 1, CELL, SH);
        bitmap(MINE, x + 2, y + 2, { X: K, W: HI });
        for (var i = 0; i < 12; i++) { rect(x + 2 + i, y + 3 + i, 2, 1, "#ff0000"); rect(x + 13 - i, y + 3 + i, 2, 1, "#ff0000"); }
      }
    } else if (cell.mark === 2) {
      bitmap(QMARK, x + 5, y + 4, { X: K });
    }
  }

  function drawAll() {
    rect(0, 0, W, H, FACE);
    rect(0, 0, W, 3, HI); rect(0, 0, 3, H, HI);
    bevel(9, 9, W - 14, 37, 2, SH, HI);                       /* the counters' panel */
    bevel(9, 52, L.cols * CELL + 6, L.rows * CELL + 6, 3, SH, HI);   /* the field */
    led(16, 15, minesLeft);
    led(W - 5 - 7 - 41, 15, seconds);
    drawFace(false);
    for (var r = 0; r < L.rows; r++) { for (var c = 0; c < L.cols; c++) { drawCell(c, r); } }
  }
  function drawStatus() { led(16, 15, minesLeft); led(W - 5 - 7 - 41, 15, seconds); drawFace(false); }

  /* ---- sizing ------------------------------------------------------------- */

  function fit() {
    var body = canvas.parentElement, desk = document.getElementById("desktop");
    var availW = Math.max(160, (desk ? desk.clientWidth : window.innerWidth) - 16);
    var availH = Math.max(160, (desk ? desk.clientHeight : window.innerHeight) - 90);
    var want = bigPref === "1" ? 2 : (bigPref === "0" ? 1 : (W * 2 <= availW && H * 2 <= availH ? 2 : 1));
    /* phones: tiles must be big enough to tap, so stay at 2x and let the
       field scroll inside the window if it has to */
    if (window.matchMedia("(pointer: coarse)").matches) { want = 2; }
    zoom = want;
    canvas.style.width = W * zoom + "px";
    canvas.style.height = H * zoom + "px";
    body.style.maxWidth = "";
    syncMenu();
  }

  /* ---- game ----------------------------------------------------------------- */

  function newGame(key) {
    if (key && LEVELS[key]) { levelKey = key; save("cfw.mines.level", key); }
    L = LEVELS[levelKey];
    W = LEFT + L.cols * CELL + RIGHT;
    H = TOP + L.rows * CELL + BOTTOM;
    canvas.width = W; canvas.height = H;
    cells = [];
    for (var i = 0; i < L.cols * L.rows; i++) { cells.push({ mine: false, open: false, mark: 0, n: 0 }); }
    state = "ready"; minesLeft = L.mines; seconds = 0; firstClick = true; face = "smile"; pressed = null;
    clearInterval(timer); timer = null;
    fit();
    drawAll();
  }

  function around(i) {
    var c = i % L.cols, r = (i - c) / L.cols, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) { continue; }
        var rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < L.rows && cc >= 0 && cc < L.cols) { out.push(rr * L.cols + cc); }
      }
    }
    return out;
  }

  /* Mines go down after the first click, never under it or next to it. */
  function plant(safe) {
    var keep = around(safe).concat([safe]), spots = [];
    for (var i = 0; i < cells.length; i++) { if (keep.indexOf(i) === -1) { spots.push(i); } }
    for (var m = 0; m < L.mines && spots.length; m++) {
      var pick = Math.floor(Math.random() * spots.length);
      cells[spots[pick]].mine = true;
      spots.splice(pick, 1);
    }
    cells.forEach(function (cell, idx) {
      cell.n = around(idx).filter(function (j) { return cells[j].mine; }).length;
    });
  }

  function start() {
    state = "playing";
    seconds = 1; drawStatus();
    timer = setInterval(function () { if (seconds < 999) { seconds++; drawStatus(); } }, 1000);
  }

  function open(i) {
    var stack = [i];
    while (stack.length) {
      var j = stack.pop(), cell = cells[j];
      if (cell.open || cell.mark === 1) { continue; }
      cell.open = true; cell.mark = 0;
      if (!cell.mine && cell.n === 0) { around(j).forEach(function (k) { if (!cells[k].open) { stack.push(k); } }); }
    }
  }

  function finish(won, boomAt) {
    state = won ? "won" : "lost";
    clearInterval(timer); timer = null;
    face = won ? "cool" : "dead";
    cells.forEach(function (cell, idx) {
      if (won) { if (cell.mine) { cell.mark = 1; } }
      else if (cell.mine && cell.mark !== 1) { cell.open = true; cell.boom = idx === boomAt; }
      else if (!cell.mine && cell.mark === 1) { cell.wrong = true; }
    });
    if (won) {
      minesLeft = 0;
      var best = Number(load("cfw.mines.best." + levelKey, "999"));
      if (seconds < best) {
        save("cfw.mines.best." + levelKey, String(seconds));
        say("You have the fastest time for the " + L.name.toLowerCase() + " level: " + seconds + " seconds.", "Congratulations", "info");
      }
    }
    drawAll();
  }

  function checkWin() {
    for (var i = 0; i < cells.length; i++) { if (!cells[i].mine && !cells[i].open) { return; } }
    finish(true);
  }

  function reveal(i) {
    if (state === "won" || state === "lost") { return; }
    var cell = cells[i];
    if (cell.mark === 1) { return; }
    if (cell.open) { chord(i); return; }
    if (firstClick) { firstClick = false; plant(i); start(); }
    if (cell.mine) { cell.open = true; finish(false, i); return; }
    open(i);
    drawAll();
    checkWin();
  }

  /* On an open number whose flags are all placed, uncover the rest around it. */
  function chord(i) {
    if (state !== "playing") { return; }
    var cell = cells[i];
    if (!cell.open || !cell.n) { return; }
    var near = around(i);
    if (near.filter(function (j) { return cells[j].mark === 1; }).length !== cell.n) { return; }
    var boom = -1;
    near.forEach(function (j) {
      var c = cells[j];
      if (c.open || c.mark === 1) { return; }
      if (c.mine) { c.open = true; if (boom === -1) { boom = j; } } else { open(j); }
    });
    if (boom !== -1) { finish(false, boom); return; }
    drawAll();
    checkWin();
  }

  function flag(i) {
    if (state === "won" || state === "lost") { return; }
    var cell = cells[i];
    if (cell.open) { return; }
    if (cell.mark === 0) { cell.mark = 1; minesLeft--; }
    else if (cell.mark === 1) { cell.mark = marks ? 2 : 0; minesLeft++; }
    else { cell.mark = 0; }
    drawAll();
  }

  /* ---- input ----------------------------------------------------------------- */

  function locate(e) {
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
    var b = faceBox();
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { return { face: true }; }
    var c = Math.floor((x - LEFT) / CELL), row = Math.floor((y - TOP) / CELL);
    if (c < 0 || row < 0 || c >= L.cols || row >= L.rows) { return {}; }
    return { cell: row * L.cols + c };
  }

  var hold = null;     /* { id, button, at, timer, long, both } for the active press */

  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  canvas.addEventListener("pointerdown", function (e) {
    var at = locate(e);
    canvas.focus({ preventScroll: true });
    if (e.pointerType === "mouse" && e.button === 2) {
      e.preventDefault();
      if (hold && hold.button === 0) { hold.both = true; return; }    /* left + right together */
      if (at.cell !== undefined) { flag(at.cell); }
      return;
    }
    if (e.pointerType === "mouse" && e.button === 1) {
      e.preventDefault();
      if (at.cell !== undefined) { chord(at.cell); }
      return;
    }
    if (e.button !== 0) { return; }
    if (at.face) { hold = { id: e.pointerId, faceDown: true }; drawFace(true); return; }
    if (at.cell === undefined || state === "won" || state === "lost") { return; }
    hold = { id: e.pointerId, button: 0, at: at.cell, x: e.clientX, y: e.clientY, touch: e.pointerType !== "mouse" };
    if (hold.touch) {
      /* long press = the other action (flag, or uncover in Flag mode) */
      hold.timer = setTimeout(function () {
        if (!hold) { return; }
        hold.long = true;
        if (navigator.vibrate) { navigator.vibrate(15); }
        if (flagMode) { reveal(hold.at); } else { flag(hold.at); }
      }, 380);
    } else {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      face = "ooh"; pressed = [at.cell]; drawAll(); face = "smile";
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!hold || hold.id !== e.pointerId || hold.faceDown) { return; }
    if (hold.touch) {
      if (Math.abs(e.clientX - hold.x) > 10 || Math.abs(e.clientY - hold.y) > 10) { clearTimeout(hold.timer); hold = null; }   /* it was a scroll */
      return;
    }
    var at = locate(e);
    hold.at = at.cell;
    face = "ooh"; pressed = at.cell === undefined ? [] : (hold.both ? around(at.cell).concat([at.cell]) : [at.cell]); drawAll(); face = "smile";
  });

  function release(e, cancelled) {
    if (!hold || hold.id !== e.pointerId) { return; }
    var h = hold; hold = null; pressed = null;
    clearTimeout(h.timer);
    if (h.faceDown) { if (!cancelled && locate(e).face) { newGame(); } else { drawFace(false); } return; }
    if (cancelled || h.long) { drawAll(); return; }
    var at = h.touch ? h.at : locate(e).cell;
    if (at === undefined) { drawAll(); return; }
    if (h.both) { chord(at); drawAll(); return; }
    if (h.touch && flagMode && !cells[at].open) { flag(at); } else { reveal(at); }
    if (state === "playing" || state === "ready") { drawAll(); }
  }
  canvas.addEventListener("pointerup", function (e) { release(e, false); });
  canvas.addEventListener("pointercancel", function (e) { release(e, true); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "F2") { e.preventDefault(); newGame(); }
  });

  /* ---- menu, touch bar, messages ------------------------------------------------ */

  function say(text, title, icon) {
    if (window.CFDesktop) { window.CFDesktop.message(text, title, icon); }
  }

  function syncMenu() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-mines]"), function (b) {
      var k = b.getAttribute("data-mines");
      b.classList.toggle("is-checked", k === levelKey || (k === "marks" && marks) || (k === "big" && zoom === 2));
    });
    var sel = document.getElementById("mines-level");
    if (sel) { sel.value = levelKey; }
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-mines]");
    if (!b) { return; }
    var k = b.getAttribute("data-mines");
    if (window.CFDesktop) { window.CFDesktop.closeMenus(); }
    if (k === "new") { newGame(); }
    else if (LEVELS[k]) { newGame(k); }
    else if (k === "marks") { marks = !marks; save("cfw.mines.marks", marks ? "1" : "0"); syncMenu(); }
    else if (k === "big") { bigPref = zoom === 2 ? "0" : "1"; save("cfw.mines.big", bigPref); fit(); }
    else if (k === "times") {
      say(["beginner", "intermediate", "expert"].map(function (lv) {
        var t = load("cfw.mines.best." + lv, "");
        return LEVELS[lv].name + ": " + (t ? t + " seconds" : "no time yet");
      }).join("   •   "), "Fastest Mine Sweepers", "info");
    } else if (k === "howto") {
      say("Uncover every square that isn't a mine. A number tells you how many mines touch that square. Right click (or long press) to flag a mine; click a number to clear around it once its flags are placed. Click the face for a new game.", "How to Play", "info");
    }
  });

  var touchbar = document.getElementById("mines-touchbar");
  if (touchbar && window.matchMedia("(pointer: coarse), (max-width: 700px)").matches) {
    touchbar.hidden = false;
    var sel = document.getElementById("mines-level"), fm = document.getElementById("mines-flagmode");
    sel.addEventListener("change", function () { newGame(sel.value); });
    fm.addEventListener("click", function () {
      flagMode = !flagMode;
      fm.setAttribute("aria-pressed", flagMode ? "true" : "false");
      fm.textContent = "Flag mode: " + (flagMode ? "on" : "off");
    });
  }

  window.addEventListener("resize", function () { fit(); });
  newGame();
})();
