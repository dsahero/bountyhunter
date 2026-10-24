/**
 * The hologram look: a translucent, additive shader with a bright fresnel
 * rim, drifting scanlines, a slow rolling scan band, and a faint flicker.
 *
 * Every hologram shares one time uniform (ticked by <HoloClock/>), and each
 * material has its own color and opacity so a station can "boot up" by
 * fading its holograms in.
 */
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';

export const HOLO_BLUE = '#5fd4ff';

const holoTime = { value: 0 };

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uJitter;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Glitch: now and then, thin horizontal slices of the hologram slip sideways.
    if (uJitter > 0.0) {
      float slice = floor(world.y * 60.0);
      float tick = floor(uTime * 12.0);
      float glitch = step(0.93, hash(slice + tick * 17.0));
      world.x += (hash(slice * 3.1 + tick) - 0.5) * 0.04 * uJitter * glitch;
      world.xyz += normalize((modelMatrix * vec4(normal, 0.0)).xyz) * sin(uTime * 50.0 + world.y * 90.0) * 0.0015 * uJitter;
    }
    vec4 mv = viewMatrix * world;
    vWorld = world.xyz;
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
    float lines = 0.65 + 0.35 * sin(vWorld.y * 520.0 - uTime * 8.0);
    float band = smoothstep(0.0, 0.03, fract(vWorld.y * 3.0 - uTime * 0.35)) *
                 (1.0 - smoothstep(0.03, 0.08, fract(vWorld.y * 3.0 - uTime * 0.35)));
    float flicker = 0.9 + 0.1 * sin(uTime * 41.0) * sin(uTime * 7.3);
    float alpha = (0.12 + rim * 0.9 + band * 0.5) * lines * flicker * uOpacity;
    gl_FragColor = vec4(uColor * (0.7 + rim * 0.8 + band), alpha);
  }
`;

/** `jitter` > 0 adds glitchy slice displacement and shimmer (for the target's hologram). */
export function makeHoloMaterial(
  color: THREE.ColorRepresentation = HOLO_BLUE,
  opacity = 1,
  jitter = 0,
) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uTime: holoTime,
      uJitter: { value: jitter },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export type HoloMaterial = ReturnType<typeof makeHoloMaterial>;

export function useHoloMaterial(color: THREE.ColorRepresentation = HOLO_BLUE, opacity = 1) {
  return useMemo(() => makeHoloMaterial(color, opacity), [color, opacity]);
}

/**
 * Eases a set of hologram materials toward a target opacity each frame:
 * the station "boots up" when selected and dims when you look away.
 */
export function useHoloFade(materials: HoloMaterial[], target: number, speed = 5) {
  useFrame((_, dt) => {
    for (const m of materials) {
      const u = m.uniforms.uOpacity!;
      u.value = THREE.MathUtils.damp(u.value, target, speed, dt);
    }
  });
}

/** Mount once inside the Canvas: advances the shared hologram clock. */
export function HoloClock() {
  useFrame((_, dt) => {
    holoTime.value += dt;
  });
  return null;
}
