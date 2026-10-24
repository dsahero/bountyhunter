/**
 * A camera path: a smooth spline through position keyframes, with a second
 * spline for where the camera looks. `sample(u)` takes u = 0..1 as a fraction
 * of *distance traveled*, so tweening u linearly moves the camera at constant
 * speed with no stops between keyframes. The look-at spline is evaluated at
 * the same spline parameter, so each look target lines up with its position.
 */
import * as THREE from 'three';

type V = [number, number, number];

export function makePath(positions: V[], targets: V[]) {
  const pos = new THREE.CatmullRomCurve3(
    positions.map((p) => new THREE.Vector3(...p)),
    false,
    'centripetal',
  );
  const tgt = new THREE.CatmullRomCurve3(
    targets.map((p) => new THREE.Vector3(...p)),
    false,
    'centripetal',
  );
  pos.arcLengthDivisions = 400;
  const lengths = pos.getLengths(400);
  const total = lengths[lengths.length - 1]!;
  return {
    length: total,
    /** Arc-length fraction (0..1) at which the path passes keyframe i. */
    knotU(i: number) {
      const idx = Math.round((i / (positions.length - 1)) * 400);
      return lengths[idx]! / total;
    },
    sample(u: number, outPos: THREE.Vector3, outTgt: THREE.Vector3) {
      // distance 0 = "use u" (three's typings require the argument).
      const t = pos.getUtoTmapping(THREE.MathUtils.clamp(u, 0, 1), 0);
      pos.getPoint(t, outPos);
      tgt.getPoint(t, outTgt);
    },
  };
}
