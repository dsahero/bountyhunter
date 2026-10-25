/** A bobble-head astromech on the dash: its dome wobbles. */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PROPS } from '../../../../hub/layout';
import { useReducedMotion } from '../../../../lib/reducedMotion';
import { facePilot, glow, plastic } from './materials';

export function BobbleDroid() {
  const head = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const m = useMemo(
    () => ({ body: plastic('#e8ecf0', 0.4), blue: plastic('#2e5fa8', 0.4), eye: glow('#ff3b30') }),
    [],
  );
  useFrame(({ clock }) => {
    if (head.current && !reduced)
      head.current.rotation.z = Math.sin(clock.elapsedTime * 3.1) * 0.12;
  });
  return (
    <group rotation-y={facePilot(PROPS.bobble)}>
      <mesh position={[0, 0.03, 0]} material={m.body}>
        <cylinderGeometry args={[0.022, 0.024, 0.05, 14]} />
      </mesh>
      <mesh position={[0, 0.03, 0.022]} material={m.blue}>
        <boxGeometry args={[0.02, 0.025, 0.003]} />
      </mesh>
      <group ref={head} position={[0, 0.056, 0]}>
        <mesh position={[0, 0.006, 0]} material={m.body}>
          <sphereGeometry args={[0.03, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.02, 0.022]} material={m.eye}>
          <sphereGeometry args={[0.006, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}
