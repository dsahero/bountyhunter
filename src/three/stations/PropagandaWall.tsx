/**
 * Projects station: rebel propaganda posters pasted up in the cargo hold
 * behind the pilot's seat: two on the bulkhead either side of the doorway,
 * one down the corridor, and the classified one on the far wall.
 * Click a poster to play its "intercepted transmission" (the panel).
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { posterOrder, useHub } from '../../state/hub';
import { posterPoint } from '../../hub/layout';
import type { Propaganda } from '../../content/schema';
import { makePosterTexture } from './posters';
import { useClickable } from './common';

type Placement = { position: [number, number, number]; rotationY: number };

function Poster({ project, slot }: { project: Propaganda; slot: Placement }) {
  const selected = useHub((s) => s.project === project.id);
  const texture = useMemo(() => makePosterTexture(project, project.classified), [project]);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const click = useClickable(
    useMemo(
      () => () => {
        useHub.getState().selectProject(project.id);
      },
      [project.id],
    ),
  );
  useFrame((_, dt) => {
    if (glow.current)
      glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, selected ? 0.9 : 0, 6, dt);
  });

  return (
    <group position={slot.position} rotation-y={slot.rotationY}>
      {/* Selection glow behind the poster */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[0.6, 0.84]} />
        <meshBasicMaterial ref={glow} color="#5fd4ff" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh {...click}>
        <planeGeometry args={[0.52, 0.78]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.9}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* A small work light above each poster */}
      <mesh position={[0, 0.46, 0.03]}>
        <boxGeometry args={[0.16, 0.03, 0.05]} />
        <meshBasicMaterial color="#ffcf90" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function PropagandaWall() {
  const posters = useMemo(posterOrder, []);
  return (
    <group>
      {posters.map((p, i) => (
        <Poster
          key={p.id}
          project={p}
          slot={{ position: posterPoint(i, posters.length), rotationY: Math.PI }}
        />
      ))}
      <pointLight position={[0, 1.9, 2.2]} color="#ffb060" intensity={5} distance={3.5} />
    </group>
  );
}
