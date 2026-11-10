/* Two things that have to be settled before the page is drawn, so
   nothing flashes on screen and then changes. Loaded without `defer`,
   ahead of the stylesheet, for that reason.

   1. The Welcome window shows once, the first time someone opens the
      desktop. After that this marks <html> and the stylesheet keeps it
      hidden (desktop.js records that it has been seen).
   2. The visitor's chosen desktop size (Start > Settings > Display).
      With no saved choice, win98.css picks a size from the screen's
      width. Everything else about Display lives in desktop.js. */
(function () {
  try {
    var store = window.localStorage, root = document.documentElement;
    if (store.getItem("cfw.welcome") === "seen") { root.classList.add("welcome-seen"); }
    var z = store.getItem("cfw.zoom");
    if (/^(100|125|150|175|200)$/.test(z)) { root.classList.add("zoom-" + z); }
  } catch (e) { /* storage blocked: Welcome shows each time, size is automatic */ }
})();
