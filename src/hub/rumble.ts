/**
 * Hull rumbles while the ship is under attack: at random moments the cabin
 * shakes (camera and loose objects), the hull groans, and sometimes metal
 * screeches. Everything reads `rumbleAt()` each frame.
 */
import { cue } from '../audio/cues';
import { portfolio } from '../content/portfolio';

const DURATION = 1.6;
let startedAt = -Infinity;
let timer = 0;

/** Shake strength right now, 0..1 (a quick swell then a decay). */
export function rumbleAt(now = performance.now() / 1000) {
  const t = now - startedAt;
  if (t < 0 || t > DURATION) return 0;
  return Math.min(1, t / 0.2) * Math.pow(1 - t / DURATION, 1.5);
}

function hit() {
  startedAt = performance.now() / 1000;
  const c = portfolio.site.captions;
  cue('rumble', c.rumble);
  if (Math.random() < 0.45) window.setTimeout(() => cue('screech', c.screech), 500);
}

export function startRumbles() {
  stopRumbles();
  const next = () => {
    hit();
    timer = window.setTimeout(next, 3500 + Math.random() * 4500);
  };
  timer = window.setTimeout(next, 1200);
}

export function stopRumbles() {
  window.clearTimeout(timer);
  timer = 0;
}
