/**
 * localStorage wrapper that never throws. Storage can be unavailable in
 * private windows, sandboxed iframes, or when the user blocks site data.
 * The site must keep working in all of those cases, just without memory.
 */
export const KEY_PREFIX = 'bh.';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(KEY_PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: silently skip, the feature degrades gracefully.
  }
}
