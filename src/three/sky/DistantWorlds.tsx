/**
 * Extra scenery deep in the sky: three small far-off planets (one ringed) and
 * two spiral galaxies painted procedurally into canvas sprites. All sit inside
 * the star sphere, so stars never draw over them.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { seeded } from '../procedural/textures';
import { Drift } from './Drift';

function galaxyTexture(seed: number, tint: string) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = seeded(seed);
  const core = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.18);
  core.addColorStop(0, 'rgba(255,240,220,0.9)');
  core.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = tint;
  for (let i = 0; i < 2500; i++) {
    const arm = i % 2;
    const r = rand() ** 0.7 * size * 0.48;
    const a = arm * Math.PI + r * 0.045 + (rand() - 0.5) * 0.7;
    ctx.globalAlpha = 0.15 + rand() * 0.35 * (1 - r / (size * 0.5));
    ctx.fillRect(size / 2 + Math.cos(a) * r, size / 2 + Math.sin(a) * r * 0.55, 1.4, 1.4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const PLANETS = [
  { pos: [180, 40, -160], r: 7, color: '#6f8fb3' },
  { pos: [-210, 70, 60], r: 5, color: '#9b7fc4' },
  { pos: [120, -30, 220], r: 9, color: '#c9a36b', ring: true },
] as const;

export function DistantWorlds() {
  const galaxies = useMemo(
    () => [
      { tex: galaxyTexture(5, '#b8d4ff'), pos: [-150, 110, -200] as const, scale: 90, rot: 0.4 },
      { tex: galaxyTexture(9, '#ffc8e8'), pos: [230, 20, 120] as const, scale: 60, rot: -0.8 },
    ],
    [],
  );

  return (
    <>
      {PLANETS.map((p) => (
        <Drift key={p.color} intro={p.pos}>
          <mesh>
            <sphereGeometry args={[p.r, 32, 24]} />
            <meshStandardMaterial color={p.color} roughness={1} />
          </mesh>
          {'ring' in p && (
            <mesh rotation={[1.2, 0.3, 0]}>
              <ringGeometry args={[p.r * 1.4, p.r * 2.2, 64]} />
              <meshBasicMaterial
                color="#d8c4a0"
                transparent
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </Drift>
      ))}
      {galaxies.map((g, i) => (
        <Drift key={i} intro={g.pos} clearance={g.scale * 2}>
          <sprite scale={[g.scale, g.scale, 1]}>
            <spriteMaterial
              map={g.tex}
              rotation={g.rot}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              opacity={0.8}
            />
          </sprite>
        </Drift>
      ))}
    </>
  );
}
