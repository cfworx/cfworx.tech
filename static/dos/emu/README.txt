DOS emulator for the shareware games (/games/)
==============================================

These three files are the "emulators" package from the js-dos project,
version 8.5.2: DOSBox compiled to WebAssembly.

  emulators.js    the loader and API
  wdosbox.js      DOSBox's JavaScript half (runs in a web worker)
  wdosbox.wasm    DOSBox itself

Source:   https://github.com/js-dos/emulators   (npm: emulators@8.5.2)
License:  GNU GPL version 2, see LICENSE.txt

One change was made, in emulators.js. The original loader fetches
wdosbox.js as text and runs it with eval(). This site's Content Security
Policy does not allow eval(), so that call was replaced with a no-op
("return eval.call(window,p)," became "return void 0,") and
assets/js/dosplayer.js loads wdosbox.js with an ordinary <script> tag
before starting the emulator. Nothing else differs from the package.

To update: copy the three files from a newer emulators package's dist/
folder, make the same one-line change, and test a game with
scripts/win98/preview.mjs (it applies the real security headers).
