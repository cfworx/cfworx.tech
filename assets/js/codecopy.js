/* Copy buttons on the console-window code blocks. The buttons ship
   hidden in the HTML and are revealed here, so a no-JS visitor never
   sees a dead control. */
document.addEventListener('DOMContentLoaded', function () {
  if (!navigator.clipboard) return;
  document.querySelectorAll('figure.term').forEach(function (fig) {
    var btn = fig.querySelector('.term-copy');
    var code = fig.querySelector('pre > code') || fig.querySelector('pre');
    if (!btn || !code) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(code.innerText.replace(/\n$/, ''))
        .then(function () { flash('copied!'); },
              function () { flash('nope :('); });
    });
    function flash(msg) {
      btn.textContent = msg;
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = 'copy';
        btn.disabled = false;
      }, 1400);
    }
  });
});
