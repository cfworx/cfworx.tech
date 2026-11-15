/* DVD Tracker ratings API (Cloudflare Pages Function) for /tools/dvds/.

   GET  /api/dvd-ratings   Every rating: { ratings: { "<title key>": { cory: 4, shana: 5 } } }
   POST /api/dvd-ratings   { who: "cory" | "shana", password, key, stars }
                           stars is 1 to 5, or 0 to clear that person's
                           rating. Each person has their own password;
                           only its salted SHA-256 is kept here.

   Binding: PLANEDEX_DB, the D1 database the site already has (shared
   with /api/planedex). Tables, made on first use:
     dvd_ratings       (key, who, stars, updated_at)
     dvd_rating_fails  (ip_hash, at): wrong passwords, to slow guessing

   The passwords are a light lock for a family movie list, not real
   security: enough that a passer-by can't change the stars. */

const PEOPLE = {
  cory: 'c516179369c5fa1057dc38be63f22561250a30174f619283bccb5dd9b29c7764',
  shana: 'cf05eb4718d22fd4100be61606506ac931ed3f5b9b48dcd347a39a654ef88160',
};
const SALT = 'cfworx-dvd-ratings';
const MAX_BYTES = 2000;
const MAX_FAILS = 8;            // wrong passwords allowed per address...
const FAIL_WINDOW = 10 * 60;    // ...in this many seconds

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function reply(status, body) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function tables(db) {
  await db.prepare('CREATE TABLE IF NOT EXISTS dvd_ratings (key TEXT NOT NULL, who TEXT NOT NULL, '
    + 'stars INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (key, who))').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS dvd_rating_fails (ip_hash TEXT NOT NULL, at INTEGER NOT NULL)').run();
}

async function list(db) {
  const { results } = await db.prepare('SELECT key, who, stars FROM dvd_ratings').all();
  const ratings = {};
  for (const r of results || []) {
    (ratings[r.key] = ratings[r.key] || {})[r.who] = r.stars;
  }
  return ratings;
}

async function save(request, db) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return reply(413, { error: 'Too big.' });
  let body;
  try { body = JSON.parse(raw); } catch (e) { return reply(400, { error: 'Not JSON.' }); }

  const who = String(body.who || '').toLowerCase();
  const key = String(body.key || '');
  const stars = Number(body.stars);
  if (!Object.prototype.hasOwnProperty.call(PEOPLE, who)) return reply(400, { error: 'Unknown person.' });
  if (!key || key.length > 200) return reply(400, { error: 'Unknown title.' });
  if (!Number.isInteger(stars) || stars < 0 || stars > 5) return reply(400, { error: 'Stars go from 1 to 5.' });

  const now = Math.floor(Date.now() / 1000);
  const ip = await sha256(SALT + ':ip:' + (request.headers.get('cf-connecting-ip') || 'unknown'));
  await db.prepare('DELETE FROM dvd_rating_fails WHERE at < ?').bind(now - FAIL_WINDOW).run();
  const fails = await db.prepare('SELECT COUNT(*) AS n FROM dvd_rating_fails WHERE ip_hash = ?').bind(ip).first();
  if (fails && fails.n >= MAX_FAILS) return reply(429, { error: 'Too many wrong passwords. Try again in a few minutes.' });

  const given = await sha256(SALT + ':' + who + ':' + String(body.password || ''));
  if (!same(given, PEOPLE[who])) {
    await db.prepare('INSERT INTO dvd_rating_fails (ip_hash, at) VALUES (?, ?)').bind(ip, now).run();
    return reply(403, { error: 'Wrong password.' });
  }

  if (stars === 0) {
    await db.prepare('DELETE FROM dvd_ratings WHERE key = ? AND who = ?').bind(key, who).run();
  } else {
    await db.prepare('INSERT INTO dvd_ratings (key, who, stars, updated_at) VALUES (?, ?, ?, ?) '
      + 'ON CONFLICT (key, who) DO UPDATE SET stars = excluded.stars, updated_at = excluded.updated_at')
      .bind(key, who, stars, new Date().toISOString()).run();
  }
  return reply(200, { ok: true, ratings: await list(db) });
}

export async function onRequest({ request, env }) {
  const db = env.PLANEDEX_DB;
  if (!db) return reply(503, { error: 'Ratings storage is not set up.' });
  try {
    await tables(db);
    if (request.method === 'GET') return reply(200, { ratings: await list(db) });
    if (request.method === 'POST') {
      const origin = request.headers.get('origin');
      if (origin && origin !== new URL(request.url).origin) return reply(403, { error: 'Wrong site.' });
      return await save(request, db);
    }
    return reply(405, { error: 'GET or POST only.' });
  } catch (e) {
    return reply(500, { error: 'Something went wrong saving that.' });
  }
}
