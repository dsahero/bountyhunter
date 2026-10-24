/**
 * Deep space: stars, the homeworld Charlotsleve with its two moons, and the
 * sun's light.
 *
 * The whole sky group follows the camera every frame (the classic skybox
 * trick), so it reads as infinitely far away and looks identical from the
 * flyby location and from inside the cockpit. That's what lets the intro
 * move between the two without the backdrop jumping.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { portfolio } from '../../content/portfolio';
import type { Tier } from '../../lib/quality';
import { Traffic } from './Traffic';
import { StarStream } from './StarStream';
import { DistantWorlds } from './DistantWorlds';
import { cruise } from './motion';

/** Direction from the viewer toward the planet: ahead and below, like the film's opening. */
export const PLANET_DIR = new THREE.Vector3(0.15, -0.55, -1).normalize();
export const SUN_POSITION = new THREE.Vector3(-80, 45, -30);

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
    gl_FragColor = vec4(uColor, rim);
  }
`;

export function Sky({ tier, cruising }: { tier: Tier; cruising: boolean }) {
  const group = useRef<THREE.Group>(null);
  const backdrop = useRef<THREE.Group>(null);
  const { planet } = portfolio.education;

  const atmosphere = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uColor: { value: new THREE.Color('#ffae70') } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(({ camera }, dt) => {
    group.current?.position.copy(camera.position);
    // The far stars drift slowly past too (much slower than the near stream: parallax).
    if (backdrop.current) backdrop.current.rotation.x += dt * 0.004 * cruise.current;
  });

  // Everything sits inside the star sphere (radius 300+), so stars are always behind.
  const planetPos = PLANET_DIR.clone().multiplyScalar(250);
  return (
    <>
      <color attach="background" args={['#010208']} />
      <directionalLight position={SUN_POSITION} color="#fff1dc" intensity={2.4} />
      <group ref={group}>
        <group ref={backdrop}>
          <Stars
            radius={300}
            depth={80}
            count={tier === 'high' ? 7000 : 3000}
            factor={7}
            fade
            speed={0.4}
          />
        </group>
        <group position={planetPos}>
          <mesh rotation-z={0.3}>
            <sphereGeometry args={[120, 96, 64]} />
            <meshStandardMaterial color={planet.color} roughness={1} />
          </mesh>
          <mesh material={atmosphere} scale={1.03}>
            <sphereGeometry args={[120, 96, 64]} />
          </mesh>
        </group>
        <Traffic />
        <DistantWorlds />
        {cruising && <StarStream count={tier === 'high' ? 260 : 120} />}
        {/* Two moons, as in the film's first frame */}
        <mesh position={[-87, -20, -250]}>
          <sphereGeometry args={[9, 32, 24]} />
          <meshStandardMaterial color="#b9a58c" roughness={1} />
        </mesh>
        <mesh position={[-55, -7, -283]}>
          <sphereGeometry args={[5, 32, 24]} />
          <meshStandardMaterial color="#8f9aa6" roughness={1} />
        </mesh>
      </group>
    </>
  );
}
