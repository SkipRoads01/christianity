/**
 * One Worker serves two things: a copy of the static site, and the notes
 * store that keeps notes the same on every unlocked device.
 *
 * The site is public. The store is not, and it does its own checking: every
 * request has to carry the key a device keeps once its owner has entered the
 * passcode. This file holds only the hash of that key, the same hash sync.js
 * holds, because every file in this repository is served publicly. Nothing in
 * front of the Worker is relied on to keep strangers out.
 */

/** SHA-256 of the stretched passcode. scripts/passcode.mjs keeps it level with sync.js. */
const VERIFIER = '9d016c417b18e772570f78a1eceb3d5707662fb712ad80d2b2e2b92b00d6df79';

/** Pages on these origins may call the store. Pages served by the Worker itself need no entry. */
const ORIGINS = ['https://skiproads01.github.io'];

/**
 * Each editor keeps one JSON document in KV: a list under a named field.
 * `snapshot` prefixes the daily copies taken before a write.
 */
const STORES = {
  '/api/notes': { key: 'reading-notes', field: 'books', snapshot: 'snapshot:' },
  '/api/bulletins': { key: 'bulletins', field: 'weeks', snapshot: 'snapshot-bulletins:' },
  '/api/passages': { key: 'passages', field: 'passages', snapshot: 'snapshot-passages:' },
  '/api/ptsem': { key: 'ptsem', field: 'materials', snapshot: 'snapshot-ptsem:' },
};

const MAX_BODY = 2 * 1024 * 1024; // 2 MB is far more prose than this holds

/**
 * A deleted item stays as a marker so the deletion reaches every device.
 * Devices drop a marker after 90 days. The store keeps it twice as long, so
 * it never refuses something a device still holds.
 */
const MARKER_DAYS = 180;

function cors(request) {
  const origin = request.headers.get('origin');
  if (!ORIGINS.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    'vary': 'origin',
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...cors(request),
    },
  });
}

async function allowed(request) {
  const match = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get('authorization') || '');
  if (!match) return false;
  const key = new Uint8Array(match[1].match(/../g).map((pair) => parseInt(pair, 16)));
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', key));
  const hex = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
  return hex === VERIFIER;
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
 * write loses at most one day rather than everything. KV has no history of
 * its own.
 */
async function snapshot(env, store, previous) {
  const key = store.snapshot + today();
  if (await env.NOTES.get(key)) return;
  await env.NOTES.put(key, JSON.stringify(previous), {
    expirationTtl: 60 * 60 * 24 * 90,
  });
}

/**
 * Combine what the store holds with what a device sent. The newer version of
 * each item wins, and an item only one side has is kept. A device that sends
 * an old copy therefore cannot remove another device's work.
 */
function merge(stored, incoming) {
  const cutoff = Date.now() - MARKER_DAYS * 86400000;
  const out = new Map();

  for (const item of [...stored, ...incoming]) {
    if (!item || typeof item.id !== 'string' || item.id === '' || item.id.length > 64) continue;
    const stamp = Number(item.updatedAt) || 0;
    if (item.deleted && stamp < cutoff) continue;
    const seen = out.get(item.id);
    if (!seen || stamp > (Number(seen.updatedAt) || 0)) out.set(item.id, item);
  }

  return [...out.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}

async function handleStore(request, env, store) {
  // The browser asks permission before a cross-origin request that carries a
  // key. That question has no key on it, so it is answered before the check.
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(request) });
  }

  if (!(await allowed(request))) {
    return json(request, { error: 'Locked.' }, 401);
  }

  if (request.method === 'GET') {
    return json(request, await read(env, store));
  }

  if (request.method === 'PUT') {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return json(request, { error: 'Too large.' }, 413);
    }

    let incoming;
    try {
      incoming = JSON.parse(raw);
    } catch (e) {
      return json(request, { error: 'Body is not JSON.' }, 400);
    }
    if (!incoming || !Array.isArray(incoming[store.field])) {
      return json(request, { error: 'Expected { ' + store.field + ': [] }.' }, 400);
    }

    const previous = await read(env, store);
    const merged = merge(previous[store.field], incoming[store.field]);

    // Most requests bring nothing new. Writing only on a change keeps the
    // store well inside its daily write allowance.
    if (JSON.stringify(merged) === JSON.stringify(previous[store.field])) {
      return json(request, previous);
    }

    const next = { version: 1, [store.field]: merged, savedAt: Date.now() };
    await snapshot(env, store, previous);
    await env.NOTES.put(store.key, JSON.stringify(next));
    return json(request, next);
  }

  return json(request, { error: 'Use GET or PUT.' }, 405);
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
