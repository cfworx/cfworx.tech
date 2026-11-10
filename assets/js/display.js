/* Applies the visitor's chosen desktop size (Start > Settings > Display)
   before the page is drawn, so there is no jump from one size to
   another. Loaded without `defer`, ahead of the stylesheet, for that
   reason; everything else about Display lives in desktop.js. With no
   saved choice, win98.css picks a size from the screen's width. */
(function () {
  try {
    var z = window.localStorage.getItem("cfw.zoom");
    if (/^(100|125|150|175|200)$/.test(z)) { document.documentElement.classList.add("zoom-" + z); }
  } catch (e) { /* storage blocked: the automatic size is used */ }
})();
