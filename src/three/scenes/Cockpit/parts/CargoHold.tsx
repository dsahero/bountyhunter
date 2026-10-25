/** The cargo hold behind the cockpit: walls, floor, and crates (the posters and door are in PropagandaWall). */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Mats } from './materials';

export function CargoHold({ mats }: { mats: Mats }) {
  const crate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5a4a36', roughness: 0.9 }),
    [],
  );
  const crates: [number, number, number, number][] = [
    [-0.85, 0.22, 1.5, 0.44],
    [-0.85, 0.58, 1.5, 0.28],
    [0.9, 0.25, 2.2, 0.5],
    [0.55, 0.17, 2.35, 0.34],
  ];
  return (
    <group>
      <mesh position={[0, -0.02, 2.02]} material={mats.floor}>
        <boxGeometry args={[2.4, 0.04, 2.0]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[1.2 * side, 1.1, 2.02]} material={mats.panel}>
          <boxGeometry args={[0.05, 2.2, 2.0]} />
        </mesh>
      ))}
      <mesh position={[0, 2.18, 2.02]} material={mats.panel}>
        <boxGeometry args={[2.4, 0.05, 2.0]} />
      </mesh>
      <mesh position={[0, 1.1, 3.02]} material={mats.frame}>
        <boxGeometry args={[2.4, 2.2, 0.05]} />
      </mesh>
      {crates.map(([x, y, z, s]) => (
        <mesh key={`${x}${y}`} position={[x, y, z]} rotation-y={x * 0.3} material={crate}>
          <boxGeometry args={[s, s, s]} />
        </mesh>
      ))}
    </group>
  );
}
