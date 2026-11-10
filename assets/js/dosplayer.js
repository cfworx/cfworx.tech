/* Runs a DOS shareware game on its page under /games/. Plain
   JavaScript; the emulator itself is js-dos's "emulators" package
   (DOSBox compiled to WebAssembly, GPL-2.0), served from this site in
   /dos/emu/. Opening the page starts the game: the emulator loads, then
   the game bundle named in the page's data-bundle.

   This file is the thin part around the emulator: it paints frames on
   the <canvas>, plays the sound, and passes keys and mouse through.

   Keys go to the game as soon as it is running, no click needed (unless
   you are typing in the taskbar's Search box or have a menu open).
   Clicking the game captures the mouse for looking around. Browsers
   keep Esc for themselves to free a captured mouse, so when that
   happens this script passes one Esc on to the game: one press both
   frees the mouse and opens the game's menu. Sound starts with your
   first key or click (browsers don't allow it sooner).

   Saved games live in the emulator's memory and are gone when the page
   is closed. */
(function () {
  "use strict";

  var root = document.getElementById("dos");
  if (!root) { return; }
  var canvas = document.getElementById("dos-canvas");
  var cover = document.getElementById("dos-cover");
  var play = document.getElementById("dos-play");
  var bar = document.getElementById("dos-progress");
  var msg = document.getElementById("dos-msg");
  var status = document.getElementById("dos-status");
  var fullBtn = document.getElementById("dos-full");
  var keysBtn = document.getElementById("dos-keys-toggle");
  var keysRow = document.getElementById("dos-keys");
  var resetBtn = document.getElementById("dos-reset");
  var mouseMode = root.getAttribute("data-mouse") || "lock";
  var noVert = root.getAttribute("data-novert") === "1";   /* ignore up/down mouse movement (it would walk you forward) */
  var ctx = canvas.getContext("2d");
  var ci = null, audio = null, image = null, starting = false;

  if (!window.WebAssembly || !window.Worker || !ctx) {
    msg.textContent = "This browser can't run the emulator. The download still works.";
    return;
  }

  /* DOM key -> the emulator's key codes */
  var KEYS = {
    Escape: 256, Enter: 257, Tab: 258, Backspace: 259, Insert: 260, Delete: 261, ArrowRight: 262, ArrowLeft: 263,
    ArrowDown: 264, ArrowUp: 265, PageUp: 266, PageDown: 267, Home: 268, End: 269, CapsLock: 280, ScrollLock: 281,
    NumLock: 282, PrintScreen: 283, Pause: 284, Space: 32, Minus: 45, Equal: 61, Comma: 44, Period: 46, Slash: 47,
    Semicolon: 59, Quote: 39, BracketLeft: 91, Backslash: 92, BracketRight: 93, Backquote: 96,
    ShiftLeft: 340, ControlLeft: 341, AltLeft: 342, ShiftRight: 344, ControlRight: 345, AltRight: 346,
    NumpadDecimal: 330, NumpadDivide: 331, NumpadMultiply: 332, NumpadSubtract: 333, NumpadAdd: 334, NumpadEnter: 335
  };
  (function () {
    var i;
    for (i = 0; i < 26; i++) { KEYS["Key" + String.fromCharCode(65 + i)] = 65 + i; }
    for (i = 0; i < 10; i++) { KEYS["Digit" + i] = 48 + i; KEYS["Numpad" + i] = 320 + i; }
    for (i = 1; i <= 12; i++) { KEYS["F" + i] = 289 + i; }
  })();

  function say(t) { if (status) { status.textContent = t; } }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error("could not load " + src)); };
      document.head.appendChild(s);
    });
  }

  /* fetch with a progress bar (falls back to a plain fetch) */
  function download(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) { throw new Error("download failed (" + r.status + ")"); }
      var total = Number(r.headers.get("content-length") || 0);
      if (!r.body || !total) { return r.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
      var reader = r.body.getReader(), chunks = [], got = 0;
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) {
            var out = new Uint8Array(got), at = 0;
            chunks.forEach(function (c) { out.set(c, at); at += c.length; });
            return out;
          }
          chunks.push(res.value); got += res.value.length;
          bar.firstElementChild.style.width = Math.min(100, Math.round(got / total * 100)) + "%";
          return pump();
        });
      }
      return pump();
    });
  }

  /* ---- picture ---------------------------------------------------------- */

  function setSize(w, h) {
    if (!w || !h) { return; }
    canvas.width = w; canvas.height = h;
    image = ctx.createImageData(w, h);
  }
  function paint(rgb, rgba) {
    if (!image) { return; }
    var out = image.data, n = image.width * image.height, i, j;
    if (rgba && rgba.length >= n * 4) {
      out.set(rgba.subarray(0, n * 4));
      for (i = 3; i < n * 4; i += 4) { out[i] = 255; }
    } else if (rgb && rgb.length >= n * 3) {
      for (i = 0, j = 0; i < n * 3; i += 3, j += 4) { out[j] = rgb[i]; out[j + 1] = rgb[i + 1]; out[j + 2] = rgb[i + 2]; out[j + 3] = 255; }
    } else { return; }
    ctx.putImageData(image, 0, 0);
  }

  /* ---- sound: a small queue fed to the speakers --------------------------- */

  function startAudio(freq) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return; }
    try { audio = new AC({ sampleRate: freq, latencyHint: "interactive" }); } catch (e) { try { audio = new AC(); } catch (e2) { return; } }
    var queue = [], head = 0, queued = 0, max = freq * 0.4;
    var node = audio.createScriptProcessor(2048, 0, 1);
    node.onaudioprocess = function (ev) {
      var out = ev.outputBuffer.getChannelData(0), at = 0;
      while (at < out.length && queue.length) {
        var cur = queue[0], take = Math.min(cur.length - head, out.length - at);
        out.set(cur.subarray(head, head + take), at);
        at += take; head += take; queued -= take;
        if (head >= cur.length) { queue.shift(); head = 0; }
      }
      for (; at < out.length; at++) { out[at] = 0; }
    };
    node.connect(audio.destination);
    ci.events().onSoundPush(function (samples) {
      if (queued > max) { return; }           /* drop rather than fall behind */
      queue.push(samples); queued += samples.length;
    });
    if (audio.state === "suspended") { audio.resume().catch(function () {}); }
  }

  /* ---- keyboard and mouse ----------------------------------------------------- */

  var held = {}, lastEsc = 0, selfUnlock = false;
  function key(code, down) {
    var k = KEYS[code];
    if (!ci || k === undefined) { return false; }
    held[code] = down;
    ci.sendKeyEvent(k, down);
    return true;
  }
  function tap(code) { key(code, true); setTimeout(function () { key(code, false); }, 70); }
  function releaseAll() { Object.keys(held).forEach(function (c) { if (held[c]) { key(c, false); } }); }
  function unlockAudio() { if (audio && audio.state === "suspended") { audio.resume().catch(function () {}); } }

  /* Does this key press belong to the game? Yes whenever it is running,
     unless you are typing in a field or using a menu or dialog. */
  function forGame(e) {
    if (!ci || KEYS[e.code] === undefined || e.metaKey) { return false; }
    if (e.code === "F5" || e.code === "F11" || e.code === "F12") { return false; }   /* leave reload, full screen, dev tools */
    var t = e.target, tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") { return false; }
    if (t && t.closest && t.closest(".menu, .start-menu, .window:not(#win-main)")) { return false; }
    var sm = document.getElementById("start-menu");
    if (sm && !sm.hidden) { return false; }
    return true;
  }

  /* Listening on the document (capture) means the game gets keys first
     and the desktop's own shortcuts ("/" for search, Esc) stay out of
     the way while you play. */
  document.addEventListener("keydown", function (e) {
    if (!forGame(e)) { return; }
    e.preventDefault(); e.stopPropagation();
    unlockAudio();
    if (e.repeat) { return; }                       /* DOS does its own key repeat */
    if (e.code === "Escape") {
      if (Date.now() - lastEsc < 300) { return; }   /* already passed on when the mouse was freed */
      lastEsc = Date.now();
    }
    if (held[e.code]) { key(e.code, false); }       /* a key-up went missing: release first */
    key(e.code, true);
  }, true);
  document.addEventListener("keyup", function (e) {
    if (!ci || KEYS[e.code] === undefined || !held[e.code]) { return; }
    key(e.code, false);
    if (forGame(e)) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  window.addEventListener("blur", releaseAll);
  window.addEventListener("focus", function () {
    if (ci && (!document.activeElement || document.activeElement === document.body)) { canvas.focus({ preventScroll: true }); }
  });

  var BUTTONS = { 0: 0, 2: 1, 1: 2 };
  function locked() { return document.pointerLockElement === canvas; }
  canvas.addEventListener("pointerdown", function (e) {
    canvas.focus({ preventScroll: true });
    if (!ci) { return; }
    unlockAudio();
    if (e.pointerType === "mouse" && mouseMode === "lock" && !locked() && canvas.requestPointerLock) {
      var p = canvas.requestPointerLock();
      if (p && p.catch) { p.catch(function () {}); }
      return;
    }
    if (mouseMode !== "none" && BUTTONS[e.button] !== undefined) { ci.sendMouseButton(BUTTONS[e.button], true); }
  });
  canvas.addEventListener("pointerup", function (e) {
    if (ci && mouseMode !== "none" && BUTTONS[e.button] !== undefined) { ci.sendMouseButton(BUTTONS[e.button], false); }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!ci || mouseMode === "none") { return; }
    if (locked()) { ci.sendMouseRelativeMotion(e.movementX, noVert ? 0 : e.movementY); }
    else if (mouseMode === "point") {
      var r = canvas.getBoundingClientRect();
      ci.sendMouseMotion((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }
  });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("pointerlockchange", function () {
    var on = locked();
    if (!on && ci && !selfUnlock && document.hasFocus() && !document.hidden && Date.now() - lastEsc > 300) {
      /* the browser kept the Esc that freed the mouse: give the game one */
      lastEsc = Date.now();
      tap("Escape");
    }
    selfUnlock = false;
    say(on ? "Mouse captured. Esc frees it and opens the game's menu." : "Keys go to the game. Click it to look around with the mouse.");
  });

  /* on-screen keys for phones and tablets */
  if (keysRow) {
    Array.prototype.forEach.call(keysRow.querySelectorAll("[data-key]"), function (b) {
      var code = b.getAttribute("data-key");
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); key(code, true); });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (t) { b.addEventListener(t, function () { key(code, false); }); });
      b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    });
  }
  if (keysBtn && keysRow) {
    keysBtn.addEventListener("click", function () {
      var onNow = keysRow.classList.toggle("is-on");
      keysRow.style.display = onNow ? "flex" : "";
      keysBtn.setAttribute("aria-pressed", onNow ? "true" : "false");
    });
  }
  if (fullBtn) {
    fullBtn.addEventListener("click", function () {
      var req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (req) { var p = req.call(root); if (p && p.catch) { p.catch(function () {}); } }
      canvas.focus({ preventScroll: true });
    });
  }
  if (resetBtn) { resetBtn.addEventListener("click", function () { window.location.reload(); }); }

  /* ---- start ---------------------------------------------------------------------- */

  function fail(err) {
    starting = false;
    bar.hidden = true;
    play.hidden = false;
    play.textContent = "Try again";
    msg.textContent = "The game couldn't start (" + (err && err.message ? err.message : "unknown error") + ").";
    say("Something went wrong starting the emulator.");
  }

  /* Some games open on a set-up screen every time (Epic Pinball asks for
     a sound card). The page can list the key presses that get past it in
     data-autokeys: key names, with numbers as pauses in milliseconds.
     The cover stays up while they are typed. */
  function autoKeys() {
    var script = (root.getAttribute("data-autokeys") || "").split(/\s+/).filter(Boolean);
    if (!script.length) { return Promise.resolve(); }
    bar.hidden = true;
    msg.textContent = "Setting up the sound card...";
    return script.reduce(function (chain, step) {
      return chain.then(function () {
        return new Promise(function (resolve) {
          if (/^\d+$/.test(step)) { setTimeout(resolve, Number(step)); return; }
          if (ci) { tap(step); }
          setTimeout(resolve, 800);
        });
      });
    }, Promise.resolve());
  }

  function start() {
    if (starting || ci) { return; }
    starting = true;
    play.hidden = true;
    bar.hidden = false;
    bar.firstElementChild.style.width = "0";
    msg.textContent = "Loading...";
    loadScript("/dos/emu/emulators.js").then(function () {
      window.emulators.pathPrefix = "/dos/emu/";
      /* emulators.js would eval() this file; the site's security policy
         forbids eval, so it is loaded as a normal script instead (see
         static/dos/emu/README.txt) */
      return loadScript("/dos/emu/wdosbox.js");
    }).then(function () {
      return download(root.getAttribute("data-bundle"));
    }).then(function (bundle) {
      msg.textContent = "Starting DOS...";
      return window.emulators.dosboxWorker(bundle);
    }).then(function (iface) {
      ci = iface;
      setSize(ci.width(), ci.height());
      ci.events().onFrameSize(setSize);
      ci.events().onFrame(paint);
      ci.events().onExit(function () {
        ci = null;
        document.body.classList.remove("keys-captured");
        cover.hidden = false; bar.hidden = true;
        msg.textContent = "The program has ended.";
        if (resetBtn) { resetBtn.hidden = false; }
        selfUnlock = true;
        if (document.exitPointerLock) { document.exitPointerLock(); }
        say("Finished. Press Restart to play again.");
      });
      startAudio(ci.soundFrequency());
      document.body.classList.add("keys-captured");      /* tells desktop.js to leave "/" alone */
      [fullBtn, keysBtn, resetBtn].forEach(function (b) { if (b) { b.hidden = false; } });
      canvas.focus({ preventScroll: true });
      return autoKeys();
    }).then(function () {
      cover.hidden = true;
      say(mouseMode === "lock" ? "Keys go to the game. Click it to look around with the mouse." : "Keys go to the game.");
    }).catch(fail);
  }
  play.addEventListener("click", start);
  /* any first click or key press may be what unlocks the sound */
  document.addEventListener("pointerdown", unlockAudio, true);
  start();

  document.addEventListener("visibilitychange", function () {
    if (!ci) { return; }
    if (document.hidden) { ci.pause(); if (audio) { audio.suspend(); } }
    else { ci.resume(); if (audio) { audio.resume(); } }
  });
  window.addEventListener("pagehide", function () { if (ci) { try { ci.exit(); } catch (e) { /* closing anyway */ } } });
})();
