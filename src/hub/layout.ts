/**
 * Cockpit layout in meters, shared by the 3D scene and the DOM.
 *
 * Kept free of three.js imports so the (eagerly loaded) station panels can
 * use it without pulling the 3D bundle into the first page load.
 *
 * Coordinates: the pilot sits at the origin facing -Z; +Y is up.
 */
import type { SectionKey } from '../content/lore';

export type Vec3 = [number, number, number];
export type StationId = SectionKey;

/** Pilot eye position: the first-person camera. */
export const EYE: Vec3 = [0, 1.2, 0.28];

/** The big main computer, laid back so it can be large without blocking the canopy. */
export const CONSOLE = {
  center: [0, 0.86, -0.62] as Vec3,
  /** Rotation about X; negative lays the top edge back, away from the pilot. */
  tilt: -0.85,
  width: 1.3,
  height: 0.72,
  /** On-screen UI size in CSS px; 1px = HTML_SCALE meters. */
  uiWidth: 650,
  uiHeight: 360,
};
export const HTML_SCALE = CONSOLE.width / CONSOLE.uiWidth;

/** Side consoles run along both walls; their top surface height. */
export const SIDE_TOP = 0.86;

/** Where the helmet rests: the right console, beside the seat, visor toward the pilot. */
export const HELMET_ON_SHELF = {
  position: [0.98, SIDE_TOP + 0.195, 0.0] as Vec3,
  rotationY: Math.PI / 2 - 0.3,
};

/** Maintenance duct above the seat: how the camera enters the cockpit in the intro. */
export const DUCT = { x: 0, z: 0.55, size: 0.6, roofY: 2.13, length: 1.3 };

/** The point each station's camera looks at. */
export const ANCHORS: Record<StationId | 'console', Vec3> = {
  console: [0, 0.8, -0.6],
  about: [0, 1.36, -1.08],
  // Education: homeworld hologram on the left console. Experience: overhead timeline star map.
  education: [-0.98, 1.1, -0.72],
  experience: [0, 1.66, -0.6],
  // Leadership replaces the star map overhead with its own hologram.
  leadership: [0, 1.66, -0.6],
  skills: [0.98, 1.12, -0.72],
  projects: [0.001, 1.3, 2.99],
  resume: [-0.95, 0.9, -0.3],
  contact: [1.18, 1.1, -0.35],
};

/** Yaw/pitch (radians) that point the seated camera at a world point. */
export function lookAtPoint([x, y, z]: Vec3): { yaw: number; pitch: number } {
  const dx = x - EYE[0];
  const dy = y - EYE[1];
  const dz = z - EYE[2];
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
}

/** Propaganda posters on the cargo hold's back wall: rows of up to four, centered. */
/**
 * Where propaganda posters get pasted up, in fill order. Every slot is in
 * plain view from the seat (through the doorway or on the bulkhead around
 * it): the cargo hold's back wall in two rows either side of the door, and
 * the bulkhead flanks facing the seat. The hold's side walls are hidden
 * behind the bulkhead, so they get none. Posters fill these in content
 * order (the classified one last); add slots here if you add more projects.
 */
export interface PosterSlot {
  position: Vec3;
  rotationY: number;
}
/** Poster size in meters (small enough that none overlap the door, lights, or each other). */
export const POSTER_SIZE = { w: 0.32, h: 0.48 };
const BACK = 2.99;
const UPPER = 1.5;
const LOWER = 0.9;
const back = (x: number, y: number): PosterSlot => ({ position: [x, y, BACK], rotationY: Math.PI });
export const POSTER_SLOTS: readonly PosterSlot[] = [
  back(0.6, UPPER),
  back(-0.6, UPPER),
  { position: [0.98, 1.35, 0.955], rotationY: Math.PI },
  { position: [-0.98, 1.35, 0.955], rotationY: Math.PI },
  back(0.98, UPPER),
  back(-0.98, UPPER),
  back(0.6, LOWER),
  back(-0.6, LOWER),
  back(0.98, LOWER),
  back(-0.98, LOWER),
];

export function posterSlot(index: number): PosterSlot {
  return POSTER_SLOTS[Math.min(index, POSTER_SLOTS.length - 1)]!;
}

export function posterPoint(index: number): Vec3 {
  return posterSlot(index).position;
}

/** The door at the back of the cargo hold, to the rest of the ship. */
export const CARGO_DOOR = { position: [0, 0.98, BACK] as Vec3, width: 0.56, height: 1.95 };

/** The cantina guitar, hanging on the cargo hold's starboard wall. */
/**
 * Lying on the floor in the middle of the cargo hold, in front of the back
 * door and under its own spotlight: in plain view through the doorway, clear
 * of the walls and crates. Angled a little, as if set down in a hurry.
 */
export const GUITAR = { position: [0, 0, 2.0] as Vec3, rotationY: Math.PI - 0.5 };

/**
 * The red/blue weapon buttons: a small plate hung on two struts from the
 * canopy's top arch, front right, clear of the overhead holograms. Tilted to face the seat.
 */
export const WEAPON_PLATE = { position: [0.55, 1.9, -0.68] as Vec3, tilt: -0.55 };

/** A point on the weapon plate (plate-local), in world space. */
export function onWeaponPlate(x: number, y: number, z: number): Vec3 {
  const [px, py, pz] = WEAPON_PLATE.position;
  const c = Math.cos(WEAPON_PLATE.tilt);
  const s = Math.sin(WEAPON_PLATE.tilt);
  return [px + x, py + y * c - z * s, pz + y * s + z * c];
}

/** Tchotchkes around the cockpit (each one is clickable; flavor text in portfolio.site.props). */
export const PROPS = {
  levers: [-0.98, SIDE_TOP, -0.56] as Vec3,
  switches: [1.05, SIDE_TOP, -0.7] as Vec3,
  /** Hanging from the underside of the weapon plate, beside the torpedo button. */
  dice: onWeaponPlate(0.17, -0.015, -0.03),
  mug: [0.92, SIDE_TOP, -0.2] as Vec3,
  plant: [-1.14, SIDE_TOP, -0.82] as Vec3,
  bobble: [0.86, SIDE_TOP, -0.5] as Vec3,
  picture: [-0.88, SIDE_TOP, -0.82] as Vec3,
};
export type PropId = keyof typeof PROPS;
