/* Dark-mode toggle. The site is light by default; the toggle stores
   the visitor's choice in localStorage and it sticks. Loaded without
   `defer`, before the stylesheet, so a returning dark-mode visitor
   never sees a flash of light theme. */
(function () {
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') root.dataset.theme = stored;

  function effective() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function setLabel(btn) {
    btn.setAttribute('aria-pressed', effective() === 'dark' ? 'true' : 'false');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.hidden = false;           /* ships hidden; useless without JS */
    setLabel(btn);
    btn.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      setLabel(btn);
    });
  });
})();
