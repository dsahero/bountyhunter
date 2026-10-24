/**
 * Analytic two-bone IK (shoulder -> elbow -> hand), the standard trick for
 * natural-looking arms without a skeleton: given where the hand should go,
 * solve the elbow position with the law of cosines, bending toward a "pole"
 * direction (out and down, like a real elbow), so arms never cross or invert.
 */
import * as THREE from 'three';

const DOWN = new THREE.Vector3(0, -1, 0);
const tmp = {
  dir: new THREE.Vector3(),
  pole: new THREE.Vector3(),
  side: new THREE.Vector3(),
  elbow: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  parentQ: new THREE.Quaternion(),
};

/**
 * Solve the elbow for a two-bone limb.
 * Returns the elbow position (world) in `out`; the hand ends at `target`
 * (or as close as the limb's length allows).
 */
export function solveElbow(
  shoulder: THREE.Vector3,
  target: THREE.Vector3,
  upper: number,
  lower: number,
  pole: THREE.Vector3,
  out: THREE.Vector3,
): THREE.Vector3 {
  const dir = tmp.dir.subVectors(target, shoulder);
  const reach = upper + lower - 1e-4;
  const d = THREE.MathUtils.clamp(dir.length(), Math.abs(upper - lower) + 1e-4, reach);
  dir.normalize();
  // Distance along the shoulder->target line to the elbow's foot, and the elbow's offset from it.
  const a = (upper * upper - lower * lower + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(upper * upper - a * a, 0));
  // Bend direction: the pole, made perpendicular to the limb.
  const bend = tmp.pole.copy(pole).addScaledVector(dir, -pole.dot(dir));
  if (bend.lengthSq() < 1e-8) bend.set(0, -1, 0).addScaledVector(dir, dir.y);
  bend.normalize();
  return out.copy(shoulder).addScaledVector(dir, a).addScaledVector(bend, h);
}

/**
 * Rotate `bone` (whose length runs along local -Y) so it points from `from`
 * to `to` in world space, accounting for its parent's world rotation.
 */
export function aimBone(bone: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  const dir = tmp.side.subVectors(to, from).normalize();
  const world = tmp.q.setFromUnitVectors(DOWN, dir);
  bone.parent?.getWorldQuaternion(tmp.parentQ);
  bone.quaternion.copy(tmp.parentQ.invert().multiply(world));
}
