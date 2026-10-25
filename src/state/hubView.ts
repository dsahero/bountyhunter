/**
 * Where the camera points and how wide the lens is for what the hub shows:
 * stations, inspected objects, console apps, and the console itself. The
 * hub store (./hub) calls these when the view changes; the camera rig reads
 * `currentFov` every frame.
 */
import {
  ANCHORS,
  EYE,
  GUITAR,
  HELMET_ON_SHELF,
  PROPS,
  type PropId,
  lookAtPoint,
  posterPoint,
  type StationId,
  type Vec3,
} from '../hub/layout';
import { chargeWorldPoint } from '../hub/timeline';
import { portfolio } from '../content/portfolio';
import { useHub } from './hub';

export type Inspectable = 'helmet' | 'guitar' | PropId;
export type HubApp = 'achievements' | 'guestbook';
export const HUB_APPS: readonly HubApp[] = ['achievements', 'guestbook'];

/** Where each inspectable object is (world points). */
export const INSPECT_POINTS: Record<Inspectable, Vec3> = {
  helmet: HELMET_ON_SHELF.position,
  guitar: [GUITAR.position[0], GUITAR.position[1] + 0.6, GUITAR.position[2]],
  ...PROPS,
};

/** Vertical field of view: wide at the console, zoomed in when a station is open. */
export function targetFov(stationOpen: boolean, portrait: boolean) {
  if (portrait) return stationOpen ? 60 : 82;
  return stationOpen ? 42 : 62;
}

/** How much room to leave around an inspected object (1 = it fills the view). */
const CLOSEUP_ROOM = 2.0;

/** Rough size (radius, meters) of each inspectable thing, so the close-up frames it. */
const INSPECT_RADIUS: Partial<Record<Inspectable, number>> = { guitar: 0.6, helmet: 0.2 };

/**
 * Lens for a close look at an inspected object: narrow enough that it fills
 * the view (the camera zooms in; the object itself never grows).
 */
export function inspectFov(item: Inspectable, portrait: boolean) {
  const [x, y, z] = INSPECT_POINTS[item];
  const d = Math.hypot(x - EYE[0], y - EYE[1], z - EYE[2]);
  const r = INSPECT_RADIUS[item] ?? 0.11;
  // Frame the object with plenty of room around it (it fills about half the view).
  const fov = ((2 * Math.atan((r * CLOSEUP_ROOM) / d) * 180) / Math.PI) * (portrait ? 1.5 : 1);
  return Math.min(50, Math.max(18, fov));
}

/** The lens for what's on screen right now. */
export function currentFov(portrait: boolean) {
  const { station, inspect, app } = useHub.getState();
  if (inspect) return inspectFov(inspect, portrait);
  if (app) return targetFov(true, portrait);
  return targetFov(!!station, portrait);
}

/** Fraction of the screen width the station panel covers on desktop (see panels.css). */
const PANEL_FRACTION = 0.56;

/** The posters, in wall order (classified last). */
export function posterOrder() {
  return [...portfolio.propaganda].sort((a, b) => Number(a.classified) - Number(b.classified));
}

/** The exact thing to look at for a station, given what's selected in it. */
function focusPoint(id: StationId, state: { charge: string; project: string | null }): Vec3 {
  if (id === 'experience') return chargeWorldPoint(state.charge);
  if (id === 'projects' && state.project) {
    const i = posterOrder().findIndex((p) => p.id === state.project);
    if (i >= 0) return posterPoint(i);
  }
  return ANCHORS[id];
}

/**
 * Where to point the head for a point of interest. On desktop the target is
 * centered in the part of the screen the panel leaves uncovered; in portrait
 * it sits in the top third (the panel is a bottom sheet).
 */
export function lookForPoint(point: Vec3, fov?: number) {
  const look = lookAtPoint(point);
  if (typeof window === 'undefined') return look;
  const aspect = window.innerWidth / window.innerHeight;
  const portrait = aspect < 1;
  const halfV = (((fov ?? targetFov(true, portrait)) / 2) * Math.PI) / 180;
  if (portrait) {
    // Put the target ~1/3 of the way down: look lower by that fraction of the half-height.
    return { ...look, pitch: look.pitch - Math.atan(Math.tan(halfV) * 0.35) };
  }
  // Center the target in the part of the screen the panel leaves uncovered.
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const offset = PANEL_FRACTION; // target at (1 - PANEL_FRACTION) / 2 across = this much of the half-width left of center
  return { ...look, yaw: look.yaw - Math.atan(Math.tan(halfH) * offset) };
}

/** Stations shown entirely in-world (no side panel), so they're centered. */
const IN_WORLD_STATIONS: StationId[] = ['leadership'];

export function lookForStation(id: StationId) {
  const point = focusPoint(id, useHub.getState());
  return IN_WORLD_STATIONS.includes(id) ? lookAtPoint(point) : lookForPoint(point);
}

export function consoleLook() {
  return lookAtPoint(ANCHORS.console);
}
