/**
 * The experience timeline: charges in chronological order and where each
 * one's planet sits on the overhead star map. Plain math (no three.js), so
 * both the 3D map and the camera/panels can use it.
 */
import { portfolio } from '../content/portfolio';
import type { Charge } from '../content/schema';
import { ANCHORS, type Vec3 } from './layout';

/** The map is tilted to face the seat, and grows by this much while open. */
export const TIMELINE = { tilt: 0.48, width: 0.66, focusScale: 1.5 };

/** "Jun 2026" -> a sortable number. */
export function parseMonth(label: string): number {
  const d = Date.parse(`1 ${label}`);
  return Number.isNaN(d) ? Number.MAX_SAFE_INTEGER : d;
}

/** Experience (internships and research, not leadership) by start date, oldest first. */
export function chronological(
  charges: Charge[] = portfolio.charges.filter((c) => c.kind === 'internship'),
): Charge[] {
  return [...charges].sort((a, b) => parseMonth(a.start) - parseMonth(b.start));
}

/** Node position in map-local space: left to right along a gently winding path. */
export function timelineLocal(i: number, n: number): Vec3 {
  const t = n === 1 ? 0.5 : i / (n - 1);
  return [(t - 0.5) * TIMELINE.width, Math.sin(i * 1.7) * 0.06, Math.cos(i * 1.3) * 0.03];
}

/** World position of a charge's planet while the Experience station is open. */
export function chargeWorldPoint(id: string): Vec3 {
  const list = chronological();
  const i = Math.max(
    0,
    list.findIndex((c) => c.id === id),
  );
  const [lx, ly, lz] = timelineLocal(i, list.length).map((v) => v * TIMELINE.focusScale) as Vec3;
  const c = Math.cos(TIMELINE.tilt);
  const s = Math.sin(TIMELINE.tilt);
  const [ax, ay, az] = ANCHORS.experience;
  return [ax + lx, ay + ly * c - lz * s, az + ly * s + lz * c];
}
