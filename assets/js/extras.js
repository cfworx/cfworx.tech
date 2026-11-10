/* The period touches that aren't needed to get around: the start-up
   screen and the screen savers. Plain JavaScript, nothing fetched, and
   nothing here is required: without this file the site simply skips
   them (the start-up screen removes itself, see win98.css).

   1. Start-up screen: a first visit to the desktop, and Shut Down >
      Restart, begin with a few lines of power-on self-test. display.js
      decides (class "booting" on <html>); any key or click skips it.
   2. Screen savers: after a few idle minutes the screen goes dark and a
      saver runs until the mouse moves or a key is pressed. Which one,
      and how long to wait, is set in Start > Settings > Display (kept
      in localStorage). They never start on a game page.

   desktop.js uses window.CFSaver for the Display dialog's preview. */
(function () {
  "use strict";

  var doc = document, root = doc.documentElement;

  function get(kind, key) { try { return (kind === "s" ? sessionStorage : localStorage).getItem(key); } catch (e) { return null; } }
  function set(kind, key, value) { try { (kind === "s" ? sessionStorage : localStorage).setItem(key, value); } catch (e) { /* fine */ } }
  function drop(kind, key) { try { (kind === "s" ? sessionStorage : localStorage).removeItem(key); } catch (e) { /* fine */ } }

  /* ---- 1. the start-up screen ------------------------------------------ */

  var boot = doc.getElementById("boot-screen");
  if (boot && root.classList.contains("booting")) {
    var out = doc.getElementById("boot-text"), timers = [], finished = false;
    /* [when it appears in ms, the line]; {K} is the memory counter */
    var LINES = [
      [0,    "CFWorx BIOS v1.98"],
      [0,    "(C) 1998 CFWorx Heavy Industries"],
      [0,    ""],
      [220,  "CPU ............ 400MHz, allegedly"],
      [420,  "Memory Test .... {K}"],
      [1050, ""],
      [1050, "Primary Master . CFWORX-HD 8.4GB"],
      [1250, "Primary Slave .. CD-ROM 32X"],
      [1450, "Sound Card ..... IRQ 5, obviously"],
      [1650, "Wizards ........ 1 found (harmless)"],
      [1950, ""],
      [1950, "Starting CFWorx 98..."]
    ];
    var shown = [], mem = 0;
    var paint = function () {
      out.textContent = shown.map(function (l) {
        return l.replace("{K}", mem + "K" + (mem >= 65536 ? " OK" : ""));
      }).join("\n");
    };
    var done = function () {
      if (finished) { return; }
      finished = true;
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      root.classList.remove("booting");
      set("l", "cfw.booted", "1");
      drop("s", "cfw.reboot");
      doc.removeEventListener("keydown", skip, true);
      doc.removeEventListener("pointerdown", skip, true);
      if (boot.parentNode) { boot.parentNode.removeChild(boot); }
    };
    var skip = function (e) {
      e.preventDefault();
      e.stopPropagation();
      done();
    };
    LINES.forEach(function (l) {
      timers.push(setTimeout(function () {
        shown.push(l[1]);
        if (l[1].indexOf("{K}") !== -1) {
          var count = setInterval(function () {
            mem = Math.min(65536, mem + 4096);
            paint();
            if (mem >= 65536) { clearInterval(count); }
          }, 30);
          timers.push(count);
        }
        paint();
      }, l[0]));
    });
    timers.push(setTimeout(done, 2700));
    doc.addEventListener("keydown", skip, true);
    doc.addEventListener("pointerdown", skip, true);
  } else if (boot && boot.parentNode) {
    boot.parentNode.removeChild(boot);
  }

  /* ---- 2. screen savers ----------------------------------------------------
     Each saver has init(W, H) -> its state, and draw(g, state, W, H) for
     one frame on a 2D canvas. To add one: add it here, and an <option>
     with the same value to the Display dialog in partials/dialogs.html. */

  function newStar(anywhere) {
    return { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: anywhere ? Math.random() * 0.97 + 0.03 : 1 };
  }
  var SAVERS = {
    /* flying through a field of stars */
    stars: {
      init: function (W, H) {
        var n = Math.max(40, Math.min(240, Math.round(W * H / 2600))), a = [];
        for (var i = 0; i < n; i++) { a.push(newStar(true)); }
        return a;
      },
      draw: function (g, a, W, H) {
        var cx = W / 2, cy = H / 2, f = Math.max(W, H) * 0.5, unit = W > 400 ? 1 : 0.5;
        g.fillStyle = "#000";
        g.fillRect(0, 0, W, H);
        g.fillStyle = "#fff";
        for (var i = 0; i < a.length; i++) {
          var s = a[i];
          s.z -= 0.011;
          var x = s.z > 0.02 ? cx + s.x / s.z * f : -1, y = s.z > 0.02 ? cy + s.y / s.z * f : -1;
          if (x < 0 || x >= W || y < 0 || y >= H) { a[i] = newStar(false); continue; }
          var size = Math.max(1, Math.round((s.z < 0.2 ? 3 : (s.z < 0.5 ? 2 : 1)) * unit));
          g.fillRect(x | 0, y | 0, size, size);
        }
      }
    },
    /* two bouncing outlines that leave trails */
    lines: {
      init: function (W, H) {
        function shape(hue) {
          var pts = [];
          for (var i = 0; i < 4; i++) {
            pts.push({
              x: Math.random() * W, y: Math.random() * H,
              vx: (1.1 + Math.random() * 1.6) * (Math.random() < 0.5 ? -1 : 1) * W / 300,
              vy: (1.1 + Math.random() * 1.6) * (Math.random() < 0.5 ? -1 : 1) * H / 300
            });
          }
          return { pts: pts, trail: [], hue: hue, tick: 0 };
        }
        return [shape(Math.random() * 360), shape(Math.random() * 360)];
      },
      draw: function (g, shapes, W, H) {
        g.fillStyle = "#000";
        g.fillRect(0, 0, W, H);
        g.lineWidth = 1;
        shapes.forEach(function (s) {
          s.pts.forEach(function (p) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > W) { p.vx = -p.vx; p.x = Math.max(0, Math.min(W, p.x)); }
            if (p.y < 0 || p.y > H) { p.vy = -p.vy; p.y = Math.max(0, Math.min(H, p.y)); }
          });
          if (s.tick++ % 3 === 0) {
            s.trail.push(s.pts.map(function (p) { return [p.x, p.y]; }));
            if (s.trail.length > 6) { s.trail.shift(); }
          }
          s.hue = (s.hue + 0.5) % 360;
          g.strokeStyle = "hsl(" + Math.round(s.hue) + ", 100%, 55%)";
          s.trail.concat([s.pts.map(function (p) { return [p.x, p.y]; })]).forEach(function (poly) {
            g.beginPath();
            poly.forEach(function (p, i) { if (i) { g.lineTo(p[0] + 0.5, p[1] + 0.5); } else { g.moveTo(p[0] + 0.5, p[1] + 0.5); } });
            g.closePath();
            g.stroke();
          });
        });
      }
    }
  };

  /* Runs a saver on a canvas; returns the function that stops it. */
  function run(canvas, kind) {
    var saver = SAVERS[kind], g = canvas.getContext ? canvas.getContext("2d") : null;
    if (!saver || !g) { return function () {}; }
    var W = canvas.width, H = canvas.height, state = saver.init(W, H), alive = true, raf = 0, last = 0;
    function frame(t) {
      if (!alive || !canvas.isConnected) { return; }         /* stopped, or its window was closed */
      raf = window.requestAnimationFrame(frame);
      if (t - last < 30) { return; }               /* about 30 frames a second is plenty */
      last = t;
      saver.draw(g, state, W, H);
    }
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    raf = window.requestAnimationFrame(frame);
    return function () { alive = false; window.cancelAnimationFrame(raf); };
  }

  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function chosen() {
    var k = get("l", "cfw.saver");
    if (k === "none" || SAVERS[k]) { return k; }
    return still ? "none" : "stars";               /* the default; none for people who asked for less motion */
  }
  function waitMinutes() {
    var m = Number(get("l", "cfw.saver.wait"));
    return m >= 1 && m <= 60 ? m : 5;
  }

  var overlay = null, stop = null, startedAt = 0, firstMove = null, lastInput = Date.now();

  /* While a saver is up, moving the mouse, a click, a tap or a key ends
     it, and that click or key goes no further. */
  function wake(e) {
    if (!overlay || Date.now() - startedAt < 500) { return; }     /* let the click that started a preview settle */
    if (e.type === "mousemove") {
      if (!firstMove) { firstMove = [e.clientX, e.clientY]; return; }
      if (Math.abs(e.clientX - firstMove[0]) + Math.abs(e.clientY - firstMove[1]) < 6) { return; }   /* a nudge of the desk isn't waking up */
    }
    if (e.cancelable && e.type !== "mousemove") { e.preventDefault(); }
    e.stopPropagation();
    end();
  }

  function start(kind) {
    if (overlay || !SAVERS[kind]) { return; }
    overlay = doc.createElement("div");
    overlay.className = "screensaver";
    var canvas = doc.createElement("canvas");
    /* drawn at half size and scaled up: chunky, and easy on the machine */
    canvas.width = Math.max(160, Math.ceil(window.innerWidth / 2));
    canvas.height = Math.max(120, Math.ceil(window.innerHeight / 2));
    overlay.appendChild(canvas);
    ["mousemove", "mousedown", "touchstart", "wheel"].forEach(function (type) {
      overlay.addEventListener(type, wake, { passive: false });
    });
    doc.body.appendChild(overlay);
    stop = run(canvas, kind);
    startedAt = Date.now();
    firstMove = null;
  }
  function end() {
    if (!overlay) { return; }
    if (stop) { stop(); }
    if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
    overlay = null;
    stop = null;
    lastInput = Date.now();
  }
  doc.addEventListener("keydown", wake, true);

  /* anything you do counts as "not idle" */
  ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "pointerdown", "scroll"].forEach(function (type) {
    doc.addEventListener(type, function () { lastInput = Date.now(); }, { capture: true, passive: true });
  });
  doc.addEventListener("visibilitychange", function () { lastInput = Date.now(); if (doc.hidden) { end(); } });

  setInterval(function () {
    if (overlay || doc.hidden) { return; }
    var kind = chosen();
    if (kind === "none" || doc.body.classList.contains("page-game") || root.classList.contains("booting")) { return; }
    var shut = doc.getElementById("shutdown-screen");
    if (shut && !shut.hidden) { return; }
    if (Date.now() - lastInput >= waitMinutes() * 60000) { start(kind); }
  }, 5000);

  window.CFSaver = {
    run: run,                                       /* run(canvas, kind) -> stop() */
    start: start,                                   /* full screen, now */
    kind: chosen,
    wait: waitMinutes,
    save: function (kind, minutes) { set("l", "cfw.saver", kind); set("l", "cfw.saver.wait", String(minutes)); lastInput = Date.now(); }
  };
})();
