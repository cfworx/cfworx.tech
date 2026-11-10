// Makes static/og-card.png, the 1200x630 picture that shows when a link
// to the site is shared: a screenshot of the real desktop with the
// Welcome window open (plain teal behind it, no wallpaper).
//
// Needs Node and Playwright (npm i playwright, where Node can find it),
// and the site being served locally:
//   hugo --gc && node scripts/win98/preview.mjs &
//   node scripts/win98/make_og.mjs [base-url] [out.png]
// Defaults: http://localhost:8098 and static/og-card.png.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const base = process.argv[2] || 'http://localhost:8098';
const out = process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'static', 'og-card.png');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
// straight to a first-visit desktop at 175%, skipping the start-up screen; the wizard keeps to himself
await ctx.addInitScript(() => { try { localStorage.setItem('cfw.booted', '1'); localStorage.setItem('cfw.zoom', '175'); localStorage.setItem('cfw.wizard.off', '1'); } catch (e) { /* fine */ } });
const page = await ctx.newPage();
await page.clock.install({ time: new Date('1998-06-25T09:41:00') });      // the clock in the tray
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  document.getElementById('desktop').style.backgroundImage = 'none';
  const recent = document.querySelector('.win-welcome .group-box');        // dated, and it goes stale
  if (recent) { recent.remove(); }
});
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
