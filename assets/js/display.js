/* Runs in <head>, before anything is drawn, so nothing flashes at the
   wrong size or pops up and disappears. It only sets classes on <html>:

   - zoom-125 ... zoom-200: the desktop size chosen in Start > Settings >
     Display (see "desktop size" in win98.css). Without a choice the
     stylesheet picks a size from the width of the screen.
   - welcome-seen: this visitor has already had the Welcome window, so
     the home page doesn't draw it again.
   - booting: show the start-up screen. Only on the home page, and only
     when a visit begins there for the first time, or after Shut Down >
     Restart. extras.js types the screen out and takes the class off
     again; the stylesheet takes the screen away by itself after a few
     seconds in case that script never arrives. */
(function () {
  try {
    var store = window.localStorage, root = document.documentElement;
    if (store.getItem("cfw.welcome") === "seen") { root.classList.add("welcome-seen"); }
    var z = store.getItem("cfw.zoom");
    if (/^(100|125|150|175|200)$/.test(z)) { root.classList.add("zoom-" + z); }
    var fresh = store.getItem("cfw.booted") !== "1", again = window.sessionStorage.getItem("cfw.reboot") === "1";
    if (window.location.pathname !== "/") {
      /* arrived on a note or a game: the machine is already "on", so the
         desktop won't suddenly start up later in the visit */
      if (fresh) { store.setItem("cfw.booted", "1"); }
    } else if ((fresh || again) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("booting");
    }
  } catch (e) { /* storage blocked: the automatic size, and the greeting, are fine */ }
})();
