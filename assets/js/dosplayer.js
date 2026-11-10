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
   first key or click (browsers don't allow it sooner); the speaker in
   the taskbar tray mutes it.

   On a touch screen the page's on-screen pad appears (a direction pad,
   action buttons, a few small keys), and a finger on the picture works
   like a touchpad: drag to look around or move the pointer, tap to
   click.

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
  var resetBtn = document.getElementById("dos-reset");
  var stage = document.getElementById("dos-stage");
  var pad = document.getElementById("dos-pad");
  var padFull = document.getElementById("dos-pad-full");
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

  /* The screen is 4:3 and as large as fits. How tall that may be depends
     on the desktop's height in its own pixels (it may be magnified), so
     it is measured here and handed to the stylesheet. */
  function smallScreen() {
    var d = window.CFDesktop;
    return d && d.small ? d.small.matches : window.matchMedia("(max-width: 700px)").matches;
  }
  function fitScreen() {
    var desk = document.getElementById("desktop");
    if (desk && !smallScreen()) { root.style.setProperty("--dos-max", Math.max(200, desk.clientHeight - 190) + "px"); }
    else { root.style.removeProperty("--dos-max"); }
  }
  fitScreen();
  window.addEventListener("resize", fitScreen);

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

  var volume = null, muted = false, speaker = null;
  try { muted = window.localStorage.getItem("cfw.mute") === "1"; } catch (e) { /* fine */ }

  /* a speaker in the taskbar tray, next to the clock: click to mute */
  function addSpeaker() {
    var tray = document.querySelector(".tray");
    if (!tray || speaker) { return; }
    speaker = document.createElement("button");
    speaker.type = "button";
    speaker.className = "tray-btn";
    var img = document.createElement("img");
    img.alt = ""; img.width = 16; img.height = 16;
    speaker.appendChild(img);
    function show() {
      img.src = "/icons/" + (muted ? "speaker-off" : "speaker") + "-16.png";
      speaker.title = muted ? "The game's sound is off. Click to turn it on." : "The game's sound is on. Click to mute it.";
      speaker.setAttribute("aria-label", muted ? "Turn the game's sound on" : "Mute the game's sound");
      speaker.setAttribute("aria-pressed", muted ? "true" : "false");
    }
    speaker.addEventListener("click", function () {
      muted = !muted;
      if (volume) { volume.gain.value = muted ? 0 : 1; }
      try { window.localStorage.setItem("cfw.mute", muted ? "1" : "0"); } catch (e) { /* fine */ }
      show();
      canvas.focus({ preventScroll: true });
    });
    show();
    tray.insertBefore(speaker, tray.firstChild);
  }

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
    volume = audio.createGain ? audio.createGain() : null;
    if (volume) { volume.gain.value = muted ? 0 : 1; node.connect(volume); volume.connect(audio.destination); }
    else { node.connect(audio.destination); }
    ci.events().onSoundPush(function (samples) {
      if (queued > max) { return; }           /* drop rather than fall behind */
      queue.push(samples); queued += samples.length;
    });
    if (audio.state === "suspended") { audio.resume().catch(function () {}); }
  }

  /* ---- keyboard and mouse ----------------------------------------------------- */

  /* A game page can remap keys (front matter `keymap`), for games whose
     own key settings can't be edited: "KeyW=ArrowUp" presses Up when W
     is pressed, "KeyA=AltLeft+ArrowLeft" presses two keys. Several
     keys may press the same game key, so each game key is counted and
     only released when the last one holding it lets go. */
  var MAP = {};
  (root.getAttribute("data-keymap") || "").split(/\s+/).filter(Boolean).forEach(function (pair) {
    var kv = pair.split("=");
    if (kv.length === 2) { MAP[kv[0]] = kv[1].split("+"); }
  });
  /* A remapped letter can no longer be typed, which would spoil cheat
     codes. So a page can name the keys such codes start with (front
     matter `rawafter`; DOOM's all start with I, D): typing those in a
     row rests the map for four seconds, long enough to finish the code. */
  var RAW = (root.getAttribute("data-rawafter") || "").split(/\s+/).filter(Boolean).join(" ");
  var typed = [], typedAt = 0, rawUntil = 0;
  function noteTyped(code) {
    var now = Date.now();
    if (now - typedAt > 1200) { typed = []; }
    typedAt = now;
    typed.push(code);
    if (typed.length > 4) { typed.shift(); }
    if (now >= rawUntil && typed.join(" ").slice(-RAW.length) === RAW) { rawUntil = now + 4000; }
  }
  var down = {}, sent = {}, refs = {}, lastEsc = 0, selfUnlock = false;
  function known(code) { return KEYS[code] !== undefined || !!MAP[code]; }
  function press(code) {
    if (RAW) { noteTyped(code); }
    sent[code] = MAP[code] && Date.now() >= rawUntil ? MAP[code] : [code];
    sent[code].forEach(function (c) {
      if (KEYS[c] === undefined) { return; }
      refs[c] = (refs[c] || 0) + 1;
      if (refs[c] === 1) { ci.sendKeyEvent(KEYS[c], true); }
    });
  }
  function release(code) {
    (sent[code] || [code]).forEach(function (c) {
      if (KEYS[c] === undefined || !refs[c]) { return; }
      refs[c]--;
      if (refs[c] === 0) { ci.sendKeyEvent(KEYS[c], false); }
    });
    delete sent[code];
  }
  function key(code, isDown) {
    if (!ci || !known(code)) { return false; }
    if (isDown) {
      if (down[code]) { release(code); }            /* a key-up went missing: release first */
      down[code] = true;
      press(code);
    } else if (down[code]) {
      down[code] = false;
      release(code);
    }
    return true;
  }
  function tap(code) { key(code, true); setTimeout(function () { key(code, false); }, 70); }
  function releaseAll() { Object.keys(down).forEach(function (c) { if (down[c]) { key(c, false); } }); }
  function unlockAudio() { if (audio && audio.state === "suspended") { audio.resume().catch(function () {}); } }

  /* Does this key press belong to the game? Yes whenever it is running,
     unless you are typing in a field or using a menu or dialog. */
  function forGame(e) {
    if (!ci || !known(e.code) || e.metaKey) { return false; }
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
    if (e.code === "ControlLeft" || e.code === "ControlRight") { ctrlHeld = true; }
    if (e.repeat) { return; }                       /* DOS does its own key repeat */
    if (e.code === "Escape") {
      if (Date.now() - lastEsc < 300) { return; }   /* already passed on when the mouse was freed */
      lastEsc = Date.now();
    }
    key(e.code, true);
  }, true);
  document.addEventListener("keyup", function (e) {
    if (e.code === "ControlLeft" || e.code === "ControlRight") { ctrlHeld = false; }
    if (!ci || !down[e.code]) { return; }
    key(e.code, false);
    if (forGame(e)) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  window.addEventListener("blur", function () { ctrlHeld = false; releaseAll(); });

  /* Ctrl is a fire key in half of these games, and Ctrl+W closes a
     browser tab: no page can take that shortcut away. What a page can
     do is make the browser ask "Leave site?" first. The question is
     only armed while Ctrl is held down in a running game, so leaving
     any other way (the X, a link, Back) never asks. */
  var ctrlHeld = false;
  window.addEventListener("beforeunload", function (e) {
    if (!ci || !ctrlHeld) { return; }
    ctrlHeld = false;
    releaseAll();
    e.preventDefault();
    e.returnValue = "";
  });
  window.addEventListener("focus", function () {
    if (ci && (!document.activeElement || document.activeElement === document.body)) { canvas.focus({ preventScroll: true }); }
  });

  var BUTTONS = { 0: 0, 2: 1, 1: 2 };
  function locked() { return document.pointerLockElement === canvas; }
  function pointAt(e) {
    var r = canvas.getBoundingClientRect();
    ci.sendMouseMotion((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }
  /* A finger on the picture works like a laptop touchpad: dragging
     moves the game's mouse (to look around, or to move a pointer) and a
     quick tap is a click. The drag is measured in the game's own
     pixels, so a swipe across the picture turns you just as far on a
     small screen as on a big one; LOOK scales it. */
  var finger = null, LOOK = 1.9;
  canvas.addEventListener("pointerdown", function (e) {
    canvas.focus({ preventScroll: true });
    if (!ci) { return; }
    unlockAudio();
    if (e.pointerType !== "mouse") {
      showPad();
      if (mouseMode !== "none" && !finger) {
        finger = { id: e.pointerId, x: e.clientX, y: e.clientY, far: 0, at: Date.now() };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        if (mouseMode === "point") { pointAt(e); }
      }
      return;
    }
    if (mouseMode === "lock" && !locked() && canvas.requestPointerLock) {
      var p = canvas.requestPointerLock();              /* the click that captures the mouse still counts as a click */
      if (p && p.catch) { p.catch(function () {}); }
    }
    if (mouseMode !== "none" && BUTTONS[e.button] !== undefined) { ci.sendMouseButton(BUTTONS[e.button], true); }
  });
  function fingerUp(e, cancelled) {
    if (!finger || finger.id !== e.pointerId) { return; }
    var tapped = !cancelled && finger.far < 12 && Date.now() - finger.at < 400;
    finger = null;
    if (tapped && ci) {
      ci.sendMouseButton(0, true);
      setTimeout(function () { if (ci) { ci.sendMouseButton(0, false); } }, 90);
    }
  }
  canvas.addEventListener("pointerup", function (e) {
    if (e.pointerType !== "mouse") { fingerUp(e, false); return; }
    if (ci && mouseMode !== "none" && BUTTONS[e.button] !== undefined) { ci.sendMouseButton(BUTTONS[e.button], false); }
  });
  canvas.addEventListener("pointercancel", function (e) { fingerUp(e, true); });
  canvas.addEventListener("pointermove", function (e) {
    if (!ci || mouseMode === "none") { return; }
    if (e.pointerType !== "mouse") {
      if (!finger || finger.id !== e.pointerId) { return; }
      var dx = e.clientX - finger.x, dy = e.clientY - finger.y;
      finger.x = e.clientX; finger.y = e.clientY;
      finger.far += Math.abs(dx) + Math.abs(dy);
      if (mouseMode === "point") { pointAt(e); }
      else {
        var box = canvas.getBoundingClientRect(), gain = LOOK * (box.width ? canvas.width / box.width : 1);
        ci.sendMouseRelativeMotion(dx * gain, noVert ? 0 : dy * gain);
      }
      return;
    }
    if (locked()) { ci.sendMouseRelativeMotion(e.movementX, noVert ? 0 : e.movementY); }
    else if (mouseMode === "point") { pointAt(e); }
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

  /* ---- on-screen controls (touch screens) --------------------------------------
     The pad is written into the page by layouts/games/dos.html from the
     game's `pad` front matter: a direction pad, action buttons and a
     row of small keys. A button's data-key is one key ("KeyF"), several
     pressed together ("KeyW+ArrowUp"), or "next:Digit1,Digit2,Digit3":
     the next key in the list on each tap, to step through weapons.
     The pad shows on phones and tablets, or after the first touch. */
  var padShown = false;
  function hold(spec, isDown) { spec.split("+").forEach(function (c) { key(c, isDown); }); }
  function stop(e) { e.preventDefault(); }
  function showPad() {
    if (padShown || !pad) { return; }
    padShown = true;
    pad.hidden = false;
    if (stage) { stage.classList.add("has-pad"); }
    if (padFull && canFull) { padFull.hidden = false; if (fullBtn) { fullBtn.hidden = true; } }
    if (ci) { say("Use the buttons by the picture. Drag on the picture to look around, tap it to click."); }
  }
  if (pad) {
    Array.prototype.forEach.call(pad.querySelectorAll("[data-key]"), function (b) {
      var spec = b.getAttribute("data-key"), held = null, at = 0;
      var cycle = spec.indexOf("next:") === 0 ? spec.slice(5).split(",") : null;
      function up() {
        if (held === null) { return; }
        hold(held, false);
        held = null;
        b.classList.remove("is-on");
      }
      b.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        unlockAudio();
        if (!ci || held !== null) { return; }
        held = cycle ? cycle[at++ % cycle.length] : spec;
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        b.classList.add("is-on");
        hold(held, true);
      });
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
      b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", stop);
    });

    /* The direction pad is one surface: slide a thumb around it and the
       directions follow, diagonals included. */
    var dpad = document.getElementById("dos-dpad");
    if (dpad) {
      var DIRS = ["up", "down", "left", "right"], going = {}, thumb = null;
      var steer = function (want) {
        DIRS.forEach(function (d) {
          var spec = dpad.getAttribute("data-" + d), now = !!want[d];
          if (!spec || now === !!going[d]) { return; }
          going[d] = now;
          hold(spec, now);
          var cell = dpad.querySelector(".d-" + d);
          if (cell) { cell.classList.toggle("is-on", now); }
        });
      };
      var aim = function (e) {
        var r = dpad.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var far = Math.sqrt(dx * dx + dy * dy), want = {};
        if (far > r.width * 0.11) {                  /* a small dead spot in the middle */
          if (dy < -far * 0.38) { want.up = true; } else if (dy > far * 0.38) { want.down = true; }
          if (dx < -far * 0.38) { want.left = true; } else if (dx > far * 0.38) { want.right = true; }
        }
        steer(want);
      };
      var lift = function (e) { if (e.pointerId === thumb) { thumb = null; steer({}); } };
      dpad.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        unlockAudio();
        if (!ci || thumb !== null) { return; }
        thumb = e.pointerId;
        try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
        aim(e);
      });
      dpad.addEventListener("pointermove", function (e) { if (e.pointerId === thumb) { aim(e); } });
      dpad.addEventListener("pointerup", lift);
      dpad.addEventListener("pointercancel", lift);
      dpad.addEventListener("lostpointercapture", lift);
      dpad.addEventListener("contextmenu", stop);
    }
  }

  /* Full screen takes the picture and, on a touch screen, the pad with
     it; a phone is turned on its side for the bigger picture. */
  var canFull = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !!stage;
  function fullNow() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function toggleFull() {
    if (fullNow()) {
      var leave = document.exitFullscreen || document.webkitExitFullscreen;
      if (leave) { leave.call(document); }
      return;
    }
    var enter = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!enter) { return; }
    var p = enter.call(stage);
    if (p && p.then) {
      p.then(function () {
        if (padShown && window.screen && screen.orientation && screen.orientation.lock) { screen.orientation.lock("landscape").catch(function () {}); }
      }).catch(function () {});
    }
    canvas.focus({ preventScroll: true });
  }
  if (fullBtn) { fullBtn.addEventListener("click", toggleFull); }
  if (padFull) { padFull.addEventListener("click", toggleFull); }
  function onFull() {
    var on = !!fullNow();
    if (padFull) { padFull.textContent = on ? "Exit full screen" : "Full screen"; }
    fitScreen();
  }
  document.addEventListener("fullscreenchange", onFull);
  document.addEventListener("webkitfullscreenchange", onFull);
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
     The cover stays up while they are typed, unless the list starts
     with "bg" (Descent: just pick the ready-made pilot once it asks). */
  function autoKeys() {
    var script = (root.getAttribute("data-autokeys") || "").split(/\s+/).filter(Boolean);
    if (!script.length) { return Promise.resolve(); }
    var background = script[0] === "bg";           /* "bg": type them while the game is already showing */
    if (background) { script.shift(); }
    else { bar.hidden = true; msg.textContent = "Setting up the sound card..."; }
    var done = script.reduce(function (chain, step) {
      return chain.then(function () {
        return new Promise(function (resolve) {
          if (/^\d+$/.test(step)) { setTimeout(resolve, Number(step)); return; }
          if (ci) { tap(step); }
          setTimeout(resolve, 800);
        });
      });
    }, Promise.resolve());
    return background ? Promise.resolve() : done;
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
      if (fullBtn && canFull && !padShown) { fullBtn.hidden = false; }
      if (resetBtn) { resetBtn.hidden = false; }
      addSpeaker();
      canvas.focus({ preventScroll: true });
      return autoKeys();
    }).then(function () {
      cover.hidden = true;
      if (padShown) { say("Use the buttons by the picture. Drag on the picture to look around, tap it to click."); }
      else { say(mouseMode === "lock" ? "Keys go to the game. Click it to look around with the mouse." : "Keys go to the game."); }
    }).catch(fail);
  }
  play.addEventListener("click", start);
  /* any first click or key press may be what unlocks the sound */
  document.addEventListener("pointerdown", unlockAudio, true);
  if (window.matchMedia("(pointer: coarse)").matches) { showPad(); }     /* phones and tablets: the pad is there from the start */
  start();

  document.addEventListener("visibilitychange", function () {
    if (!ci) { return; }
    if (document.hidden) { ci.pause(); if (audio) { audio.suspend(); } }
    else { ci.resume(); if (audio) { audio.resume(); } }
  });
  window.addEventListener("pagehide", function () { if (ci) { try { ci.exit(); } catch (e) { /* closing anyway */ } } });
})();
