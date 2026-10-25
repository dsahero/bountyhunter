/** Fuzzy dice hanging under the weapon plate, swaying (more when the hull rumbles). */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rumbleAt } from '../../../../hub/rumble';
import { useReducedMotion } from '../../../../lib/reducedMotion';
import { plastic } from './materials';

export function HangingDice() {
  const swing = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const m = useMemo(
    () => ({ die: plastic('#e8e2d0', 0.9), pip: plastic('#1a1a1a'), cord: plastic('#333') }),
    [],
  );
  useFrame(({ clock }) => {
    if (!swing.current) return;
    const t = clock.elapsedTime;
    const shake = rumbleAt() * 0.5;
    swing.current.rotation.z = reduced ? 0 : Math.sin(t * 1.3) * (0.12 + shake);
    swing.current.rotation.x = reduced ? 0 : Math.sin(t * 0.9 + 1) * (0.06 + shake);
  });
  return (
    <group ref={swing}>
      {[-0.03, 0.035].map((x, i) => (
        <group key={x}>
          <mesh position={[x, -0.08 - i * 0.03, 0]} material={m.cord}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.16 + i * 0.06, 4]} />
          </mesh>
          <mesh position={[x, -0.18 - i * 0.06, 0]} rotation={[0.4 + i, 0.6, 0.2]} material={m.die}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
