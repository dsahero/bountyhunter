/**
 * The maintenance duct above the seat and its ceiling grate. In the intro,
 * the camera dives through a dark vent on the ship's spine and comes out
 * here: running lights flicker on, the grate opens, and it drops into the
 * cockpit.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DUCT } from '../../../hub/layout';
import { Louvers } from '../../procedural/Louvers';
import { cockpitFx } from './fx';

export function Duct({ material }: { material: THREE.Material }) {
  const light = useRef<THREE.PointLight>(null);
  const strips = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffa040', transparent: true, toneMapped: false }),
    [],
  );
  const walls = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2a2d31',
        metalness: 0.5,
        roughness: 0.6,
        side: THREE.BackSide,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const on = cockpitFx.ductLights.current;
    // A little flicker while the lights are coming up.
    const flicker = on < 1 ? 0.6 + 0.4 * Math.sin(clock.elapsedTime * 60) : 1;
    strips.opacity = on * flicker;
    if (light.current) light.current.intensity = 2.2 * on * flicker;
  });

  const half = DUCT.size / 2;
  const midY = DUCT.roofY + DUCT.length / 2;
  return (
    <group position={[DUCT.x, 0, DUCT.z]}>
      {/* Square shaft, open at the bottom; a 4-sided open cylinder rotated 45° */}
      <mesh position={[0, midY, 0]} rotation-y={Math.PI / 4} material={walls}>
        <cylinderGeometry args={[half * Math.SQRT2, half * Math.SQRT2, DUCT.length, 4, 1, true]} />
      </mesh>
      <mesh position={[0, DUCT.roofY + DUCT.length, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[DUCT.size, DUCT.size]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* Running lights in the corners */}
      {[0.25, 0.6, 0.95].map((h) =>
        [-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${h}${sx}${sz}`}
              position={[sx * (half - 0.03), DUCT.roofY + h, sz * (half - 0.03)]}
              material={strips}
            >
              <boxGeometry args={[0.02, 0.08, 0.02]} />
            </mesh>
          )),
        ),
      )}
      <pointLight ref={light} position={[0, DUCT.roofY + 0.6, 0]} color="#ffa040" distance={1.6} />
      <Louvers
        size={DUCT.size}
        open={cockpitFx.grateOpen}
        material={material}
        position={[0, DUCT.roofY - 0.06, 0]}
      />
    </group>
  );
}
