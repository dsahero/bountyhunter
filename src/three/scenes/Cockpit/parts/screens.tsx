/** The small glowing side screens (canvas-drawn text with a subtle flicker). */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Vec3 } from '../../../../hub/layout';
import { useStationClick } from '../../../stations/common';
import type { Mats } from './materials';

/** A glowing screen with canvas-drawn text and a subtle flicker. */
export function Screen({
  size,
  texture,
  ...props
}: { size: [number, number]; texture: THREE.Texture } & JSX.IntrinsicElements['mesh']) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.92 + Math.sin(clock.elapsedTime * 47) * 0.02;
  });
  return (
    <mesh {...props}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={mat} map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

/** A framed screen standing on a side console, angled toward the pilot. */
export function SideScreen({
  position,
  facing,
  texture,
  mats,
  onClick,
}: {
  position: Vec3;
  facing: number;
  texture: THREE.Texture;
  mats: Mats;
  onClick: ReturnType<typeof useStationClick>;
}) {
  return (
    <group position={position} rotation-y={facing} {...onClick}>
      <mesh position={[0, -0.2, -0.02]} material={mats.frame}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
      <mesh position={[0, 0, -0.025]} material={mats.frame}>
        <boxGeometry args={[0.5, 0.33, 0.04]} />
      </mesh>
      <Screen texture={texture} size={[0.46, 0.29]} />
    </group>
  );
}
