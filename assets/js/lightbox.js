/* Lightbox for article images.
   Markdown wraps each image in a link to its own file; without JS that
   link still works. With JS, the click opens an overlay instead, closed
   by the X button, a click on the backdrop, or Escape. */
(function () {
  "use strict";

  function openLightbox(src, alt) {
    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", alt || "Enlarged image");

    var img = document.createElement("img");
    img.className = "lightbox-img";
    img.src = src;
    img.alt = alt || "";

    var close = document.createElement("button");
    close.className = "lightbox-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close image");
    close.textContent = "×";

    overlay.appendChild(img);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    document.body.classList.add("lightbox-open");
    close.focus();

    function destroy() {
      document.body.classList.remove("lightbox-open");
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }

    function onKey(e) {
      if (e.key === "Escape") destroy();
    }

    close.addEventListener("click", destroy);
    overlay.addEventListener("click", function (e) {
      if (e.target !== img) destroy();
    });
    document.addEventListener("keydown", onKey);
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest("article a");
    if (!link) return;
    var img = link.querySelector("img");
    if (!img) return;
    var href = link.getAttribute("href") || "";
    if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(href)) return;
    e.preventDefault();
    openLightbox(link.href, img.alt);
  });
})();
