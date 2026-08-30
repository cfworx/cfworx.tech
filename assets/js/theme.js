/* Dark-mode toggle. The stored choice ("light" / "dark") overrides the
   OS preference; with nothing stored, the CSS prefers-color-scheme
   rules decide. Loaded without `defer`, before the stylesheet, so the
   attribute is set before first paint (no flash of the wrong theme). */
(function () {
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') root.dataset.theme = stored;

  function effective() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
