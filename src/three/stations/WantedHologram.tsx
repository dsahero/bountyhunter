/**
 * About station: a hologram of the target, projected above the main
 * computer: a slowly turning head-and-shoulders figure inside a targeting
 * reticle, with WANTED and the reward floating above.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ANCHORS } from '../../hub/layout';
import { portfolio } from '../../content/portfolio';
import { makeHoloMaterial, useHoloFade, HOLO_BLUE } from '../holo/holoMaterial';
import { makeTextSprite } from '../holo/textSprite';
import { Projector, useFocusScale, useIsActive, useStationClick } from './common';

export function WantedHologram() {
  const active = useIsActive('about');
  const click = useStationClick('about');
  const spin = useRef<THREE.Group>(null);
  const reticle = useRef<THREE.Group>(null);
  const grow = useRef<THREE.Group>(null);
  useFocusScale(grow, active, 1.6);
  const [x, y, z] = ANCHORS.about;

  const mats = useMemo(
    () => [makeHoloMaterial(HOLO_BLUE, 0.4), makeHoloMaterial('#ff6a4d', 0.4)],
    [],
  );
  useHoloFade(mats, active ? 1 : 0.4);
  const labels = useMemo(() => {
    const title = makeTextSprite('WANTED', { color: '#ff8a70', height: 0.05 });
    const reward = makeTextSprite(
      `${portfolio.identity.reward.amount.toLocaleString('en-US')} CR`,
      {
        color: '#bff0ff',
        height: 0.028,
      },
    );
    return { title, reward };
  }, []);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.5;
    if (reticle.current) reticle.current.rotation.z -= dt * 0.3;
  });

  const [blue, red] = mats as [THREE.ShaderMaterial, THREE.ShaderMaterial];
  return (
    <group>
      {/* Emitter pod on top of the main computer */}
      <mesh position={[x, y - 0.27, z]}>
        <boxGeometry args={[0.32, 0.04, 0.2]} />
        <meshStandardMaterial color="#26292d" metalness={0.4} roughness={0.7} />
      </mesh>
      <Projector position={[x, y - 0.25, z]} height={0.12} radius={0.12} active={active} />

      <group position={[x, y, z]} {...click}>
        <group ref={grow}>
          <group ref={spin} scale={0.16} position={[0, -0.1, 0]}>
            <mesh position={[0, 0.05, 0]} scale={[1.2, 0.42, 0.6]} material={blue}>
              <sphereGeometry args={[0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.3, 0]} material={blue}>
              <cylinderGeometry args={[0.11, 0.14, 0.2, 14]} />
            </mesh>
            <mesh position={[0, 0.66, 0]} scale={[0.9, 1.12, 0.95]} material={blue}>
              <sphereGeometry args={[0.3, 24, 18]} />
            </mesh>
          </group>
          {/* Targeting reticle */}
          <group ref={reticle} position={[0, 0, 0.02]}>
            <mesh material={red}>
              <torusGeometry args={[0.13, 0.003, 6, 48]} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <group key={i} rotation-z={(i * Math.PI) / 2}>
                <mesh position={[0, 0.14, 0]} material={red}>
                  <boxGeometry args={[0.005, 0.04, 0.002]} />
                </mesh>
              </group>
            ))}
          </group>
          <primitive object={labels.title} position={[0, 0.19, 0]} />
          <primitive object={labels.reward} position={[0, -0.17, 0]} />
          {/* Invisible hit area so the whole hologram is easy to click */}
          <mesh visible={false}>
            <boxGeometry args={[0.32, 0.42, 0.1]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
