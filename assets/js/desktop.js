/* The desktop: Start menu, windows, taskbar, clock and search. Plain
   JavaScript, no libraries; the only thing it ever fetches is the
   site's own /index.json (the search index), on first use.

   Everything here is an extra. Pages, icons, the address bar, Up and
   the close buttons are ordinary links and work with this file missing;
   controls that would be dead without it ship `hidden` in the HTML and
   are revealed below.

   Sections:  1 helpers   2 clock   3 windows + taskbar buttons
              4 menus (menu bars and the Start menu)   5 search
              6 Find window   7 Run, Shut Down, message box
              8 folder views + sorting   9 commands   10 start-up */
(function () {
  "use strict";

  var doc = document;
  var desktop = doc.getElementById("desktop");
  if (!desktop) { return; }

  /* ---- 1. helpers ------------------------------------------------------ */

  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function on(el, type, fn, opts) { if (el) { el.addEventListener(type, fn, opts); } }

  var small = window.matchMedia("(max-width: 700px)");
  var hover = window.matchMedia("(hover: hover) and (pointer: fine)");

  function store(kind, key, value) {
    try {
      var s = kind === "session" ? window.sessionStorage : window.localStorage;
      if (value === undefined) { return s.getItem(key); }
      s.setItem(key, value);
    } catch (e) { /* private mode, blocked storage: carry on without */ }
    return null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* The desktop may be magnified (CSS `zoom`, see "desktop size" in
     win98.css). Mouse positions and getBoundingClientRect() are in
     screen pixels; style.left/top are in the desktop's own pixels.
     This is the factor between the two. */
  function scale() {
    var w = desktop.offsetWidth;
    return w ? (desktop.getBoundingClientRect().width / w) || 1 : 1;
  }

  /* Controls that need this script ship hidden; show them. */
  function reveal(root) {
    $$("[data-cmd][hidden], [data-win][hidden], .menu-bar[hidden], .task-search[hidden]", root)
      .forEach(function (el) { el.hidden = false; });
  }

  /* ---- 2. clock -------------------------------------------------------- */

  var clock = doc.getElementById("clock");
  function tick() {
    if (!clock) { return; }
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    clock.textContent = (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h < 12 ? "AM" : "PM");
    clock.title = d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
  tick();
  setInterval(tick, 15000);

  /* ---- 3. windows and their taskbar buttons ---------------------------- */

  var taskButtons = doc.getElementById("task-buttons");
  var wins = [];          /* { el, btn } in opening order */
  var zTop = 20;

  function entry(el) {
    for (var i = 0; i < wins.length; i++) { if (wins[i].el === el) { return wins[i]; } }
    return null;
  }

  function activate(el) {
    wins.forEach(function (w) {
      var active = w.el === el && !w.el.classList.contains("is-min");
      w.el.classList.toggle("is-inactive", !active);
      w.btn.classList.toggle("is-active", active);
      w.btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (el && !el.classList.contains("is-min")) { el.style.zIndex = String(++zTop); }
  }

  function topWindow() {
    var best = null;
    wins.forEach(function (w) {
      if (w.el.classList.contains("is-min")) { return; }
      if (!best || Number(w.el.style.zIndex || 0) >= Number(best.style.zIndex || 0)) { best = w.el; }
    });
    return best;
  }

  function minimize(el) { el.classList.add("is-min"); activate(topWindow()); }
  function restore(el) { el.classList.remove("is-min"); activate(el); }

  function toggleMax(el) {
    if (small.matches) { return; }
    if (el.classList.contains("is-max")) {
      el.classList.remove("is-max");
      /* a window that was born maximized has no size of its own yet */
      if (!el.style.width && el.classList.contains("win-explorer")) {
        el.style.left = "9%"; el.style.top = "5%"; el.style.width = "82%"; el.style.height = "86%";
      }
    } else {
      el.classList.add("is-max");
    }
    var b = $(".tb-max", el);
    if (b) {
      var max = el.classList.contains("is-max");
      b.title = max ? "Restore" : "Maximize";
      b.setAttribute("aria-label", b.title);
    }
  }

  function closeWindow(el) {
    var w = entry(el);
    if (!w) { return; }
    el.remove();
    w.btn.remove();
    wins.splice(wins.indexOf(w), 1);
    activate(topWindow());
  }

  function drag(el, bar) {
    on(bar, "pointerdown", function (e) {
      if (e.button !== 0 || e.target.closest(".title-controls")) { return; }
      if (small.matches || el.classList.contains("is-max")) { return; }
      var r = el.getBoundingClientRect(), d = desktop.getBoundingClientRect();
      var ox = e.clientX - r.left, oy = e.clientY - r.top, z = scale();
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      function move(ev) {
        var x = (ev.clientX - d.left - ox) / z, y = (ev.clientY - d.top - oy) / z;
        x = Math.max((60 - r.width) / z, Math.min((d.width - 60) / z, x));
        y = Math.max(0, Math.min((d.height - 22) / z, y));
        el.style.left = x + "px";
        el.style.top = y + "px";
      }
      function up() {
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
        bar.removeEventListener("pointercancel", up);
      }
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
      bar.addEventListener("pointercancel", up);
      e.preventDefault();
    });
    on(bar, "dblclick", function (e) {
      if (e.target.closest(".title-controls") || !$(".tb-max", el)) { return; }
      toggleMax(el);
    });
  }

  function register(el) {
    reveal(el);
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "task-btn";
    var img = doc.createElement("img");
    img.src = "/icons/" + (el.getAttribute("data-icon") || "doc") + "-16.png";
    img.alt = ""; img.width = 16; img.height = 16;
    var label = doc.createElement("span");
    label.textContent = el.getAttribute("data-task") || "Window";
    btn.title = label.textContent;
    btn.appendChild(img);
    btn.appendChild(label);
    on(btn, "click", function () {
      if (el.classList.contains("is-min")) { restore(el); }
      else if (btn.classList.contains("is-active")) { minimize(el); }
      else { activate(el); }
    });
    if (taskButtons) { taskButtons.appendChild(btn); }
    wins.push({ el: el, btn: btn });
    on(el, "pointerdown", function () { if (el.classList.contains("is-inactive")) { activate(el); } }, true);
    var bar = $(".title-bar", el);
    if (bar) { drag(el, bar); }
    var max = $(".tb-max", el);
    if (max && el.classList.contains("is-max")) { max.title = "Restore"; max.setAttribute("aria-label", "Restore"); }
    activate(el);
  }

  /* Windows opened on top of the page come from <template id="tpl-NAME">. */
  function openApp(name) {
    var open = $('.window[data-app="' + name + '"]', desktop);
    if (open) { restore(open); return open; }
    var tpl = doc.getElementById("tpl-" + name);
    if (!tpl || !tpl.content) { return null; }
    var el = tpl.content.firstElementChild.cloneNode(true);
    el.setAttribute("data-app", name);
    desktop.appendChild(el);
    register(el);
    /* cascade a little so two windows never sit exactly on top of each other */
    if (!small.matches && wins.length > 2) {
      var r = el.getBoundingClientRect(), d = desktop.getBoundingClientRect(), n = (wins.length - 2) * 18, z = scale();
      el.style.left = Math.min((d.width - 80) / z, (r.left - d.left) / z + n) + "px";
      el.style.top = Math.min((d.height - 60) / z, (r.top - d.top) / z + n) + "px";
    }
    return el;
  }

  on(doc, "click", function (e) {
    var t = e.target.closest("[data-win]");
    if (!t) { return; }
    var el = t.closest(".window");
    if (!el) { return; }
    var what = t.getAttribute("data-win");
    if (what === "min") { minimize(el); }
    else if (what === "max") { toggleMax(el); }
    else if (what === "close") { closeWindow(el); }
  });

  /* ---- 4. menus ------------------------------------------------------- */

  var startButton = doc.getElementById("start-button");
  var startMenu = doc.getElementById("start-menu");
  var openBar = null;      /* the open menu-bar button, if any */

  function closeSubs(root) {
    $$(".has-sub.is-open", root).forEach(function (li) {
      li.classList.remove("is-open");
      var b = li.firstElementChild, m = $(".submenu", li);
      if (b) { b.setAttribute("aria-expanded", "false"); }
      if (m) { m.hidden = true; }
    });
  }

  function closeMenus() {
    if (openBar) {
      openBar.setAttribute("aria-expanded", "false");
      openBar.nextElementSibling.hidden = true;
      openBar = null;
    }
    if (startMenu && !startMenu.hidden) {
      startMenu.hidden = true;
      closeSubs(startMenu);
      startButton.setAttribute("aria-expanded", "false");
    }
    closeSearchPop();
  }

  function openSub(li) {
    var parent = li.parentElement;
    $$(":scope > .has-sub.is-open", parent).forEach(function (other) {
      if (other !== li) { closeSubs(other); other.classList.remove("is-open"); var m = $(":scope > .submenu", other); if (m) { m.hidden = true; } other.firstElementChild.setAttribute("aria-expanded", "false"); }
    });
    var sub = $(":scope > .submenu", li);
    if (!sub) { return; }
    li.classList.add("is-open");
    li.firstElementChild.setAttribute("aria-expanded", "true");
    sub.hidden = false;
    sub.classList.remove("flip-up");
    sub.style.left = "";
    if (!small.matches) {
      /* keep the flyout on screen: grow upward near the bottom, and open
         to the left if there is no room on the right */
      var r = sub.getBoundingClientRect();
      var floor = (doc.getElementById("taskbar") || desktop).getBoundingClientRect().top;
      if (r.bottom > floor) { sub.classList.add("flip-up"); }
      if (r.right > window.innerWidth) { sub.style.left = (3 - r.width / scale()) + "px"; }
    } else {
      li.scrollIntoView({ block: "nearest" });
    }
  }

  function toggleStart(show) {
    if (!startMenu) { return; }
    var want = show === undefined ? startMenu.hidden : show;
    closeMenus();
    if (want) {
      startMenu.hidden = false;
      startButton.setAttribute("aria-expanded", "true");
    }
  }

  if (startButton && startMenu) {
    on(startButton, "click", function (e) { e.preventDefault(); toggleStart(); });
    on(startButton, "keydown", function (e) {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        toggleStart(true);
        var last = $$(".start-list > li > .menu-item", startMenu);
        if (last.length) { last[e.key === " " ? 0 : last.length - 1].focus(); }
      }
    });
  }

  /* submenu buttons: click always toggles (that is the phone path) */
  on(doc, "click", function (e) {
    var b = e.target.closest(".has-sub > .menu-item");
    if (!b) { return; }
    e.preventDefault();
    e.stopPropagation();
    var li = b.parentElement;
    if (li.classList.contains("is-open")) {
      closeSubs(li); li.classList.remove("is-open"); b.setAttribute("aria-expanded", "false");
      var m = $(":scope > .submenu", li); if (m) { m.hidden = true; }
    } else {
      openSub(li);
    }
  }, true);

  /* with a mouse, submenus also fly out on hover, after a short pause */
  var hoverTimer = null;
  on(doc, "mouseover", function (e) {
    if (!hover.matches || small.matches) { return; }
    var item = e.target.closest(".menu .menu-item");
    if (!item || !item.closest(".start-menu")) { return; }
    var li = item.parentElement;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () {
      if (li.classList.contains("has-sub")) { if (!li.classList.contains("is-open")) { openSub(li); } }
      else {
        $$(":scope > .has-sub.is-open", li.parentElement).forEach(function (o) {
          closeSubs(o); o.classList.remove("is-open"); $(":scope > .submenu", o).hidden = true; o.firstElementChild.setAttribute("aria-expanded", "false");
        });
      }
    }, 180);
  });

  /* window menu bars */
  function openBarMenu(btn) {
    closeMenus();
    openBar = btn;
    btn.setAttribute("aria-expanded", "true");
    btn.nextElementSibling.hidden = false;
    syncChecks();
  }
  on(doc, "click", function (e) {
    var btn = e.target.closest(".menu-btn");
    if (btn) {
      if (openBar === btn) { closeMenus(); } else { openBarMenu(btn); }
      return;
    }
    /* any other click: close whatever is open, unless it was inside a menu
       (links and commands in menus close them once they have run) */
    if (e.target.closest(".has-sub > .menu-item") || e.target.closest("#start-button") ||
        e.target.closest("#task-search") || e.target.closest("#search-pop")) { return; }
    closeMenus();
  });
  on(doc, "mouseover", function (e) {
    var btn = e.target.closest(".menu-btn");
    if (btn && openBar && openBar !== btn) { openBarMenu(btn); }
  });

  /* arrow keys inside any open menu */
  on(doc, "keydown", function (e) {
    if (e.key === "Escape") {
      var shut = doc.getElementById("shutdown-screen");
      if (shut && !shut.hidden) { shut.hidden = true; return; }
      if (openBar || (startMenu && !startMenu.hidden) || (searchPop && !searchPop.hidden)) {
        var back = openBar || (startMenu && !startMenu.hidden ? startButton : null);
        closeMenus();
        if (back) { back.focus(); }
        return;
      }
      var top = topWindow();
      if (top && top.getAttribute("data-app")) { closeWindow(top); }
      return;
    }
    var item = doc.activeElement && doc.activeElement.closest ? doc.activeElement.closest(".menu .menu-item, .start-list .menu-item") : null;
    if (!item || item.closest("#search-pop")) { return; }
    var li = item.parentElement, list = li.parentElement;
    var items = $$(":scope > li > .menu-item:not(:disabled)", list);
    var i = items.indexOf(item);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "ArrowRight" && li.classList.contains("has-sub")) {
      e.preventDefault(); openSub(li);
      var first = $(":scope > .submenu > li > .menu-item", li); if (first) { first.focus(); }
    } else if (e.key === "ArrowLeft") {
      var parentLi = list.closest(".has-sub");
      if (parentLi) { e.preventDefault(); closeSubs(parentLi); parentLi.classList.remove("is-open"); $(":scope > .submenu", parentLi).hidden = true; parentLi.firstElementChild.focus(); }
    }
  });

  /* ---- 5. search ------------------------------------------------------- */

  var searchForm = doc.getElementById("task-search");
  var searchInput = doc.getElementById("task-search-input");
  var searchPop = doc.getElementById("search-pop");
  var index = null, indexPromise = null;
  var KINDS = { note: "Text Document", lab: "Lab Write-up", tool: "Practice Tool", game: "Game", folder: "File Folder", app: "Shortcut" };

  /* The index lists pages, folders and desktop icons. An icon that points
     at a page is folded into that page (so "IT Notes" finds /notes/). */
  function prepare(data) {
    var byUrl = {}, out = [];
    data.forEach(function (p) {
      if (p.kind === "app") { return; }
      p.name = p.title.toLowerCase() + (p.keys ? " " + p.keys.toLowerCase() : "");
      p.body = (p.text || "").toLowerCase();
      byUrl[p.url] = p;
      out.push(p);
    });
    data.forEach(function (p) {
      if (p.kind !== "app") { return; }
      var page = p.url && byUrl[p.url];
      if (page) {
        page.name += " " + p.title.toLowerCase() + " " + (p.text || "").toLowerCase();
        page.icon = p.icon;
        page.shortcut = true;
      } else {
        p.name = p.title.toLowerCase() + " " + (p.text || "").toLowerCase();
        p.body = ""; p.text = "";
        out.push(p);
      }
    });
    return out;
  }

  function loadIndex() {
    if (index) { return Promise.resolve(index); }
    if (!indexPromise) {
      indexPromise = fetch("/index.json")
        .then(function (r) { if (!r.ok) { throw new Error("index " + r.status); } return r.json(); })
        .then(function (data) { index = prepare(data); return index; })
        .catch(function (err) { indexPromise = null; throw err; });
    }
    return indexPromise;
  }

  function words(q) { return q.trim().toLowerCase().split(/\s+/).filter(Boolean); }
  function hasAll(hay, ws) {
    for (var i = 0; i < ws.length; i++) { if (hay.indexOf(ws[i]) === -1) { return false; } }
    return true;
  }

  /* ~60 characters either side of the first hit, with the words marked. */
  function snippet(text, ws) {
    var lower = text.toLowerCase(), pos = -1;
    ws.forEach(function (w) { var p = lower.indexOf(w); if (p !== -1 && (pos === -1 || p < pos)) { pos = p; } });
    if (pos === -1) { return ""; }
    var start = Math.max(0, pos - 60), end = Math.min(text.length, pos + 90);
    if (start > 0) { var sp = text.indexOf(" ", start); if (sp !== -1 && sp < pos) { start = sp + 1; } }
    if (end < text.length) { var ep = text.lastIndexOf(" ", end); if (ep > pos) { end = ep; } }
    return (start > 0 ? "&hellip;" : "") + mark(text.slice(start, end), ws) + (end < text.length ? "&hellip;" : "");
  }
  function mark(text, ws) {
    var out = esc(text);
    if (!ws.length) { return out; }
    return out.replace(new RegExp("(" + ws.map(function (w) { return escRe(esc(w)); }).join("|") + ")", "gi"), "<mark>$1</mark>");
  }

  var PROGRAM = { app: 1, tool: 1, game: 1 };
  function rank(a, b, q) {
    var as = a.name.indexOf(q) === 0 ? 0 : 1, bs = b.name.indexOf(q) === 0 ? 0 : 1;
    if (as !== bs) { return as - bs; }
    var ak = PROGRAM[a.kind] || a.shortcut ? 0 : (a.kind === "folder" ? 1 : 2);
    var bk = PROGRAM[b.kind] || b.shortcut ? 0 : (b.kind === "folder" ? 1 : 2);
    if (ak !== bk) { return ak - bk; }
    return a.date < b.date ? 1 : (a.date > b.date ? -1 : a.title.localeCompare(b.title));
  }

  function query(q) {
    var ws = words(q), res = { ws: ws, names: [], texts: [] };
    if (!ws.length || !index) { return res; }
    index.forEach(function (p) {
      if (hasAll(p.name, ws)) { res.names.push(p); }
      else if (p.body && hasAll(p.body, ws)) { res.texts.push(p); }
    });
    var ql = ws.join(" ");
    res.names.sort(function (a, b) { return rank(a, b, ql); });
    res.texts.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return res;
  }

  /* one result as a menu row: a link, or a button for built-in windows */
  function resultRow(p, ws, withSnippet) {
    var inside = '<img src="/icons/' + esc(p.icon || "doc") + '-16.png" alt="" width="16" height="16">' +
      '<span class="hit">' + mark(p.title, ws) +
      (withSnippet ? "<small>" + snippet(p.text, ws) + "</small>"
                   : (p.folder ? "<small>" + esc(p.kind === "app" ? "Desktop" : "C:\\" + p.folder) + "</small>" : "")) +
      "</span>";
    if (p.app) { return '<button type="button" class="menu-item" data-cmd="' + esc(p.app) + '">' + inside + "</button>"; }
    return '<a class="menu-item" href="' + esc(p.url) + '"' + (p.ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + inside + "</a>";
  }

  var cursor = -1;
  function closeSearchPop() {
    if (!searchPop || searchPop.hidden) { return; }
    searchPop.hidden = true;
    cursor = -1;
    if (searchInput) { searchInput.setAttribute("aria-expanded", "false"); }
  }

  function renderPop() {
    if (!searchPop) { return; }
    var q = searchInput.value;
    if (!q.trim()) { closeSearchPop(); return; }
    if (!index) {
      searchPop.innerHTML = '<p class="pop-empty">Searching...</p>';
      searchPop.hidden = false;
      loadIndex().then(renderPop, function () {
        searchPop.innerHTML = '<p class="pop-empty">Search is unavailable right now.</p>';
      });
      return;
    }
    var res = query(q), html = "";
    var progs = res.names.filter(function (p) { return PROGRAM[p.kind] || p.shortcut || p.kind === "folder"; });
    var notes = res.names.filter(function (p) { return progs.indexOf(p) === -1; });
    if (progs.length) {
      html += '<p class="pop-head">Programs and folders</p>';
      progs.slice(0, 5).forEach(function (p) { html += resultRow(p, res.ws, false); });
    }
    if (notes.length) {
      html += '<p class="pop-head">Notes and labs</p>';
      notes.slice(0, 7).forEach(function (p) { html += resultRow(p, res.ws, false); });
    }
    if (res.texts.length) {
      html += '<p class="pop-head">Inside notes</p>';
      res.texts.slice(0, 5).forEach(function (p) { html += resultRow(p, res.ws, true); });
    }
    var total = res.names.length + res.texts.length;
    if (!total) {
      html = '<p class="pop-empty">Nothing found for "' + esc(q.trim()) + '".</p>';
    } else {
      html += '<div class="sep"></div><button type="button" class="menu-item" data-cmd="find-all">' +
        '<img src="/icons/find-16.png" alt="" width="16" height="16"><span class="hit">See all ' + total + " result" + (total === 1 ? "" : "s") + "...</span></button>";
    }
    searchPop.innerHTML = html;
    searchPop.hidden = false;
    searchPop.scrollTop = 0;
    cursor = -1;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function moveCursor(step) {
    var items = $$(".menu-item", searchPop);
    if (!items.length) { return; }
    if (cursor >= 0 && items[cursor]) { items[cursor].classList.remove("is-cursor"); }
    cursor = (cursor + step + items.length + (cursor < 0 && step < 0 ? 1 : 0)) % items.length;
    items[cursor].classList.add("is-cursor");
    items[cursor].scrollIntoView({ block: "nearest" });
  }

  if (searchForm && searchInput) {
    var popTimer = null;
    on(searchInput, "input", function () { clearTimeout(popTimer); popTimer = setTimeout(renderPop, 60); });
    on(searchInput, "focus", function () {
      if (startMenu && !startMenu.hidden) { toggleStart(false); }
      loadIndex().catch(function () {});
      if (searchInput.value.trim()) { renderPop(); }
    });
    on(searchInput, "keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (searchPop.hidden) { renderPop(); } else { moveCursor(1); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    });
    on(searchForm, "submit", function (e) {
      e.preventDefault();
      var items = $$(".menu-item", searchPop);
      if (!searchPop.hidden && cursor >= 0 && items[cursor]) { items[cursor].click(); return; }
      if (searchInput.value.trim()) { openFind(searchInput.value.trim()); }
    });
    /* "/" jumps to search from anywhere you aren't already typing */
    on(doc, "keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) { return; }
      var a = doc.activeElement, tag = a && a.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) { return; }
      if (doc.body.classList.contains("keys-captured")) { return; }   /* a game has the keyboard */
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    });
  }

  /* ---- 6. the Find window ------------------------------------------------ */

  function openFind(preset) {
    closeMenus();
    var el = openApp("find");
    if (!el) { return; }
    var named = $("#find-named", el), text = $("#find-text", el), scope = $("#find-in", el);
    var rows = $("#find-rows", el), status = $("#find-status", el), glass = $(".find-glass", el);
    var form = $(".find-form", el);

    function run() {
      var nw = words(named.value), tw = words(text.value), kind = scope.value;
      if (!nw.length && !tw.length) {
        rows.innerHTML = "";
        status.textContent = "Type a name or some text, then choose Find Now.";
        return;
      }
      if (!index) {
        status.textContent = "Searching...";
        if (glass) { glass.classList.add("is-busy"); }
        loadIndex().then(run, function () { status.textContent = "Search is unavailable right now."; });
        return;
      }
      if (glass) { glass.classList.remove("is-busy"); }
      var hits = [];
      index.forEach(function (p) {
        if (kind && p.kind !== kind) { return; }
        if (nw.length && !hasAll(p.name, nw)) { return; }
        var inName = tw.length ? hasAll(p.name, tw) : true;
        if (tw.length && !inName && !(p.body && hasAll(p.body, tw))) { return; }
        hits.push({ p: p, inName: inName });
      });
      var ql = (nw.length ? nw : tw).join(" ");
      hits.sort(function (a, b) {
        if (a.inName !== b.inName) { return a.inName ? -1 : 1; }
        return rank(a.p, b.p, ql);
      });
      var all = nw.concat(tw), html = "";
      hits.slice(0, 200).forEach(function (h) {
        var p = h.p, where = p.kind === "app" ? "Desktop" : "C:\\" + (p.folder || "");
        var link = p.app
          ? '<a href="#" data-cmd="' + esc(p.app) + '">'
          : '<a href="' + esc(p.url) + '"' + (p.ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">";
        html += '<tr><td class="f-name">' + link +
          '<img class="i16" src="/icons/' + esc(p.icon || "doc") + '-16.png" alt="" width="16" height="16"><span>' + mark(p.title, all) + "</span></a>" +
          '<span class="in-folder" hidden>' + esc(where) + "</span>" +
          (tw.length && !h.inName ? '<span class="snip">' + snippet(p.text, tw) + "</span>" : "") +
          '</td><td class="f-folder">' + esc(where) + '</td><td class="f-type">' + (KINDS[p.kind] || "") +
          '</td><td class="f-date">' + (p.date ? esc(shortDate(p.date)) : "") + "</td></tr>";
      });
      rows.innerHTML = html;
      $$(".in-folder", rows).forEach(function (s) { s.hidden = !small.matches; });
      status.textContent = hits.length === 0 ? "0 file(s) found" :
        hits.length + " file(s) found" + (hits.length > 200 ? " (showing the first 200)" : "");
    }

    if (!el.getAttribute("data-ready")) {
      el.setAttribute("data-ready", "1");
      var t = null;
      function soon() { clearTimeout(t); t = setTimeout(run, 120); }
      on(named, "input", soon);
      on(text, "input", soon);
      on(scope, "change", run);
      on(form, "submit", function (e) { e.preventDefault(); run(); });
      on($('[data-find="new"]', el), "click", function () {
        named.value = ""; text.value = ""; scope.value = ""; run(); named.focus();
      });
    }
    if (preset !== undefined) { named.value = ""; text.value = preset; }
    run();
    if (!small.matches || preset === undefined) { (preset === undefined ? named : text).focus(); }
    loadIndex().catch(function () {});
  }

  function shortDate(iso) {
    var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(iso);
    return m ? Number(m[2]) + "/" + Number(m[3]) + "/" + m[1] : iso;
  }

  /* ---- 7. Run, Shut Down, message box ------------------------------------- */

  function message(text, title, icon) {
    var old = $('.window[data-app="msg"]', desktop);
    if (old) { closeWindow(old); }
    var el = openApp("msg");
    if (!el) { return; }
    $(".msg-text", el).textContent = text;
    if (title) { $(".title-text", el).textContent = title; }
    if (icon) { $(".msg-icon", el).src = "/icons/" + icon + "-32.png"; }
    var ok = $(".btn-default", el);
    if (ok) { ok.focus(); }
  }

  var RUN_ALIASES = {
    "winmine": "/games/minesweeper/", "mines": "/games/minesweeper/",
    "explorer": "/explorer/", "my computer": "/computer/", "c:": "/explorer/", "c:\\": "/explorer/",
    "notepad": "/notes/", "command": "/tools/cli/", "cmd": "/tools/cli/", "calc": "/tools/subnetting/",
    "desktop": "/", "help": "cmd:help", "winver": "cmd:about", "find": "cmd:find",
    "welcome": "cmd:welcome", "display": "cmd:display", "control": "cmd:display", "desk.cpl": "cmd:display", "settings": "cmd:display"
  };

  function go(p) {
    if (p.app) { command(p.app); }
    else if (p.ext) { window.open(p.url, "_blank", "noopener"); }
    else { window.location.href = p.url; }
  }

  function openRun() {
    closeMenus();
    var el = openApp("run");
    if (!el) { return; }
    var input = $("#run-input", el);
    if (!el.getAttribute("data-ready")) {
      el.setAttribute("data-ready", "1");
      on($("#run-form", el), "submit", function (e) {
        e.preventDefault();
        var raw = input.value.trim();
        if (!raw) { return; }
        if (/^https?:\/\//i.test(raw)) { window.open(raw, "_blank", "noopener"); closeWindow(el); return; }
        if (raw.charAt(0) === "/") { window.location.href = raw; return; }
        var q = raw.toLowerCase().replace(/\.(exe|com|bat|htm|html|txt)$/, "");
        var alias = RUN_ALIASES[q];
        if (alias) {
          closeWindow(el);
          if (alias.indexOf("cmd:") === 0) { command(alias.slice(4)); } else { window.location.href = alias; }
          return;
        }
        loadIndex().then(function () {
          var ws = words(q), best = null;
          index.forEach(function (p) { if (!best && p.title.toLowerCase() === q) { best = p; } });
          if (!best) {
            var res = query(q);
            best = res.names[0] || null;
          }
          if (best) { closeWindow(el); go(best); return; }
          message("Cannot find the file '" + raw + "' (or one of its components). Make sure the path and filename are correct, or try Search on the taskbar.", raw, "error");
        }, function () { message("Search is unavailable right now.", "Run", "error"); });
      });
    }
    input.focus();
    input.select();
  }

  function openShutdown() {
    closeMenus();
    var el = openApp("shutdown");
    if (!el || el.getAttribute("data-ready")) { return; }
    el.setAttribute("data-ready", "1");
    on($("#shutdown-form", el), "submit", function (e) {
      e.preventDefault();
      var pick = $('input[name="sd"]:checked', el);
      var what = pick ? pick.value : "shutdown";
      closeWindow(el);
      if (what === "restart") { window.location.href = "/"; return; }
      if (what === "dos") { window.location.href = "/games/"; return; }
      var screen = doc.getElementById("shutdown-screen");
      if (!screen) { return; }
      $("p", screen).hidden = what === "standby";
      screen.hidden = false;
      var wake = $(".shutdown-wake", screen);
      if (wake) { wake.focus(); }
    });
  }
  /* Display Properties: the size of the whole desktop. The choice is a
     class on <html> (zoom-125 ... zoom-200) kept in localStorage;
     display.js re-applies it on every page before anything is drawn. */
  function setZoom(value) {
    var root = doc.documentElement;
    ["100", "125", "150", "175", "200"].forEach(function (v) { root.classList.remove("zoom-" + v); });
    try {
      if (value === "auto") { window.localStorage.removeItem("cfw.zoom"); }
      else { root.classList.add("zoom-" + value); window.localStorage.setItem("cfw.zoom", value); }
    } catch (e) { if (value !== "auto") { root.classList.add("zoom-" + value); } }
    window.dispatchEvent(new Event("resize"));     /* games re-measure themselves */
  }
  function openDisplay() {
    closeMenus();
    var el = openApp("display");
    if (!el) { return; }
    var saved = store("local", "cfw.zoom") || "auto";
    var pick = $('input[name="zoom"][value="' + saved + '"]', el) || $('input[name="zoom"][value="auto"]', el);
    pick.checked = true;
    if (el.getAttribute("data-ready")) { return; }
    el.setAttribute("data-ready", "1");
    function apply() { var c = $('input[name="zoom"]:checked', el); if (c) { setZoom(c.value); } }
    on($("#display-form", el), "submit", function (e) { e.preventDefault(); apply(); closeWindow(el); });
    on($('[data-display="apply"]', el), "click", apply);
  }

  on($("#shutdown-screen .shutdown-wake"), "click", function () {
    doc.getElementById("shutdown-screen").hidden = true;
  });

  /* ---- 7a. dragging desktop icons into the Recycle Bin ------------------------
     Mouse only. An icon dropped anywhere else springs back. Nothing is
     stored: the icons are only hidden, and a reload brings them back. */

  var recycled = [], binCount = 0, swallowClick = false;

  function binAt(ev) {
    var bin = $('.desktop-icons .dicon[data-cmd="recycle"]');
    if (!bin || bin.hidden) { return null; }
    var r = bin.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom ? bin : null;
  }

  function renderBin() {
    var el = $('.window[data-app="recycle"]', desktop);
    if (!el) { return; }
    var list = $(".bin-list", el), empty = $(".empty-folder", el), count = $(".bin-count", el);
    list.innerHTML = "";
    recycled.forEach(function (icon) {
      var li = doc.createElement("li"), b = doc.createElement("button");
      b.type = "button"; b.className = "bin-item";
      b.innerHTML = '<img src="' + esc(($("img", icon) || {}).src || "") + '" alt="" width="32" height="32"><span>' + esc(icon.textContent.trim()) + "</span>";
      b.title = "Put " + icon.textContent.trim() + " back on the desktop";
      on(b, "click", function () {
        icon.hidden = false;
        recycled.splice(recycled.indexOf(icon), 1);
        renderBin();
      });
      li.appendChild(b); list.appendChild(li);
    });
    list.hidden = recycled.length === 0;
    empty.hidden = recycled.length !== 0;
    count.textContent = recycled.length + " object(s)";
  }

  on(doc, "dragstart", function (e) {
    if (e.target.closest && e.target.closest(".dicon")) { e.preventDefault(); }
  });
  on(doc, "pointerdown", function (e) {
    var icon = e.target.closest ? e.target.closest(".desktop-icons .dicon") : null;
    if (!icon || e.button !== 0 || e.pointerType === "touch" || small.matches) { return; }
    var sx = e.clientX, sy = e.clientY, moved = false, z = scale(), over = null;
    function move(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 6) { return; }
      if (!moved) { moved = true; icon.classList.add("is-dragging"); }
      icon.style.transform = "translate(" + dx / z + "px, " + dy / z + "px)";
      var bin = binAt(ev);
      if (bin === icon) { bin = null; }
      if (bin !== over) { if (over) { over.classList.remove("is-drop"); } over = bin; if (over) { over.classList.add("is-drop"); } }
    }
    function up(ev) {
      doc.removeEventListener("pointermove", move);
      doc.removeEventListener("pointerup", up);
      doc.removeEventListener("pointercancel", up);
      if (!moved) { return; }
      /* the mouse-up after a drag would otherwise count as a click on the icon */
      swallowClick = true;
      setTimeout(function () { swallowClick = false; }, 80);
      icon.classList.remove("is-dragging");
      icon.style.transform = "";
      if (over) { over.classList.remove("is-drop"); }
      if (ev.type === "pointerup" && over) {
        icon.hidden = true;
        recycled.push(icon);
        binCount++;
        renderBin();
        var left = $$(".desktop-icons .dicon").filter(function (d) { return !d.hidden && d !== over; }).length;
        if (window.CFWizard) { window.CFWizard.recycled(binCount, left); }
      }
    }
    doc.addEventListener("pointermove", move);
    doc.addEventListener("pointerup", up);
    doc.addEventListener("pointercancel", up);
  });
  on(doc, "click", function (e) {
    if (swallowClick) { swallowClick = false; e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---- 8. folder views and sorting ------------------------------------------ */

  var pane = $(".file-pane");
  var VIEWS = ["large", "list", "details"];

  function currentView() {
    for (var i = 0; i < VIEWS.length; i++) { if (pane && pane.classList.contains("view-" + VIEWS[i])) { return VIEWS[i]; } }
    return "details";
  }
  function setView(v, remember) {
    if (!pane || VIEWS.indexOf(v) === -1) { return; }
    VIEWS.forEach(function (x) { pane.classList.toggle("view-" + x, x === v); });
    /* remembered per kind of folder: one choice for document folders,
       one for folders of programs */
    if (remember) { store("local", "cfw.view." + pane.getAttribute("data-view"), v); }
    syncChecks();
  }
  function syncChecks() {
    var v = currentView();
    $$('[data-check="view"]').forEach(function (b) {
      b.classList.toggle("is-checked", !!pane && b.getAttribute("data-cmd") === "view-" + v);
    });
  }
  if (pane) {
    var saved = store("local", "cfw.view." + pane.getAttribute("data-view"));
    if (saved && saved !== currentView()) { setView(saved, false); }
  }

  /* click a column heading to sort; folders always stay on top */
  on(doc, "click", function (e) {
    var th = e.target.closest("th[data-sort-key]");
    if (!th) { return; }
    var table = th.closest("table"), body = table.tBodies[0];
    var key = th.getAttribute("data-sort-key");
    var dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
    $$("th", table).forEach(function (h) { h.removeAttribute("aria-sort"); });
    th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
    function val(tr) {
      if (key === "name") { return ($(".f-name span", tr) || tr).textContent.trim().toLowerCase(); }
      var td = $(".f-" + key, tr);
      if (!td) { return ""; }
      var raw = td.getAttribute("data-sort");
      if (key === "size") { return Number(raw || 0); }
      return (raw !== null ? raw : td.textContent).trim().toLowerCase();
    }
    function isFolder(tr) { var t = $(".f-type", tr); return t && t.textContent.trim() === "File Folder" ? 0 : 1; }
    var list = $$("tr", body);
    list.sort(function (a, b) {
      var fa = isFolder(a), fb = isFolder(b);
      if (fa !== fb) { return fa - fb; }
      var va = val(a), vb = val(b);
      if (va < vb) { return -dir; }
      if (va > vb) { return dir; }
      return 0;
    });
    list.forEach(function (tr) { body.appendChild(tr); });
  });

  /* ---- 9. commands (anything with data-cmd) ------------------------------------ */

  function flash(text) {
    var s = $("#win-main .status-grow");
    if (!s) { return; }
    var was = s.textContent;
    s.textContent = text;
    setTimeout(function () { s.textContent = was; }, 1800);
  }

  function command(cmd) {
    switch (cmd) {
      case "find": openFind(); break;
      case "find-all": openFind(searchInput ? searchInput.value.trim() : ""); break;
      case "run": openRun(); break;
      case "shutdown": openShutdown(); break;
      case "display": openDisplay(); break;
      case "welcome":      /* Run > "welcome" brings the greeting back */
        try { window.localStorage.removeItem("cfw.welcome"); } catch (e) { /* fine */ }
        window.location.href = "/";
        break;
      case "help": closeMenus(); openApp("help"); break;
      case "about": closeMenus(); openApp("about"); break;
      case "recycle": closeMenus(); openApp("recycle"); renderBin(); break;
      case "print": closeMenus(); window.print(); break;
      case "back": window.history.back(); break;
      case "forward": window.history.forward(); break;
      case "refresh": window.location.reload(); break;
      case "copy-link":
        closeMenus();
        if (navigator.clipboard) { navigator.clipboard.writeText(window.location.href).then(function () { flash("Link copied"); }, function () {}); }
        break;
      case "select-all":
        closeMenus();
        var main = doc.getElementById("main");
        if (main && window.getSelection) { var r = doc.createRange(); r.selectNodeContents(main); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
        break;
      case "view-large": case "view-list": case "view-details":
        closeMenus(); setView(cmd.slice(5), true); break;
      case "view-cycle":
        setView(VIEWS[(VIEWS.indexOf(currentView()) + 1) % VIEWS.length], true); break;
      case "show-desktop":
        closeMenus();
        var anyUp = wins.some(function (w) { return !w.el.classList.contains("is-min"); });
        wins.forEach(function (w) { w.el.classList.toggle("is-min", anyUp); });
        activate(anyUp ? null : topWindow());
        break;
      default: break;
    }
  }

  on(doc, "click", function (e) {
    var t = e.target.closest("[data-cmd]");
    if (!t || t.disabled) { return; }
    e.preventDefault();
    command(t.getAttribute("data-cmd"));
  });
  /* a link inside a menu: let it navigate, and tidy the menu away */
  on(doc, "click", function (e) {
    if (e.target.closest(".menu a.menu-item")) { setTimeout(closeMenus, 0); }
  });

  /* ---- 10. start-up ------------------------------------------------------------- */

  reveal(doc);

  /* Icons open with one click, but plenty of people double-click a
     desktop. The second click of a double-click would land on whatever
     the new page put under the pointer, so a click that comes within
     0.6 s of the click that opened this page is ignored. */
  on(doc, "click", function (e) {
    if (!e.target.closest || !e.target.closest("a[href], [data-cmd]")) { return; }
    var last = Number(store("session", "cfw.click") || 0), now = Date.now();
    if (now - last < 600 && store("session", "cfw.clickpage") !== window.location.pathname) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    store("session", "cfw.click", String(now));
    store("session", "cfw.clickpage", window.location.pathname);
  }, true);

  var main = doc.getElementById("win-main");
  if (main) {
    /* The Welcome window greets a visitor once. display.js hides it on
       later visits before the page is drawn; here it is taken out of the
       page, or shown and remembered as seen. */
    var welcome = main.classList.contains("win-welcome");
    if (welcome && (doc.documentElement.classList.contains("welcome-seen") || store("local", "cfw.welcome") === "seen")) {
      main.remove();
    } else {
      register(main);
      if (welcome) { store("local", "cfw.welcome", "seen"); }
    }
  }

  /* Keyboard scrolling (space, arrows, Page Down) should work straight
     away, so give the page's scrolling area the focus, unless the page
     has something better to focus (a game, a quiz, a #heading target). */
  var content = doc.getElementById("main");
  if (content && !window.location.hash && (!doc.activeElement || doc.activeElement === doc.body) &&
      doc.body.className.indexOf("page-doc") !== -1) {
    try { content.focus({ preventScroll: true }); } catch (e) { /* fine */ }
  }

  /* Coming back to a page with Back should land where you left it. */
  var scroller = $(".doc-view") || $(".file-pane");
  if (scroller) {
    var key = "cfw.scroll." + window.location.pathname;
    on(window, "pagehide", function () { store("session", key, String(scroller.scrollTop)); });
    var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    if (nav && nav.type === "back_forward") {
      var y = Number(store("session", key) || 0);
      if (y > 0) { scroller.scrollTop = y; }
    }
  }

  /* a long address shows its end (where you are), not its start */
  var addr = $(".address-path");
  if (addr) { addr.scrollLeft = addr.scrollWidth; }

  /* for the page scripts (games) that want to open a window or a message */
  window.CFDesktop = { open: openApp, message: message, command: command, register: register, closeMenus: closeMenus };
})();
