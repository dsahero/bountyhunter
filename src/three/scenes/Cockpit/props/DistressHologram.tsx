/** Another hunter on the overhead projector, mid-firefight, calling for help (during the attack). */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS } from '../../../../hub/layout';
import { useAttack } from '../../../../hub/attack';
import { makeHoloMaterial } from '../../../holo/holoMaterial';
import { Projector } from '../../../stations/common';
import { facePilot, glow } from './materials';

export function DistressHologram() {
  const stage = useAttack((s) => s.stage);
  const material = useMemo(() => makeHoloMaterial('#ff7a5a', 1, 0.8), []);
  const visor = useMemo(() => glow('#ffd0c0'), []);
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.x = -1.3 + Math.sin(clock.elapsedTime * 7) * 0.08;
  });
  if (stage !== 'incoming' && stage !== 'alert') return null;
  const [x, y, z] = ANCHORS.experience;
  return (
    <group>
      <Projector
        position={[x, 2.05, z + 0.05]}
        height={0.34}
        radius={0.24}
        active
        flip
        color="#ff7a5a"
      />
      <group position={[x, y - 0.3, z]} rotation-y={facePilot(ANCHORS.experience)} scale={0.5}>
        <mesh position={[0, 0.35, 0]} scale={[1, 1.2, 0.6]} material={material}>
          <sphereGeometry args={[0.22, 20, 14]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} material={material}>
          <sphereGeometry args={[0.13, 20, 16]} />
        </mesh>
        <mesh position={[0, 0.73, 0.11]} material={visor}>
          <boxGeometry args={[0.14, 0.025, 0.02]} />
        </mesh>
        <mesh position={[0, 0.68, 0.115]} material={visor}>
          <boxGeometry args={[0.025, 0.08, 0.02]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.25 * s, 0.52, 0]} material={material}>
            <sphereGeometry args={[0.08, 12, 10]} />
          </mesh>
        ))}
        <mesh position={[-0.27, 0.3, 0]} rotation-z={0.15} material={material}>
          <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
        </mesh>
        {/* Blaster arm, firing off-frame */}
        <group ref={arm} position={[0.27, 0.52, 0]}>
          <mesh position={[0, -0.17, 0]} material={material}>
            <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.38, 0.03]} material={material}>
            <boxGeometry args={[0.05, 0.16, 0.08]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
