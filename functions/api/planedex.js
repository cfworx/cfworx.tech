/* Planedex data API (Cloudflare Pages Function) for /tools/planedex/.

   GET  /api/planedex   The latest game data, as last pushed by the PC
                        that keeps the ADS-B logs (scripts/planedex/),
                        plus the latest morning report as "report".
   GET  /api/planedex?logbook
                        Every morning report so far, newest first.
   GET  /api/planedex?voice=YYYY-MM-DD
                        That day's report read aloud by "the captain" (MP3).
   POST /api/planedex?voice=YYYY-MM-DD
                        Store that readout. The morning-report scheduled
                        task makes it with ElevenLabs (through Claude's
                        ElevenLabs connection), puts the SHA-256 of a
                        one-time token in voice_tokens, then sends the MP3
                        with "Authorization: Bearer <token>". Tokens last 15
                        minutes and work once. If the secret
                        ELEVENLABS_API_KEY is ever set, the site can also
                        make a missing readout itself the first time it's
                        played (PLANEDEX_VOICE_ID / PLANEDEX_VOICE_MODEL
                        swap the voice or model).
   GET  /api/planedex?sky
                        Spokane's weather and air quality right now, for the
                        page's live sky (Open-Meteo, cached for 10 minutes).
                        It's for the city, never the station's spot.
   POST /api/planedex   Replace the game data. Needs "Authorization:
                        Bearer <key>". Only the key's SHA-256 is stored
                        (ingest_keys table), never the key itself.

   Binding: PLANEDEX_DB = the D1 database "planedex"
   (Pages project > Settings > Bindings > D1 database).
   Tables: snapshot (a single row: id 1, json, updated_at), ingest_keys
   (name, sha256, created_at), journal (day, text, created_at): one
   morning report per day, written by a scheduled task straight into D1,
   voice (day, hash, mp3, created_at): the readouts, and voice_tokens
   (day, token_sha, expires_at) for sending them.

   Privacy backstop: the push script already strips anything that could
   place the antenna, and this refuses any payload that still carries
   distance or position fields. */

const MAX_BYTES = 1_000_000;
const FORBIDDEN = /"(min_dist(_nm)?|dist(ance)?|lat(itude)?|lon(gitude)?|position|owner|hex|min_alt(_ft)?|squawks)"\s*:/i;
const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
};

// The captain: "David - Airline Captain" from the ElevenLabs voice library,
// falling back to "Bill", a built-in voice every account has.
const VOICE_ID = 'EaCGZNIZYoLgxVzmLOPI';
const VOICE_BACKUP = 'pqHfZKP75CvOlQylNhV4';
const VOICE_MODEL = 'eleven_v4';
const VOICE_INTRO = 'Good morning, crew. This is your captain speaking, with the Planedex morning report.';
const VOICE_OUTRO = "That's all from the flight deck. Keep your eyes on the sky.";
const VOICE_DAYS = 60;       // with a site key: older reports play only if they were voiced back then
const VOICE_PER_HOUR = 8;    // with a site key: new readouts per hour, so nobody can burn the credits
const VOICE_MAX_BYTES = 1_900_000;  // D1 keeps rows under 2 MB

function reply(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, 'cache-control': 'no-store', ...extra },
  });
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// The newest morning report, or null (including before the journal table exists).
async function latestReport(env) {
  try {
    const r = await env.PLANEDEX_DB
      .prepare('SELECT day, text, created_at FROM journal ORDER BY day DESC LIMIT 1')
      .first();
    return r ? { day: r.day, text: r.text, at: r.created_at } : null;
  } catch {
    return null;
  }
}

// Days that have a readout stored (empty before the voice table exists).
async function voicedDays(env) {
  try {
    const r = await env.PLANEDEX_DB.prepare('SELECT day FROM voice').all();
    return new Set((r.results || []).map((x) => x.day));
  } catch {
    return new Set();
  }
}

async function logbook(env) {
  let rows = [];
  try {
    const r = await env.PLANEDEX_DB
      .prepare('SELECT day, text, created_at AS at FROM journal ORDER BY day DESC LIMIT 1000')
      .all();
    rows = r.results || [];
  } catch {
    rows = [];
  }
  const voiced = await voicedDays(env);
  const anyDay = Boolean(env.ELEVENLABS_API_KEY);
  rows = rows.map((r) => ({ ...r, voice: anyDay || voiced.has(r.day) }));
  return new Response(JSON.stringify({ reports: rows }), {
    headers: { ...BASE_HEADERS, 'cache-control': 'public, max-age=300' },
  });
}

async function read(env, head) {
  const row = await env.PLANEDEX_DB
    .prepare('SELECT json, updated_at FROM snapshot WHERE id = 1')
    .first();
  if (!row) return reply(404, { error: "No data yet: the receiver hasn't sent its first update." });
  let body = row.json;
  const report = head ? null : await latestReport(env);
  // Splice it in rather than re-parsing the whole snapshot.
  if (report && body.trimEnd().endsWith('}')) {
    report.voice = Boolean(env.ELEVENLABS_API_KEY) || (await voicedDays(env)).has(report.day);
    body = body.trimEnd().slice(0, -1) + ',"report":' + JSON.stringify(report) + '}';
  }
  return new Response(head ? null : body, {
    headers: {
      ...BASE_HEADERS,
      'cache-control': 'public, max-age=60',
      'last-modified': new Date(row.updated_at).toUTCString(),
    },
  });
}

// ---- the captain's readout

function mp3Response(bytes) {
  return new Response(bytes, {
    headers: {
      'content-type': 'audio/mpeg',
      'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
    },
  });
}

// D1 hands BLOBs back as an ArrayBuffer, a typed array or a plain array of bytes.
function asBytes(v) {
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  return Array.isArray(v) ? Uint8Array.from(v) : null;
}

async function speak(env, voiceId, model, text) {
  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voiceId)
    + '?output_format=mp3_44100_64', {
    method: 'POST',
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model }),
  });
  if (!r.ok) return { status: r.status };
  const bytes = new Uint8Array(await r.arrayBuffer());
  return bytes.length > 2000 ? { bytes } : { status: 502 };
}

async function voice(request, env, waitUntil, day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return reply(400, { error: 'Bad day.' });
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString());
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const rep = await env.PLANEDEX_DB.prepare('SELECT text FROM journal WHERE day = ?1').bind(day).first();
  if (!rep) return reply(404, { error: 'No report for that day.' });
  const voiceId = env.PLANEDEX_VOICE_ID || VOICE_ID;
  const model = env.PLANEDEX_VOICE_MODEL || VOICE_MODEL;
  const script = VOICE_INTRO + '\n\n' + rep.text + '\n\n' + VOICE_OUTRO;
  const hash = await sha256hex(voiceId + '|' + model + '|' + script);

  let row = null;
  try {
    row = await env.PLANEDEX_DB.prepare('SELECT mp3, hash FROM voice WHERE day = ?1').bind(day).first();
  } catch {
    row = null;  // no voice table yet
  }
  const saved = row && asBytes(row.mp3);
  // A stored readout plays unless the site can remake it and the report has changed since.
  if (saved && saved.length && (row.hash === hash || String(row.hash).startsWith('upload:') || !env.ELEVENLABS_API_KEY)) {
    const res = mp3Response(saved);
    waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  }

  if (!env.ELEVENLABS_API_KEY) return reply(404, { error: 'No readout for that day yet.' });
  const age = (Date.now() - Date.parse(day + 'T12:00:00Z')) / 86400000;
  if (age > VOICE_DAYS) return reply(410, { error: 'That report is too old to read aloud now.' });
  await env.PLANEDEX_DB.prepare('CREATE TABLE IF NOT EXISTS voice (day TEXT PRIMARY KEY, hash TEXT NOT NULL, '
    + 'mp3 BLOB NOT NULL, created_at TEXT NOT NULL)').run();
  const recent = await env.PLANEDEX_DB
    .prepare('SELECT COUNT(*) AS n FROM voice WHERE created_at > ?1')
    .bind(new Date(Date.now() - 3600000).toISOString())
    .first();
  if (recent && recent.n >= VOICE_PER_HOUR) return reply(429, { error: 'The captain needs a break. Try again in a bit.' });

  // The chosen voice and model first; if they're unavailable on this account, safer picks.
  const tries = [[voiceId, model], [voiceId, 'eleven_multilingual_v2'], [VOICE_BACKUP, 'eleven_multilingual_v2']];
  let out = null;
  for (const [v, m] of tries) {
    out = await speak(env, v, m, script);
    if (out.bytes || out.status === 401 || out.status === 429) break;
  }
  if (!out || !out.bytes) {
    const why = out && out.status === 401 ? 'The ElevenLabs key was turned down.'
      : out && out.status === 429 ? 'ElevenLabs says we are out of credits or busy.' : 'The captain could not be reached.';
    return reply(502, { error: why });
  }
  if (out.bytes.length < 1900000) {
    await env.PLANEDEX_DB
      .prepare('INSERT INTO voice (day, hash, mp3, created_at) VALUES (?1, ?2, ?3, ?4) '
        + 'ON CONFLICT(day) DO UPDATE SET hash = excluded.hash, mp3 = excluded.mp3, created_at = excluded.created_at')
      .bind(day, hash, out.bytes.buffer, new Date().toISOString())
      .run();
  }
  const res = mp3Response(out.bytes);
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function voiceUpload(request, env, day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return reply(400, { error: 'Bad day.' });
  const m = (request.headers.get('authorization') || '').match(/^Bearer\s+([A-Za-z0-9_-]{20,200})$/);
  if (!m) return reply(401, { error: 'Missing upload token.' });
  let tok = null;
  try {
    tok = await env.PLANEDEX_DB.prepare('SELECT token_sha, expires_at FROM voice_tokens WHERE day = ?1').bind(day).first();
  } catch {
    tok = null;
  }
  if (!tok || tok.token_sha !== await sha256hex(m[1]) || !(Date.parse(tok.expires_at) > Date.now())) {
    return reply(403, { error: 'Unknown or expired upload token.' });
  }
  const rep = await env.PLANEDEX_DB.prepare('SELECT text FROM journal WHERE day = ?1').bind(day).first();
  if (!rep) return reply(404, { error: 'No report for that day.' });
  if (Number(request.headers.get('content-length') || 0) > VOICE_MAX_BYTES) return reply(413, { error: 'Too big.' });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > VOICE_MAX_BYTES) return reply(413, { error: 'Too big.' });
  const mp3 = bytes.length > 2000 && ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)  // "ID3"
    || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));                                          // MPEG frame
  if (!mp3) return reply(415, { error: 'That is not an MP3.' });

  await env.PLANEDEX_DB.prepare('CREATE TABLE IF NOT EXISTS voice (day TEXT PRIMARY KEY, hash TEXT NOT NULL, '
    + 'mp3 BLOB NOT NULL, created_at TEXT NOT NULL)').run();
  const at = new Date().toISOString();
  await env.PLANEDEX_DB.batch([
    env.PLANEDEX_DB
      .prepare('INSERT INTO voice (day, hash, mp3, created_at) VALUES (?1, ?2, ?3, ?4) '
        + 'ON CONFLICT(day) DO UPDATE SET hash = excluded.hash, mp3 = excluded.mp3, created_at = excluded.created_at')
      .bind(day, 'upload:' + await sha256hex(rep.text), bytes.buffer, at),
    env.PLANEDEX_DB.prepare('DELETE FROM voice_tokens WHERE day = ?1').bind(day),
  ]);
  return reply(200, { ok: true, day, bytes: bytes.length, at });
}

// ---- Spokane's weather for the page's sky (Open-Meteo: free, no key, credited on the page)

const SKY_WHERE = 'latitude=47.66&longitude=-117.43&timezone=America%2FLos_Angeles';  // the city of Spokane
const SKY_TTL = 600;  // seconds

async function getJSON(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function sky(request, waitUntil) {
  const cache = caches.default;
  const key = new Request(new URL('/api/planedex?sky', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  const [w, a] = await Promise.all([
    getJSON('https://api.open-meteo.com/v1/forecast?' + SKY_WHERE
      + '&current=temperature_2m,apparent_temperature,weather_code,cloud_cover,is_day,precipitation,snowfall,wind_speed_10m,wind_direction_10m'
      + '&daily=sunrise,sunset&forecast_days=1&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch'),
    getJSON('https://air-quality-api.open-meteo.com/v1/air-quality?' + SKY_WHERE + '&current=us_aqi,pm2_5'),
  ]);
  const c = w && w.current;
  if (!c) return reply(503, { error: 'No weather right now.' });
  const out = {
    at: c.time || null,
    temp: numOrNull(c.temperature_2m),
    feels: numOrNull(c.apparent_temperature),
    code: numOrNull(c.weather_code),
    cloud: numOrNull(c.cloud_cover),
    isDay: c.is_day === 1,
    precip: numOrNull(c.precipitation),
    snow: numOrNull(c.snowfall),
    wind: numOrNull(c.wind_speed_10m),
    windDir: numOrNull(c.wind_direction_10m),
    sunrise: (w.daily && w.daily.sunrise && w.daily.sunrise[0]) || null,
    sunset: (w.daily && w.daily.sunset && w.daily.sunset[0]) || null,
    aqi: numOrNull(a && a.current && a.current.us_aqi),
    pm25: numOrNull(a && a.current && a.current.pm2_5),
    source: 'Open-Meteo.com',
  };
  const res = new Response(JSON.stringify(out), {
    headers: { ...BASE_HEADERS, 'cache-control': 'public, max-age=' + SKY_TTL },
  });
  waitUntil(cache.put(key, res.clone()));
  return res;
}

async function write(request, env) {
  const m = (request.headers.get('authorization') || '').match(/^Bearer\s+([A-Za-z0-9_-]{20,200})$/);
  if (!m) return reply(401, { error: 'Missing upload key.' });
  const key = await env.PLANEDEX_DB
    .prepare('SELECT name FROM ingest_keys WHERE sha256 = ?1')
    .bind(await sha256hex(m[1]))
    .first();
  if (!key) return reply(403, { error: 'Unknown upload key.' });

  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) return reply(413, { error: 'Too big.' });
  const text = await request.text();
  if (text.length > MAX_BYTES) return reply(413, { error: 'Too big.' });
  if (FORBIDDEN.test(text)) return reply(422, { error: 'Refused: the data carries location fields.' });
  let data;
  try { data = JSON.parse(text); } catch { return reply(400, { error: 'Not valid JSON.' }); }
  if (!data || data.v !== 1 || !Array.isArray(data.species) || !data.totals) {
    return reply(400, { error: 'Unexpected format.' });
  }

  const at = new Date().toISOString();
  await env.PLANEDEX_DB
    .prepare('INSERT INTO snapshot (id, json, updated_at) VALUES (1, ?1, ?2) '
      + 'ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at')
    .bind(text, at)
    .run();
  return reply(200, { ok: true, from: key.name, bytes: text.length, at });
}

export async function onRequest({ request, env, waitUntil }) {
  const q = new URL(request.url).searchParams;
  if (request.method === 'GET' && q.has('sky')) return sky(request, waitUntil);
  if (!env.PLANEDEX_DB) return reply(503, { error: 'The PLANEDEX_DB binding is missing.' });
  switch (request.method) {
    case 'GET':
      if (q.has('voice')) return voice(request, env, waitUntil, q.get('voice'));
      return q.has('logbook') ? logbook(env) : read(env, false);
    case 'HEAD': return read(env, true);
    case 'POST': return q.has('voice') ? voiceUpload(request, env, q.get('voice')) : write(request, env);
    default: return reply(405, { error: 'Use GET or POST.' }, { allow: 'GET, HEAD, POST' });
  }
}
