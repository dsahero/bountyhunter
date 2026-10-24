/**
 * K-0D3 (read "Code"): a small, original floating orb droid that hovers by
 * the main computer. It bobs, its lens tracks the pilot, and clicking it gets
 * a beep and a (captioned) hint.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClickable } from '../../stations/common';
import { cue, caption } from '../../../audio/cues';
import { useReducedMotion } from '../../../lib/reducedMotion';
import { lore } from '../../../content/lore';

const HOME = new THREE.Vector3(0.62, 1.3, -0.62);
const EYE_IDLE = new THREE.Color('#ff5a3c');

const HINTS = lore.droidHints;

export function Droid() {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eye = useRef<THREE.MeshBasicMaterial>(null);
  const hint = useRef(0);
  const reduced = useReducedMotion();
  const mats = useMemo(
    () => ({
      shell: new THREE.MeshStandardMaterial({ color: '#d9d4c7', metalness: 0.4, roughness: 0.4 }),
      band: new THREE.MeshStandardMaterial({ color: '#6e1f2c', metalness: 0.3, roughness: 0.6 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1d1f22', metalness: 0.5, roughness: 0.5 }),
    }),
    [],
  );
  const click = useClickable(
    useMemo(
      () => () => {
        cue('beep');
        caption(HINTS[hint.current++ % HINTS.length]!, 4200);
        if (eye.current) eye.current.color.set('#5fd4ff');
      },
      [],
    ),
  );

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime;
    if (root.current) {
      root.current.position.copy(HOME);
      if (!reduced) {
        root.current.position.y += Math.sin(t * 1.6) * 0.012;
        root.current.position.x += Math.sin(t * 0.5) * 0.01;
      }
    }
    head.current?.lookAt(camera.position);
    if (eye.current) eye.current.color.lerp(EYE_IDLE, 1 - Math.exp(-dt * 0.8));
  });

  return (
    <group ref={root} {...click}>
      <group ref={head}>
        <mesh material={mats.shell}>
          <sphereGeometry args={[0.045, 24, 18]} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} material={mats.band}>
          <torusGeometry args={[0.046, 0.006, 8, 32]} />
        </mesh>
        {/* Lens faces +Z after lookAt */}
        <mesh position={[0, 0.005, 0.04]} material={mats.dark}>
          <cylinderGeometry args={[0.016, 0.016, 0.012, 20]} />
        </mesh>
        <mesh position={[0, 0.005, 0.047]}>
          <circleGeometry args={[0.009, 20]} />
          <meshBasicMaterial ref={eye} color="#ff5a3c" toneMapped={false} />
        </mesh>
        <mesh position={[0.02, 0.055, -0.01]} rotation-z={-0.3} material={mats.dark}>
          <cylinderGeometry args={[0.002, 0.002, 0.04, 6]} />
        </mesh>
      </group>
      {/* Repulsor glow underneath */}
      <mesh position={[0, -0.05, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.02, 16]} />
        <meshBasicMaterial color="#5fd4ff" transparent opacity={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
}
