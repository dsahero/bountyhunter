import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';

type Vec3 = [number, number, number];

/**
 * A box stretched between two points. Handy for struts, pipes, and canopy
 * frames: you think in endpoints instead of computing positions and angles.
 */
export function Beam({
  from,
  to,
  size = 0.06,
  depth = size,
  children,
}: {
  from: Vec3;
  to: Vec3;
  size?: number;
  depth?: number;
  children?: ReactNode;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      // Box's long axis is Y; rotate Y onto the from->to direction.
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      ),
      length: dir.length(),
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <boxGeometry args={[size, length, depth]} />
      {children}
    </mesh>
  );
}
