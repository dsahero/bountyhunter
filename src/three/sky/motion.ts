/**
 * How fast the ship is cruising, as seen from the camera (0 = holding still,
 * 1 = full cruise). The star stream reads it every frame; the arrival
 * director ramps it up when the camera starts flying.
 */
export const cruise = { current: 1 };
