/* Planedex data API (Cloudflare Pages Function) for /tools/planedex/.

   GET  /api/planedex   The latest game data, as last pushed by the PC
                        that keeps the ADS-B logs (scripts/planedex/),
                        plus the latest morning report as "report".
   POST /api/planedex   Replace the game data. Needs "Authorization:
                        Bearer <key>". Only the key's SHA-256 is stored
                        (ingest_keys table), never the key itself.

   Binding: PLANEDEX_DB = the D1 database "planedex"
   (Pages project > Settings > Bindings > D1 database).
   Tables: snapshot (a single row: id 1, json, updated_at), ingest_keys
   (name, sha256, created_at) and journal (day, text, created_at): one
   morning report per day, written by a scheduled task straight into D1.

   Privacy backstop: the push script already strips anything that could
   place the antenna, and this refuses any payload that still carries
   distance or position fields. */

const MAX_BYTES = 1_000_000;
const FORBIDDEN = /"(min_dist(_nm)?|dist(ance)?|lat(itude)?|lon(gitude)?|position|owner|hex|min_alt(_ft)?|squawks)"\s*:/i;
const BASE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
};

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

async function read(env, head) {
  const row = await env.PLANEDEX_DB
    .prepare('SELECT json, updated_at FROM snapshot WHERE id = 1')
    .first();
  if (!row) return reply(404, { error: "No data yet: the receiver hasn't sent its first update." });
  let body = row.json;
  const report = head ? null : await latestReport(env);
  // Splice it in rather than re-parsing the whole snapshot.
  if (report && body.trimEnd().endsWith('}')) {
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

export async function onRequest({ request, env }) {
  if (!env.PLANEDEX_DB) return reply(503, { error: 'The PLANEDEX_DB binding is missing.' });
  switch (request.method) {
    case 'GET': return read(env, false);
    case 'HEAD': return read(env, true);
    case 'POST': return write(request, env);
    default: return reply(405, { error: 'Use GET or POST.' }, { allow: 'GET, HEAD, POST' });
  }
}
