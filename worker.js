/**
 * One Worker serves the whole project: the static site and the notes API.
 *
 * Keeping them on a single origin means one Cloudflare Access policy covers
 * both, there is no CORS, and there is no second endpoint that can be left
 * unauthenticated. Access rejects anonymous requests before they reach this
 * code, so every request here is already from a signed-in reader.
 */

const NOTES_KEY = 'reading-notes';
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

async function readNotes(env) {
  const stored = await env.NOTES.get(NOTES_KEY, 'json');
  return stored && Array.isArray(stored.books) ? stored : { version: 1, books: [] };
}

/**
 * Keep a snapshot of the state before the first write of each day, so a bad
 * overwrite loses at most one day rather than everything. KV has no history
 * of its own.
 */
async function snapshot(env, previous) {
  const key = 'snapshot:' + today();
  if (await env.NOTES.get(key)) return;
  await env.NOTES.put(key, JSON.stringify(previous), {
    expirationTtl: 60 * 60 * 24 * 90,
  });
}

async function handleNotes(request, env) {
  if (request.method === 'GET') {
    return json(await readNotes(env));
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
    if (!incoming || !Array.isArray(incoming.books)) {
      return json({ error: 'Expected { books: [] }.' }, 400);
    }

    const previous = await readNotes(env);
    await snapshot(env, previous);
    await env.NOTES.put(NOTES_KEY, JSON.stringify({
      version: 1,
      books: incoming.books,
      savedAt: Date.now(),
    }));
    return json({ ok: true, books: incoming.books.length });
  }

  return json({ error: 'Use GET or PUT.' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/notes') {
      return handleNotes(request, env);
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
