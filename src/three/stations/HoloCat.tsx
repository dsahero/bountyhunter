/**
 * A holocall with Sniffles: a sitting cat hologram on the overhead projector,
 * tail swishing, meowing at random (captioned) until you hang up.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS, EYE } from '../../hub/layout';
import { lore } from '../../content/lore';
import { cue } from '../../audio/cues';
import { makeHoloMaterial, HOLO_BLUE } from '../holo/holoMaterial';
import { Projector } from './common';

const TAIL_SEGMENTS = 9;

export function HoloCat() {
  const [x, y, z] = ANCHORS.experience;
  const material = useMemo(() => makeHoloMaterial(HOLO_BLUE, 1), []);
  const eyes = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#c8ffd0', toneMapped: false, transparent: true }),
    [],
  );
  const tail = useRef<(THREE.Mesh | null)[]>([]);
  const head = useRef<THREE.Group>(null);

  // Meow at random intervals for as long as the call lasts.
  useEffect(() => {
    let timer = 0;
    const meow = () => {
      cue('meow', lore.captions.meow);
      timer = window.setTimeout(meow, 2500 + Math.random() * 3500);
    };
    timer = window.setTimeout(meow, 900);
    return () => window.clearTimeout(timer);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    tail.current.forEach((m, i) => {
      if (!m) return;
      const k = i / TAIL_SEGMENTS;
      m.position.set(
        Math.sin(t * 2.2 - k * 2.5) * 0.25 * k,
        0.05 + k * 0.55 + Math.sin(k * Math.PI) * 0.1,
        0.42 + k * 0.1,
      );
    });
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.9) * 0.12;
      // Blink now and then.
      eyes.opacity = Math.sin(t * 0.7) > 0.97 ? 0 : 1;
    }
  });

  // Face the pilot.
  const facing = Math.atan2(EYE[0] - x, EYE[2] - z);
  return (
    <group>
      <Projector position={[x, 2.05, z + 0.05]} height={0.34} radius={0.24} active flip />
      <group position={[x, y - 0.12, z]} rotation-y={facing} scale={0.28}>
        {/* Body (sitting) and haunches */}
        <mesh position={[0, 0.35, 0.15]} scale={[0.7, 0.9, 0.8]} material={material}>
          <sphereGeometry args={[0.45, 24, 18]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[0.25 * s, 0.18, 0.25]}
            scale={[0.6, 0.5, 0.8]}
            material={material}
          >
            <sphereGeometry args={[0.3, 16, 12]} />
          </mesh>
        ))}
        {/* Front paws */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[0.12 * s, 0.05, -0.18]}
            scale={[1, 0.6, 1.4]}
            material={material}
          >
            <sphereGeometry args={[0.08, 12, 10]} />
          </mesh>
        ))}
        {/* Head, ears, eyes, nose, whiskers */}
        <group ref={head} position={[0, 0.88, -0.05]}>
          <mesh scale={[1.1, 0.95, 1]} material={material}>
            <sphereGeometry args={[0.28, 24, 18]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.16 * s, 0.26, 0]} rotation-z={-0.35 * s} material={material}>
              <coneGeometry args={[0.09, 0.2, 4]} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.1 * s, 0.03, -0.26]} scale={[1, 1.4, 0.4]} material={eyes}>
              <sphereGeometry args={[0.035, 10, 8]} />
            </mesh>
          ))}
          <mesh position={[0, -0.06, -0.28]} material={material}>
            <coneGeometry args={[0.025, 0.04, 3]} />
          </mesh>
          {[-1, 1].map((s) =>
            [0.02, -0.02].map((dy) => (
              <mesh
                key={`${s}${dy}`}
                position={[0.17 * s, -0.08 + dy, -0.24]}
                rotation-z={Math.PI / 2 + dy * 4 * s}
                material={material}
              >
                <cylinderGeometry args={[0.003, 0.003, 0.22, 4]} />
              </mesh>
            )),
          )}
        </group>
        {/* Tail */}
        {Array.from({ length: TAIL_SEGMENTS }, (_, i) => (
          <mesh key={i} ref={(m) => void (tail.current[i] = m)} material={material}>
            <sphereGeometry args={[0.06 - i * 0.003, 10, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
