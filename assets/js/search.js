/* Search for the home page. Plain JavaScript, no libraries.
   Fetches /index.json (title, url, date and plain-text body of every
   post) on the first keystroke, then filters as you type. Results come
   in two sections: posts whose TITLE matches, then posts whose BODY
   TEXT matches (with a short snippet around the first hit). Matching is
   case-insensitive and every word in the query must appear, so
   "port security" finds "Port security on access switches". */
(function () {
  "use strict";

  var wrap = document.getElementById("site-search");
  if (!wrap || !window.fetch) { return; }
  wrap.hidden = false;

  var input = document.getElementById("search-input");
  var count = document.getElementById("search-count");
  var titleSection = document.getElementById("search-title-section");
  var titleList = document.getElementById("search-title-results");
  var textSection = document.getElementById("search-text-section");
  var textList = document.getElementById("search-text-results");
  var blocks = document.querySelectorAll(".post-block");
  var index = null;
  var loading = false;

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Escape regex metacharacters so query words are matched literally. */
  function escRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function setBlocks(visible) {
    for (var i = 0; i < blocks.length; i++) { blocks[i].hidden = !visible; }
  }

  function containsAll(haystack, words) {
    for (var j = 0; j < words.length; j++) {
      if (haystack.indexOf(words[j]) === -1) { return false; }
    }
    return true;
  }

  /* ~60 chars of context either side of the first matched word,
     escaped, with every query word wrapped in <mark>. */
  function snippet(text, words) {
    var lower = text.toLowerCase();
    var pos = -1;
    for (var j = 0; j < words.length; j++) {
      var p = lower.indexOf(words[j]);
      if (p !== -1 && (pos === -1 || p < pos)) { pos = p; }
    }
    if (pos === -1) { pos = 0; }
    var start = Math.max(0, pos - 60);
    var end = Math.min(text.length, pos + 90);
    /* snap to word boundaries so we don't cut words in half */
    if (start > 0) {
      var sp = text.indexOf(" ", start);
      if (sp !== -1 && sp < pos) { start = sp + 1; }
    }
    if (end < text.length) {
      var ep = text.lastIndexOf(" ", end);
      if (ep > pos) { end = ep; }
    }
    var out = esc(text.slice(start, end));
    var re = new RegExp("(" + words.map(escRe).join("|") + ")", "gi");
    out = out.replace(re, "<mark>$1</mark>");
    return (start > 0 ? "&hellip;" : "") + out + (end < text.length ? "&hellip;" : "");
  }

  /* Each row is time | div, so the snippet stacks under the title in
     the second grid column with no extra CSS needed. */
  function row(p, extra) {
    return "<li><time datetime=\"" + p.date + "\">" + p.date +
      "</time><div class=\"hit\"><a href=\"" + p.url + "\">" + esc(p.title) + "</a>" +
      (extra || "") + "</div></li>";
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    if (q === "") {
      titleSection.hidden = true;
      textSection.hidden = true;
      titleList.innerHTML = "";
      textList.innerHTML = "";
      count.textContent = "";
      setBlocks(true);
      return;
    }
    if (!index) { loadIndex(); return; }

    var words = q.split(/\s+/);
    var titleHits = [];
    var textHits = [];
    for (var i = 0; i < index.length; i++) {
      var p = index[i];
      if (containsAll(p.title.toLowerCase(), words)) {
        titleHits.push(p);
      } else if (p.text && containsAll(p.text.toLowerCase(), words)) {
        textHits.push(p);
      }
    }

    var html = "";
    for (var k = 0; k < titleHits.length; k++) { html += row(titleHits[k]); }
    titleList.innerHTML = html;
    titleSection.hidden = (titleHits.length === 0);

    html = "";
    for (var m = 0; m < textHits.length; m++) {
      html += row(textHits[m],
        "<div class=\"snippet\">" + snippet(textHits[m].text, words) + "</div>");
    }
    textList.innerHTML = html;
    textSection.hidden = (textHits.length === 0);

    setBlocks(false);

    var total = titleHits.length + textHits.length;
    count.textContent = total === 0
      ? "no matches"
      : (titleHits.length + " in titles, " + textHits.length + " inside posts");
  }

  function loadIndex() {
    if (loading) { return; }
    loading = true;
    fetch("/index.json")
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; loading = false; render(); })
      .catch(function () { loading = false; count.textContent = "search is unavailable right now"; });
  }

  input.addEventListener("input", render);
  input.closest("form").addEventListener("submit", function (e) {
    e.preventDefault();
    render();
  });
})();
