/**
 * The guitar on its stand in the cockpit's back corner, beside the helmet
 * shelf, under its own warm light. Picking it up starts the attack.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GUITAR } from '../../../../hub/layout';
import { CabinLight } from '../cabinLight';
import { useAttack } from '../../../../hub/attack';
import { useClickable } from '../../../stations/common';
import { metal, plastic } from './materials';

/** How far the guitar leans back into its stand (radians). */
const LEAN = 0.14;

export function Guitar() {
  const start = useMemo(() => () => useAttack.getState().start(), []);
  const click = useClickable(start);
  const m = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color: '#b0301c',
        roughness: 0.3,
        metalness: 0.1,
        emissive: '#3a0a04',
      }),
      top: new THREE.MeshStandardMaterial({
        color: '#f0b45a',
        roughness: 0.35,
        emissive: '#3a2008',
      }),
      neck: plastic('#4a2a14', 0.5),
      hole: plastic('#120a05', 0.9),
      string: metal('#f0f0f0', 0.2),
      stand: metal('#1c1e22', 0.4),
      pad: plastic('#111111', 0.9),
    }),
    [],
  );
  const [x, y, z] = GUITAR.position;
  return (
    <group position={[x, y, z]} rotation-y={GUITAR.rotationY}>
      {/* Its own warm spotlight, so it catches the eye */}
      <CabinLight position={[0, 1.2, 0.35]} color="#ffc070" intensity={2.4} distance={1.8} />

      {/* Stand: three splayed legs, a post behind the guitar, a padded cradle, and a neck yoke */}
      {[0, 2.1, 4.2].map((a) => (
        <mesh
          key={a}
          position={[Math.sin(a) * 0.1, 0.07, Math.cos(a) * 0.1 - 0.08]}
          rotation={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]}
          material={m.stand}
        >
          <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, -0.1]} rotation-x={-LEAN} material={m.stand}>
        <cylinderGeometry args={[0.009, 0.009, 0.86, 6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.12 * s, 0.14, 0.01]} rotation-x={Math.PI / 2} material={m.pad}>
          <cylinderGeometry args={[0.014, 0.014, 0.1, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.14, -0.04]} material={m.stand}>
        <boxGeometry args={[0.26, 0.012, 0.012]} />
      </mesh>
      <mesh position={[0, 0.88, -0.2]} material={m.pad}>
        <torusGeometry args={[0.03, 0.007, 6, 12, Math.PI]} />
      </mesh>

      {/* The guitar, upright in the cradle and leaning back into the yoke */}
      <group {...click} scale={1.15} position={[0, 0.13, 0]} rotation-x={-LEAN}>
        {(
          [
            [0.17, 0.16],
            [0.37, 0.13],
          ] as const
        ).map(([py, r]) => (
          <group key={py} position={[0, py, 0]}>
            <mesh rotation-x={Math.PI / 2} material={m.body}>
              <cylinderGeometry args={[r, r, 0.08, 28]} />
            </mesh>
            <mesh position={[0, 0, 0.041]} material={m.top}>
              <circleGeometry args={[r - 0.008, 28]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.27, 0.043]} material={m.hole}>
          <circleGeometry args={[0.045, 20]} />
        </mesh>
        {/* A short neck and headstock */}
        <mesh position={[0, 0.63, 0.03]} material={m.neck}>
          <boxGeometry args={[0.05, 0.3, 0.025]} />
        </mesh>
        <mesh position={[0, 0.83, 0.025]} rotation-x={0.15} material={m.neck}>
          <boxGeometry args={[0.07, 0.11, 0.02]} />
        </mesh>
        {[-0.015, -0.005, 0.005, 0.015].map((sx) => (
          <mesh key={sx} position={[sx, 0.53, 0.046]} material={m.string}>
            <boxGeometry args={[0.0015, 0.56, 0.0015]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
