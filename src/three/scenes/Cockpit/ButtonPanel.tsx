/**
 * A console control panel: a raised metal plate with a darker bezel, and a
 * grid of keys sitting *on* it. Keys come in short runs of one color so it
 * reads as designed controls, some are unlit, and a few blink.
 *
 * The panel's top surface is at local y = 0 (place the group on the console
 * surface); keys sit on top of it.
 */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../../procedural/textures';

const PALETTE = ['#ffb347', '#ffb347', '#ff5a3c', '#5fd4ff', '#7dff9a'].map(
  (c) => new THREE.Color(c),
);
const UNLIT = new THREE.Color('#3a3430');
const DIM = new THREE.Color('#201810');

const plateMat = new THREE.MeshStandardMaterial({
  color: '#4a4f57',
  metalness: 0.5,
  roughness: 0.55,
});
const bezelMat = new THREE.MeshStandardMaterial({
  color: '#17191c',
  metalness: 0.4,
  roughness: 0.7,
});

export function ButtonPanel({
  width,
  depth,
  cols,
  rows,
  seed,
  gap,
  ...props
}: {
  width: number;
  depth: number;
  cols: number;
  rows: number;
  seed: number;
  /** Leave the middle columns empty (e.g. to fit a screen), as a half-width in meters. */
  gap?: number;
} & JSX.IntrinsicElements['group']) {
  const { keys, blinkers } = useMemo(() => {
    const rand = seeded(seed);
    const m = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ toneMapped: false }),
      cols * rows,
    );
    const o = new THREE.Object3D();
    const blinkers: { index: number; color: THREE.Color; rate: number; offset: number }[] = [];
    const inner = { w: width * 0.9, d: depth * 0.8 };
    const cellX = inner.w / cols;
    const cellZ = inner.d / rows;
    const size = Math.min(cellX, cellZ) * 0.6;
    const keyH = 0.01;
    let run = PALETTE[0]!;
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c % 4 === 0) run = PALETTE[Math.floor(rand() * PALETTE.length)]!;
        const x = -inner.w / 2 + (c + 0.5) * cellX;
        const hidden = (gap !== undefined && Math.abs(x) < gap) || rand() < 0.1;
        const wide = rand() < 0.18 ? 1.8 : 1;
        o.position.set(x, keyH / 2, -inner.d / 2 + (r + 0.5) * cellZ);
        o.scale.set(hidden ? 0 : size * wide, hidden ? 0 : keyH, hidden ? 0 : size);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        const lit = rand() > 0.25;
        const color = lit ? run.clone() : UNLIT;
        m.setColorAt(i, color);
        if (lit && rand() < 0.12)
          blinkers.push({ index: i, color, rate: 0.5 + rand() * 2, offset: rand() * 10 });
        i++;
      }
    }
    return { keys: m, blinkers };
  }, [width, depth, cols, rows, seed, gap]);

  useFrame(({ clock }) => {
    for (const b of blinkers) {
      const on = Math.sin((clock.elapsedTime + b.offset) * b.rate * Math.PI) > 0;
      keys.setColorAt(b.index, on ? b.color : DIM);
    }
    if (keys.instanceColor) keys.instanceColor.needsUpdate = true;
  });

  return (
    <group {...props}>
      {/* Bezel, then the raised plate whose top face is y = 0 */}
      <mesh position={[0, -0.02, 0]} material={bezelMat}>
        <boxGeometry args={[width + 0.03, 0.03, depth + 0.03]} />
      </mesh>
      <mesh position={[0, -0.008, 0]} material={plateMat}>
        <boxGeometry args={[width, 0.016, depth]} />
      </mesh>
      <primitive object={keys} />
    </group>
  );
}
