/* Shared engine for the practice tools under /tools/. Plain JavaScript,
   no libraries, nothing fetched. Each tool ships its own small script
   that defines the question data plus four functions, then calls:

     CFQuiz({
       data:     [...],                 // one row per question
       question: function (row) {...},  // -> parts (see below)
       hint:     function (row) {...},  // -> placeholder string
       check:    function (row, s) {...}, // trimmed input -> true/false
       answer:   function (row) {...}   // -> parts, the canonical answer
     });

   "Parts" are [{c: 1, s: "10.0.0.0/8"}, {c: 0, s: " and "}] — c:1 renders
   as a <code> chip (addresses, masks, commands), c:0 as plain text. The
   engine owns everything else: the shuffle on every load, submit / show
   answer / next question, scoring, and the wrap-around reshuffle. */
(function () {
  "use strict";

  window.CFQuiz = function (cfg) {
    var quiz = document.getElementById("quiz");
    if (!quiz) { return; }
    quiz.hidden = false;

    var DATA = cfg.data;
    var progress = document.getElementById("quiz-progress");
    var questionEl = document.getElementById("quiz-question");
    var form = document.getElementById("quiz-form");
    var input = document.getElementById("quiz-input");
    var showBtn = document.getElementById("quiz-show");
    var nextBtn = document.getElementById("quiz-next");
    var feedback = document.getElementById("quiz-feedback");

    var order = [], pos = 0, nCorrect = 0, nDone = 0;
    var resolved = false; /* answered correctly or revealed; Enter now advances */

    function shuffle() {
      order = [];
      for (var i = 0; i < DATA.length; i++) { order.push(i); }
      for (var j = order.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = order[j]; order[j] = order[k]; order[k] = tmp;
      }
    }

    /* Long chips (full IPv6 addresses, dotted-binary quads) get a class
       that lets them wrap on narrow screens instead of overflowing. */
    function put(el, parts) {
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].c) {
          var chip = document.createElement("code");
          chip.textContent = parts[i].s;
          if (parts[i].s.length > 24) { chip.className = "q-long"; }
          el.appendChild(chip);
        } else {
          el.appendChild(document.createTextNode(parts[i].s));
        }
      }
    }

    function say(cls, text, row) {
      feedback.className = "quiz-feedback" + (cls ? " " + cls : "");
      feedback.textContent = text;
      if (row) { put(feedback, cfg.answer(row)); }
    }

    function updateProgress() {
      progress.textContent = "Question " + (pos + 1) + " of " + DATA.length +
        (nDone > 0 ? " · score " + nCorrect + "/" + nDone : "");
    }

    function showQuestion(focus) {
      var row = DATA[order[pos]];
      resolved = false;
      questionEl.textContent = "";
      put(questionEl, cfg.question(row));
      input.value = "";
      input.placeholder = cfg.hint(row);
      showBtn.disabled = false;
      say("", "");
      updateProgress();
      if (focus) { input.focus(); }
    }

    function next() {
      var fresh = false;
      pos++;
      if (pos >= order.length) {
        shuffle();
        pos = 0;
        nCorrect = 0;
        nDone = 0;
        fresh = true;
      }
      showQuestion(true);
      if (fresh) {
        say("", "End of the deck — reshuffled for a fresh round.");
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (resolved) { next(); return; } /* Enter again = next question */
      var row = DATA[order[pos]];
      if (input.value.trim() === "") {
        say("", "Type an answer first.");
        return;
      }
      if (cfg.check(row, input.value.trim())) {
        resolved = true;
        nCorrect++;
        nDone++;
        showBtn.disabled = true;
        say("ok", "✓ Correct: ", row);
        updateProgress();
      } else {
        say("no", "✗ Not quite — try again, or show the answer.");
      }
    });

    showBtn.addEventListener("click", function () {
      var row = DATA[order[pos]];
      if (!resolved) { resolved = true; nDone++; }
      showBtn.disabled = true;
      say("", "Answer: ", row);
      updateProgress();
      input.focus();
    });

    nextBtn.addEventListener("click", next);

    shuffle();
    showQuestion(false);
  };
})();
