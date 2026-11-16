/**
 * One Worker serves the whole project: the static site and the notes API.
 *
 * Keeping them on a single origin means one Cloudflare Access policy covers
 * both, there is no CORS, and there is no second endpoint that can be left
 * unauthenticated. Access rejects anonymous requests before they reach this
 * code, so every request here is already from a signed-in reader.
 */

/**
 * Each editor keeps one JSON document in KV: a list under a named field.
 * `snapshot` prefixes the daily copies taken before a write.
 */
const STORES = {
  '/api/notes': { key: 'reading-notes', field: 'books', snapshot: 'snapshot:' },
  '/api/bulletins': { key: 'bulletins', field: 'weeks', snapshot: 'snapshot-bulletins:' },
};

const MAX_BODY = 2 * 1024 * 1024; // 2 MB is far more prose than this holds

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** YYYY-MM-DD in UTC, used to keep one recoverable snapshot per day. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

async function read(env, store) {
  const stored = await env.NOTES.get(store.key, 'json');
  return stored && Array.isArray(stored[store.field])
    ? stored
    : { version: 1, [store.field]: [] };
}

/**
 * Keep a snapshot of the state before the first write of each day, so a bad
 * overwrite loses at most one day rather than everything. KV has no history
 * of its own.
 */
async function snapshot(env, store, previous) {
  const key = store.snapshot + today();
  if (await env.NOTES.get(key)) return;
  await env.NOTES.put(key, JSON.stringify(previous), {
    expirationTtl: 60 * 60 * 24 * 90,
  });
}

async function handleStore(request, env, store) {
  if (request.method === 'GET') {
    return json(await read(env, store));
  }

  if (request.method === 'PUT') {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return json({ error: 'Too large.' }, 413);
    }

    let incoming;
    try {
      incoming = JSON.parse(raw);
    } catch (e) {
      return json({ error: 'Body is not JSON.' }, 400);
    }
    if (!incoming || !Array.isArray(incoming[store.field])) {
      return json({ error: 'Expected { ' + store.field + ': [] }.' }, 400);
    }

    const previous = await read(env, store);
    await snapshot(env, store, previous);
    await env.NOTES.put(store.key, JSON.stringify({
      version: 1,
      [store.field]: incoming[store.field],
      savedAt: Date.now(),
    }));
    return json({ ok: true, [store.field]: incoming[store.field].length });
  }

  return json({ error: 'Use GET or PUT.' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (Object.prototype.hasOwnProperty.call(STORES, url.pathname)) {
      return handleStore(request, env, STORES[url.pathname]);
    }

    // Asset html_handling is off, so /reading.html stays /reading.html instead
    // of redirecting to /reading. The cost is that the bare root needs mapping.
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    // Everything else is the static site.
    return env.ASSETS.fetch(request);
  },
};
