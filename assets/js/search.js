/* Title search for the home page. Plain JavaScript, no libraries.
   Fetches /index.json (title, url, date of every post) on the first
   keystroke, then filters titles as you type. Matching is
   case-insensitive and every word in the query must appear in the
   title, so "port security" finds "Port security on access switches". */
(function () {
  "use strict";

  var wrap = document.getElementById("site-search");
  if (!wrap || !window.fetch) { return; }
  wrap.hidden = false;

  var input = document.getElementById("search-input");
  var list = document.getElementById("search-results");
  var count = document.getElementById("search-count");
  var blocks = document.querySelectorAll(".post-block");
  var index = null;
  var loading = false;

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function setBlocks(visible) {
    for (var i = 0; i < blocks.length; i++) { blocks[i].hidden = !visible; }
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    if (q === "") {
      list.hidden = true;
      list.innerHTML = "";
      count.textContent = "";
      setBlocks(true);
      return;
    }
    if (!index) { loadIndex(); return; }

    var words = q.split(/\s+/);
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var title = index[i].title.toLowerCase();
      var ok = true;
      for (var j = 0; j < words.length; j++) {
        if (title.indexOf(words[j]) === -1) { ok = false; break; }
      }
      if (ok) { hits.push(index[i]); }
    }

    var html = "";
    for (var k = 0; k < hits.length; k++) {
      html += "<li><time datetime=\"" + hits[k].date + "\">" + hits[k].date +
        "</time><a href=\"" + hits[k].url + "\">" + esc(hits[k].title) + "</a></li>";
    }
    list.innerHTML = html;
    list.hidden = (hits.length === 0);
    setBlocks(false);
    count.textContent = hits.length === 0
      ? "no matching titles"
      : hits.length + (hits.length === 1 ? " matching title" : " matching titles");
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
