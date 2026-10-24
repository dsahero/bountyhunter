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
import { useUnlocks } from '../../state/unlocks';
import { CARGO_DOOR, POSTER_SIZE, posterSlot } from '../../hub/layout';
import type { Propaganda } from '../../content/schema';
import { makePosterTexture } from './posters';
import { CabinLight } from '../scenes/Cockpit/cabinLight';
import { useClickable } from './common';

type Placement = { position: readonly [number, number, number]; rotationY: number };

function Poster({ project, slot }: { project: Propaganda; slot: Placement }) {
  const selected = useHub((s) => s.project === project.id);
  const unlocked = useUnlocks((s) => s.classified);
  const locked = project.classified && !unlocked;
  const texture = useMemo(() => makePosterTexture(project, locked), [project, locked]);
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
        <planeGeometry args={[POSTER_SIZE.w + 0.06, POSTER_SIZE.h + 0.06]} />
        <meshBasicMaterial ref={glow} color="#5fd4ff" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh {...click}>
        <planeGeometry args={[POSTER_SIZE.w, POSTER_SIZE.h]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.9}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* A small work light above each poster */}
      <mesh position={[0, POSTER_SIZE.h / 2 + 0.035, 0.02]}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
        <meshBasicMaterial color="#ffcf90" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A sealed pressure door at the back of the hold, to the rest of the ship. */
function CargoDoor() {
  const [x, y, z] = CARGO_DOOR.position;
  const { width, height } = CARGO_DOOR;
  const mats = useMemo(
    () => ({
      frame: new THREE.MeshStandardMaterial({ color: '#3a3f46', metalness: 0.85, roughness: 0.35 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#6b6f74', metalness: 0.8, roughness: 0.4 }),
      stripe: new THREE.MeshStandardMaterial({ color: '#d9a020', roughness: 0.6 }),
      light: new THREE.MeshBasicMaterial({ color: '#ff5a3c', toneMapped: false }),
      trim: new THREE.MeshBasicMaterial({ color: '#ffb347', toneMapped: false }),
      panel: new THREE.MeshStandardMaterial({ color: '#15171a', metalness: 0.6, roughness: 0.5 }),
      ok: new THREE.MeshBasicMaterial({ color: '#7dff9a', toneMapped: false }),
    }),
    [],
  );
  return (
    <group position={[x, y, z - 0.01]} rotation-y={Math.PI}>
      {/* Frame */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(width / 2 + 0.05) * s, 0, 0.02]} material={mats.frame}>
          <boxGeometry args={[0.1, height + 0.1, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, height / 2 + 0.05, 0.02]} material={mats.frame}>
        <boxGeometry args={[width + 0.2, 0.1, 0.06]} />
      </mesh>
      {/* Two leaves with a center seam */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(width / 4 + 0.003) * s, 0, 0.01]} material={mats.leaf}>
          <boxGeometry args={[width / 2 - 0.006, height, 0.03]} />
        </mesh>
      ))}
      {/* Hazard stripes and a status light */}
      {[-0.7, 0.7].map((k) => (
        <mesh key={k} position={[0, (height / 2) * k, 0.03]} material={mats.stripe}>
          <boxGeometry args={[width - 0.02, 0.06, 0.005]} />
        </mesh>
      ))}
      {/* Glowing trim around the opening, so it reads as a door from the seat */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(width / 2 + 0.004) * s, 0, 0.055]} material={mats.trim}>
          <boxGeometry args={[0.012, height, 0.004]} />
        </mesh>
      ))}
      <mesh position={[0, height / 2 + 0.004, 0.055]} material={mats.trim}>
        <boxGeometry args={[width + 0.02, 0.012, 0.004]} />
      </mesh>
      {/* Door control panel and its lights */}
      <mesh position={[width / 2 + 0.05, 0.05, 0.06]} material={mats.panel}>
        <boxGeometry args={[0.07, 0.16, 0.02]} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0.1, 0.071]} material={mats.light}>
        <boxGeometry args={[0.03, 0.025, 0.004]} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0.04, 0.071]} material={mats.ok}>
        <boxGeometry args={[0.03, 0.025, 0.004]} />
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
          slot={posterSlot(i)}
        />
      ))}
      <CabinLight position={[0, 1.9, 2.2]} color="#ffb060" intensity={5} distance={3.5} />
      <CargoDoor />
    </group>
  );
}
