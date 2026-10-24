/**
 * Beats of the arrival shot (in timeline seconds; the timeline plays at
 * `timeScale`). Shared by the 3D director and the DOM overlay that types the
 * contract lines, so the two stay in sync.
 */
export const ARRIVAL = {
  timeScale: 0.8,
  /** After the crawl: one smooth tilt down from the stars to the horizon. */
  tiltDown: 3.5,
  /** The ship's pass, from behind and overhead toward the horizon. */
  shipStart: 3.0,
  shipPass: 9.0,
  roar: 3.0,
  /** A few seconds after the ship clears, the camera starts flying. */
  fly: 9.5,
  /** How long the camera takes to catch up with the ship. */
  blend: 3.6,
  path: 13.0,
  /** Into the room: down the duct to behind the hunter's shoulder. */
  roomIn: 3.2,
  /** Helmet off, set down, sit. */
  hunter: 6.0,
  /** Then into the eyes. */
  roomOut: 2.8,
} as const;

export const T_DUCT = ARRIVAL.fly + ARRIVAL.path;
export const T_SHOULDER = T_DUCT + ARRIVAL.roomIn;
export const T_EYES = T_SHOULDER + ARRIVAL.hunter;
export const T_END = T_EYES + ARRIVAL.roomOut;

/** Real-world seconds the arrival takes. */
export const ARRIVAL_SECONDS = T_END / ARRIVAL.timeScale;
