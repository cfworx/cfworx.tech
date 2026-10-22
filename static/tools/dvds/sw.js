/* Service worker for the DVD Tracker. Its scope is /tools/dvds/ only;
   the rest of cfworx.tech never goes through it.

   - The page: the saved copy is served first, so it opens instantly
     and works with no signal in a store. The live page is fetched in
     the background; when it differs, it's saved and handed to the open
     tab, which swaps in the new list without a reload.
   - Fingerprinted CSS/JS and the versioned font never change, so
     they're served from the cache whenever they're there.
   - Icons and the manifest: saved copy first, refreshed behind it.

   Bump VERSION when this file's logic changes; old caches are dropped
   when the new worker takes over. */
'use strict';

const VERSION = 'dvds-v1';
const PAGE = '/tools/dvds/';
const ASSET_RE = /(?:href|src)="(\/(?:css|js|fonts)\/[^"]+|\/tools\/dvds\/[^"]+)"/g;

self.addEventListener('install', (event) => {
  event.waitUntil(refreshPage().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('dvds-') && k !== VERSION)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    if (url.pathname === PAGE || url.pathname === PAGE + 'index.html') {
      event.respondWith(servePage(event));
    }
    return;
  }
  if (/^\/(css|js|fonts)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (url.pathname.startsWith(PAGE) && url.pathname !== PAGE + 'sw.js') {
    event.respondWith(savedThenRefresh(event, req));
  }
});

async function servePage(event) {
  const cache = await caches.open(VERSION);
  const saved = await cache.match(PAGE);
  const fresh = refreshPage();
  if (saved) {
    event.waitUntil(fresh.catch(() => {}));
    return saved;
  }
  try {
    return await fresh;
  } catch (err) {
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
      '<title>Offline</title><p>You\'re offline, and this ' +
      'device has no saved copy of the DVD Tracker yet. Open it once with a connection and it ' +
      'will work offline after that.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

/* Fetch the live page, cache everything it needs, then the page itself
   (in that order, so a saved page never points at files that aren't
   saved). Tells open tabs when the page changed. */
async function refreshPage() {
  const cache = await caches.open(VERSION);
  const before = await cache.match(PAGE);
  const oldHtml = before ? await before.text() : null;

  const res = await fetch(PAGE, { cache: 'no-cache', credentials: 'same-origin' });
  if (!res.ok) throw new Error('page ' + res.status);
  const html = await res.clone().text();

  const urls = new Set();
  for (const m of html.matchAll(ASSET_RE)) urls.add(new URL(m[1], self.location.origin).href);
  await Promise.all([...urls].map(async (u) => {
    if (await cache.match(u)) return;
    try {
      const r = await fetch(u, { credentials: 'same-origin' });
      if (r.ok) await cache.put(u, r);
    } catch (err) { /* offline mid-refresh: try again next time */ }
  }));
  await cache.put(PAGE, res.clone());

  /* Drop old fingerprinted files the page no longer uses. */
  for (const key of await cache.keys()) {
    const p = new URL(key.url).pathname;
    if (/^\/(css|js|fonts)\//.test(p) && !urls.has(key.url)) await cache.delete(key);
  }

  if (oldHtml !== null && oldHtml !== html) {
    const tabs = await self.clients.matchAll({ type: 'window' });
    for (const tab of tabs) tab.postMessage({ type: 'dvd-page-updated', html });
  }
  return res;
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function savedThenRefresh(event, req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then(async (res) => {
    if (res.ok) await cache.put(req, res.clone());
    return res;
  });
  if (hit) {
    event.waitUntil(net.catch(() => {}));
    return hit;
  }
  return net;
}
