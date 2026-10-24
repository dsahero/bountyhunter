/**
 * Mutable controls the arrival director animates on cockpit props
 * (refs, not React state, so tweening them never re-renders the scene).
 */
export const cockpitFx = {
  /** 0..1: running lights inside the ceiling duct. */
  ductLights: { current: 1 },
  /** 0..1: the ceiling grate's slats. */
  grateOpen: { current: 0 },
};
