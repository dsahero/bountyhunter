/**
 * Light, cookie-free analytics (Vercel Web Analytics): page views plus a few
 * custom events (stations opened, achievements, deep links, guestbook).
 * Nothing is sent from local dev or preview builds, and no personal data is
 * ever included.
 * Turn it on in the Vercel dashboard (Project > Analytics > Enable).
 */
import { inject, track as vercelTrack } from '@vercel/analytics';

let started = false;

/** Only on the deployed site: local dev and preview builds have no analytics endpoint. */
const enabled = () =>
  import.meta.env.PROD &&
  typeof location !== 'undefined' &&
  !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

export function startAnalytics() {
  if (started || !enabled()) return;
  started = true;
  inject({ mode: 'production', debug: false });
}

/** Record an event; never throws (analytics must not break the site). */
export function track(name: string, props?: Record<string, string | number | boolean>) {
  if (!started) return;
  try {
    vercelTrack(name, props);
  } catch {
    /* ignore */
  }
}
