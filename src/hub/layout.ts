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
export const POSTER_WALL = { z: 2.99, top: 1.3, rowGap: 0.88, spacing: 0.6, perRow: 4 };

export function posterPoint(index: number, count: number): Vec3 {
  const { perRow, spacing, top, rowGap, z } = POSTER_WALL;
  const row = Math.floor(index / perRow);
  const inRow = Math.min(perRow, count - row * perRow);
  const col = index % perRow;
  // Facing +Z from the seat, +X is on the left, so the first poster sits leftmost.
  const x = ((inRow - 1) / 2 - col) * spacing;
  const rows = Math.ceil(count / perRow);
  const y = top + ((rows - 1) / 2 - row) * rowGap * (rows > 1 ? 1 : 0) + (rows > 1 ? 0.15 : 0);
  return [x, y, z];
}
