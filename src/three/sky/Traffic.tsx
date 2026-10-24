/**
 * Distant traffic: a few far-off ships crossing the sky on long, slow
 * passes, each a dark hull with a running light and an engine glow. Lives
 * inside the camera-following sky group, so it reads as far away.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LANES = [
  { from: [-220, 30, -180], to: [220, 45, -200], period: 70, offset: 0 },
  { from: [200, -10, -150], to: [-200, 5, -230], period: 95, offset: 30 },
  { from: [-160, 70, 120], to: [180, 60, -60], period: 120, offset: 60 },
] as const;

export function Traffic() {
  const ships = useRef<(THREE.Group | null)[]>([]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lanes = useMemo(
    () =>
      LANES.map((l) => ({
        ...l,
        a: new THREE.Vector3(...l.from),
        b: new THREE.Vector3(...l.to),
      })),
    [],
  );

  useFrame(({ clock }) => {
    lanes.forEach((l, i) => {
      const g = ships.current[i];
      if (!g) return;
      const t = ((clock.elapsedTime + l.offset) % l.period) / l.period;
      g.position.lerpVectors(l.a, l.b, t);
      // lookAt wants world space; the sky group moves with the camera.
      g.lookAt(g.parent ? g.parent.localToWorld(target.copy(l.b)) : l.b);
    });
  });

  return (
    <>
      {lanes.map((_, i) => (
        <group key={i} ref={(g) => void (ships.current[i] = g)} scale={3}>
          <mesh>
            <boxGeometry args={[0.6, 0.25, 1.6]} />
            <meshStandardMaterial color="#3a3d42" />
          </mesh>
          <mesh position={[0, 0, -0.85]}>
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshBasicMaterial color="#9fe6ff" toneMapped={false} />
          </mesh>
          <mesh position={[0.35, 0.1, 0.4]}>
            <sphereGeometry args={[0.08, 6, 4]} />
            <meshBasicMaterial color="#ff3b30" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}
