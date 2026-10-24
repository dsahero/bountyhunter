/**
 * A square louvered vent: a frame with slats that rotate open. Used for the
 * maintenance vent on the ship's spine and the grate in the cockpit ceiling.
 * `open` (0..1) is a mutable ref the director tweens.
 */
import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Louvers({
  size,
  slats = 5,
  open,
  material,
  ...props
}: {
  size: number;
  slats?: number;
  open: MutableRefObject<number>;
  material: THREE.Material;
} & JSX.IntrinsicElements['group']) {
  const slatRefs = useRef<(THREE.Mesh | null)[]>([]);
  const depth = size / slats;

  useFrame(() => {
    for (const s of slatRefs.current) if (s) s.rotation.x = open.current * 1.35;
  });

  const frame = 0.04;
  return (
    <group {...props}>
      {[-1, 1].map((side) => (
        <mesh key={`x${side}`} position={[(side * (size + frame)) / 2, 0, 0]} material={material}>
          <boxGeometry args={[frame, 0.05, size + frame * 2]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`z${side}`} position={[0, 0, (side * (size + frame)) / 2]} material={material}>
          <boxGeometry args={[size, 0.05, frame]} />
        </mesh>
      ))}
      {Array.from({ length: slats }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => void (slatRefs.current[i] = m)}
          position={[0, 0, -size / 2 + depth * (i + 0.5)]}
          material={material}
        >
          <boxGeometry args={[size, 0.012, depth * 0.95]} />
        </mesh>
      ))}
    </group>
  );
}
