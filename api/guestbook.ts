/**
 * The guestbook API (a Vercel Edge Function at /api/guestbook).
 *
 *   GET   the latest entries, newest first
 *   POST  { name, message, website }  add an entry (website is a honeypot)
 *
 * Storage: an Upstash Redis list over its REST API (no SDK). Create a free
 * Upstash Redis database (or Vercel's "Upstash for Redis" integration) and
 * set either pair of env vars on the Vercel project:
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or
 *   KV_REST_API_URL + KV_REST_API_TOKEN
 * Without them the endpoint answers 503 and the page shows "offline".
 *
 * To moderate, delete entries in the Upstash console (key "guestbook").
 */
import { LIMITS, validateEntry, type GuestbookEntry } from '../src/guestbook/shared';

export const config = { runtime: 'edge' };

const KEY = 'guestbook';

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return async (...command: (string | number)[]) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    return ((await res.json()) as { result: unknown }).result;
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default async function handler(req: Request): Promise<Response> {
  const run = redis();
  if (!run) return json({ error: 'offline' }, 503);
  try {
    if (req.method === 'GET') {
      const raw = (await run('LRANGE', KEY, 0, LIMITS.show - 1)) as string[];
      const entries = raw.flatMap((r) => {
        try {
          return [JSON.parse(r) as GuestbookEntry];
        } catch {
          return [];
        }
      });
      return json({ entries });
    }
    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const entry = validateEntry(body);
      if (!entry) return json({ error: 'invalid' }, 400);
      // One entry per visitor every few seconds.
      const ip = (req.headers.get('x-forwarded-for') ?? 'anon').split(',')[0]!.trim();
      const ok = await run('SET', `guestbook:rate:${ip}`, 1, 'EX', LIMITS.cooldownSeconds, 'NX');
      if (ok !== 'OK') return json({ error: 'too-fast' }, 429);
      const saved: GuestbookEntry = { ...entry, at: new Date().toISOString() };
      await run('LPUSH', KEY, JSON.stringify(saved));
      await run('LTRIM', KEY, 0, LIMITS.keep - 1);
      return json({ entry: saved }, 201);
    }
    return json({ error: 'method' }, 405);
  } catch {
    return json({ error: 'offline' }, 503);
  }
}
