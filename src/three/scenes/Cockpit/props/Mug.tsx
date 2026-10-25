/** A caf mug: a lathed cup with real wall thickness, coffee inside, and an upright handle. */
import { useMemo } from 'react';
import * as THREE from 'three';
import { plastic } from './materials';

export function Mug() {
  const m = useMemo(
    () => ({
      cup: new THREE.MeshStandardMaterial({
        color: '#c9a227',
        roughness: 0.45,
        side: THREE.DoubleSide,
      }),
      coffee: plastic('#2a160b', 0.15),
    }),
    [],
  );
  const profile = useMemo(
    () =>
      [
        [0, 0],
        [0.029, 0],
        [0.032, 0.004],
        [0.033, 0.09],
        [0.0295, 0.09],
        [0.0285, 0.01],
        [0, 0.01],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  return (
    <group>
      <mesh material={m.cup}>
        <latheGeometry args={[profile, 32]} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation-x={-Math.PI / 2} material={m.coffee}>
        <circleGeometry args={[0.0288, 32]} />
      </mesh>
      {/* Handle: the right half of a ring, standing upright against the side */}
      <mesh position={[0.033, 0.047, 0]} rotation-z={-Math.PI / 2} material={m.cup}>
        <torusGeometry args={[0.022, 0.006, 10, 20, Math.PI]} />
      </mesh>
    </group>
  );
}
