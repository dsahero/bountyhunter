/**
 * Deep space: stars, the orange homeworld with its moons, and the
 * sun's light.
 *
 * The whole sky group follows the camera every frame (the classic skybox
 * trick), so it reads as infinitely far away and looks identical from the
 * flyby location and from inside the cockpit. That's what lets the intro
 * move between the two without the backdrop jumping.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tier } from '../../lib/quality';
import { Traffic } from './Traffic';
import { StarStream } from './StarStream';
import { DistantWorlds } from './DistantWorlds';
import { cabinLevel } from '../scenes/Cockpit/cabinLight';
import { Drift } from './Drift';
import { earthCloudsTexture, orangeEarthTexture, plutoTexture } from '../procedural/planetTextures';

/** Direction from the viewer toward the planet: ahead and below, like the film's opening. */
const PLANET_DIR = new THREE.Vector3(0.15, -0.55, -1).normalize();
const SUN_POSITION = new THREE.Vector3(-80, 45, -30);

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

export function Sky({ tier }: { tier: Tier }) {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(
    () => ({ earth: orangeEarthTexture(), clouds: earthCloudsTexture(), pluto: plutoTexture() }),
    [],
  );
  const clouds = useRef<THREE.Mesh>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const homeworld = useRef<THREE.Mesh>(null);

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

  useFrame(({ camera, clock }, dt) => {
    group.current?.position.copy(camera.position);
    // The cabin goes dark in an emergency (the canopy's blast shutters, so to speak).
    if (sun.current) {
      sun.current.intensity = 2.4 * Math.max(0.08, cabinLevel(clock.elapsedTime));
    }
    // The homeworld turns, and its clouds a little faster.
    if (homeworld.current) homeworld.current.rotation.y += dt * 0.004;
    if (clouds.current) clouds.current.rotation.y += dt * 0.007;
  });

  // Stars are drawn first without depth, so the planets always paint over them.
  const planetPos = PLANET_DIR.clone().multiplyScalar(250).toArray();
  return (
    <>
      <color attach="background" args={['#010208']} />
      <directionalLight ref={sun} position={SUN_POSITION} color="#fff1dc" intensity={2.4} />
      <group ref={group}>
        {/* Stars stream slowly backward past the ship, always */}
        <StarStream count={tier === 'high' ? 7000 : 3000} />
        {/* Planets, moons, and galaxies drift back past the ship too, once aboard */}
        <Drift intro={planetPos} clearance={360}>
          {/* An orange Earth: continents, oceans, ice caps, and a cloud layer */}
          <group rotation-z={0.3}>
            <mesh ref={homeworld}>
              <sphereGeometry args={[120, 96, 64]} />
              <meshStandardMaterial map={textures.earth} roughness={0.9} />
            </mesh>
            <mesh ref={clouds} scale={1.012}>
              <sphereGeometry args={[120, 96, 64]} />
              <meshStandardMaterial
                map={textures.clouds}
                transparent
                depthWrite={false}
                roughness={1}
              />
            </mesh>
          </group>
          <mesh material={atmosphere} scale={1.03}>
            <sphereGeometry args={[120, 96, 64]} />
          </mesh>
        </Drift>
        <Traffic />
        <DistantWorlds />
        {/* Two moons, as in the film's first frame */}
        <Drift intro={[-87, -20, -250]}>
          <mesh>
            <sphereGeometry args={[9, 32, 24]} />
            <meshStandardMaterial color="#b9a58c" roughness={1} />
          </mesh>
        </Drift>
        {/* A small low-res Pluto */}
        <Drift intro={[-55, -7, -283]}>
          <mesh rotation={[0.2, -1.8, 0]}>
            <sphereGeometry args={[5, 24, 16]} />
            <meshStandardMaterial map={textures.pluto} roughness={1} />
          </mesh>
        </Drift>
      </group>
    </>
  );
}
