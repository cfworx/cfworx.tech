/* The CFWorx Wizard: the site's own desktop assistant. Every few minutes
   he appears above the taskbar with a speech balloon and some unhelpful
   advice, then wanders off. He also has opinions about people who drag
   his icons into the Recycle Bin.

   - To change what he says, edit the lists below. Keep lines short.
   - "Go away" turns the random tips off for that visitor (remembered in
     localStorage); Start > Settings > Wizard tips turns them back on.
   - He stays out of the way while a game is being played.

   Plain JavaScript, nothing fetched. desktop.js calls window.CFWizard. */
(function () {
  "use strict";

  if (!document.getElementById("desktop")) { return; }

  /* ---- what he says ---------------------------------------------------- */

  var ANY = [
    "It looks like you're trying to be productive. Would you like me to ruin that?",
    "It was DNS. I haven't looked. It's just always DNS.",
    "Have you tried turning it off and leaving it off?",
    "I ran a full diagnostic. The problem is located between the chair and the keyboard.",
    "I deleted System32 to free up some space. You're welcome.",
    "Backups you've never tested aren't backups. They're rumors.",
    "The cloud is just someone else's computer, and they aren't patching it either.",
    "I'd tell you a UDP joke, but I honestly don't care if you get it.",
    "Somewhere out there, production is running on a PC under somebody's desk. Sleep tight.",
    "Your password is weak, and frankly so is your coffee.",
    "640K ought to be enough for anybody. That's not a quote. That's a threat.",
    "It works on my machine. That's the whole tip.",
    "The printer is offline. I didn't check. It simply always is.",
    "Ctrl+Z won't undo your life choices, but it's adorable that you tried.",
    "This site has no cookies. Not for your privacy. I ate them.",
    "I'm a wizard, not a miracle worker. Read the damn notes.",
    "Y2K was an inside job.",
    "You've been staring at this screen a while. Blink twice if the ticket queue has you hostage.",
    "Reminder: 'temporary fix' is Latin for 'permanent'.",
    "There are two kinds of people: those who back up, and those who are about to.",
    "I noticed you're still here. The X is in the corner. I believe in you.",
    "Hot take: the OSI model has seven layers and all of them are your fault.",
    "It's not a bug, it's an undocumented career opportunity.",
    "I asked the firewall how it was feeling. It refused to open up.",
    "Friendly reminder that 'it's probably fine' has taken down more networks than hackers.",
    "Somebody set the VLAN to 1 and walked away. I'm not naming names. It was you.",
    "If you need me, I'll be in the Recycle Bin. It's quieter there.",
    "Pro tip: you can't have unread email if you never open the inbox.",
    "I've seen things. Token Ring. Coax. A server room cooled by a box fan."
  ];
  var BY_PLACE = {
    notes: [
      "It looks like you're studying. Statistically, the exam is about the one page you skipped.",
      "Reading the notes again? Bold strategy. Have you considered remembering them?",
      "Spanning Tree isn't confusing. You're confusing. Spanning Tree is just mean.",
      "Fun fact: highlighting everything is the same as highlighting nothing."
    ],
    homelab: [
      "A homelab is just a second job you pay the electric company for.",
      "I see you're reading a lab write-up. The part where it breaks at 2 a.m. was edited out.",
      "It's called a homelab because 'expensive cry for help' didn't fit on the rack."
    ],
    tools: [
      "It looks like you're trying to subnet. Would you like to cry together?",
      "Borrowing bits again? You never give them back.",
      "/30 gives you two hosts. Like your social life."
    ],
    games: [
      "Games? At this hour? On a work day? I respect it.",
      "Minesweeper is just incident response with better odds."
    ],
    home: [
      "Welcome to my desktop. Don't touch anything. Especially that.",
      "Go ahead, click something. I've already told the boss you're on break."
    ]
  };
  /* dragging icons into the Recycle Bin: the first line is non-negotiable */
  var RECYCLE = [
    "What the hell are you doing to my website!?!?!",
    "STOP. DELETING. MY. ICONS.",
    "That one had a family.",
    "I'm calling the sysadmin. ...Oh no. That's me.",
    "Keep going and I'm recycling YOU.",
    "Fine. Burn it all down. See if I care. (I care a lot.)"
  ];
  var RECYCLE_ALL = "Congratulations. You deleted the internet. Hit refresh and we'll never speak of this.";
  var BYE = "Fine. I know when I'm not wanted. Start > Settings if you come crawling back.";
  var HELLO = "Miss me? Of course you did.";

  /* ---- plumbing ------------------------------------------------------------ */

  function get(kind, key) { try { return (kind === "s" ? sessionStorage : localStorage).getItem(key); } catch (e) { return null; } }
  function set(kind, key, value) { try { (kind === "s" ? sessionStorage : localStorage).setItem(key, value); } catch (e) { /* fine */ } }
  function enabled() { return get("l", "cfw.wizard.off") !== "1"; }

  var box = null, text = null, hideTimer = null, hovering = false;

  function build() {
    if (box) { return; }
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box = document.createElement("div");
    box.className = "wizard-tip";
    box.hidden = true;
    box.innerHTML =
      '<div class="wizard-balloon" role="status" aria-live="polite"><p class="wizard-text"></p>' +
      '<div class="wizard-actions"><button type="button" class="btn" data-wizard="ok">OK</button>' +
      '<button type="button" class="btn" data-wizard="off">Go away</button></div></div>' +
      '<button type="button" class="wizard-guy" data-wizard="more" title="The CFWorx Wizard">' +
      '<img src="/images/' + (still ? "wizard-still.png" : "wizard.gif") + '" alt="The CFWorx Wizard" width="80" height="72"></button>';
    document.body.appendChild(box);
    text = box.querySelector(".wizard-text");
    box.addEventListener("mouseenter", function () { hovering = true; });
    box.addEventListener("mouseleave", function () { hovering = false; armHide(6000); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-wizard]");
      if (!b) { return; }
      var what = b.getAttribute("data-wizard");
      if (what === "ok") { hide(); }
      else if (what === "more") { say(pick()); }
      else if (what === "off") { set("l", "cfw.wizard.off", "1"); label(); say(BYE, 5000); }
    });
  }

  function armHide(ms) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { if (hovering) { armHide(3000); } else { hide(); } }, ms);
  }
  function hide() { if (box) { box.hidden = true; } clearTimeout(hideTimer); }

  function say(line, ms) {
    build();
    text.textContent = line;
    box.hidden = false;
    armHide(ms || 14000);
    /* next unprompted visit: two to four and a half minutes from now */
    set("s", "cfw.wizard.next", String(Date.now() + 120000 + Math.random() * 150000));
  }

  /* a line he hasn't used lately, with a taste for ones about this page */
  function pick() {
    var path = window.location.pathname, place = path === "/" ? "home" : path.split("/")[1];
    var local = BY_PLACE[place] || [];
    var pool = local.length && Math.random() < 0.45 ? local : ANY;
    var seen = (get("s", "cfw.wizard.seen") || "").split("|");
    var fresh = pool.filter(function (l) { return seen.indexOf(l.slice(0, 24)) === -1; });
    if (!fresh.length) { fresh = pool; seen = []; }
    var line = fresh[Math.floor(Math.random() * fresh.length)];
    seen.push(line.slice(0, 24));
    set("s", "cfw.wizard.seen", seen.slice(-25).join("|"));
    return line;
  }

  function label() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-wizard-label]"), function (el) {
      el.textContent = "Wizard tips: " + (enabled() ? "on" : "off");
    });
  }

  /* ---- his schedule ------------------------------------------------------------ */

  if (!get("s", "cfw.wizard.next")) { set("s", "cfw.wizard.next", String(Date.now() + 20000 + Math.random() * 20000)); }
  var arrived = Date.now();
  setInterval(function () {
    if (!enabled() || document.hidden || (box && !box.hidden)) { return; }
    if (document.body.classList.contains("page-game")) { return; }            /* not during a game */
    var shut = document.getElementById("shutdown-screen");
    if (shut && !shut.hidden) { return; }
    if (Date.now() - arrived < 8000) { return; }                                /* let a page settle first */
    if (Date.now() >= Number(get("s", "cfw.wizard.next") || 0)) { say(pick()); }
  }, 4000);

  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest('[data-cmd="wizard-toggle"]')) { return; }
    if (enabled()) { set("l", "cfw.wizard.off", "1"); hide(); }
    else { try { localStorage.removeItem("cfw.wizard.off"); } catch (err) { /* fine */ } say(HELLO); }
    label();
  });
  label();

  window.CFWizard = {
    say: say,
    enabled: enabled,
    /* called by desktop.js when an icon lands in the Recycle Bin */
    recycled: function (count, left) { say(left === 0 ? RECYCLE_ALL : RECYCLE[Math.min(count, RECYCLE.length) - 1], 9000); }
  };
})();
