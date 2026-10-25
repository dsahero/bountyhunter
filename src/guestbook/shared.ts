/**
 * Guestbook rules shared by the page and the server (api/guestbook.ts), so
 * both validate the same way.
 */
export interface GuestbookEntry {
  name: string;
  message: string;
  /** ISO timestamp. */
  at: string;
}

export const LIMITS = { name: 40, message: 280, keep: 200, show: 50, cooldownSeconds: 30 } as const;

/** A short list of words that never make it into the public log. */
const BLOCKED = /\b(fuck|shit|cunt|nigg|fag|retard|whore|slut|rape)\w*/i;
const LINKS = /(https?:\/\/|www\.|\b[\w-]+\.(com|net|org|io|ru|xyz|top|info)\b)/i;

const clean = (s: unknown, max: number) =>
  typeof s === 'string'
    ? s
        // eslint-disable-next-line no-control-regex -- strip control characters
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

/** Validate a submission. Returns the cleaned entry, or null if it's not allowed. */
export function validateEntry(input: {
  name?: unknown;
  message?: unknown;
  /** Honeypot: a hidden field real people leave empty. */
  website?: unknown;
}): Omit<GuestbookEntry, 'at'> | null {
  if (typeof input.website === 'string' && input.website.trim()) return null;
  const name = clean(input.name, LIMITS.name);
  const message = clean(input.message, LIMITS.message);
  if (!name || !message) return null;
  if (BLOCKED.test(name) || BLOCKED.test(message)) return null;
  if (LINKS.test(name) || LINKS.test(message)) return null;
  return { name, message };
}
