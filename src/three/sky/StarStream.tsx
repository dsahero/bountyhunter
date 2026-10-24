/**
 * The star field, always slowly streaming backward past the ship as it
 * flies forward (-Z), and twinkling.
 *
 * Stars live in a big box around the viewer (the sky group follows the
 * camera) and their motion is computed on the GPU: each star's z is wrapped
 * with mod() so the field never runs out. Stars closer than NEAR fade away so
 * none ever whips past the canopy.
 *
 * They're drawn first and write no depth, so planets, ships, and the cockpit
 * always paint over them (stars are never in front of a planet).
 */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../lib/reducedMotion';
import { cruise } from './motion';

/** Meters per second at full cruise. */
const SPEED = 14;
const HALF = { x: 420, y: 320, z: 420 };
const NEAR = 70;

const vertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTravel;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vTint;
  void main() {
    vec3 p = position;
    // Stream toward +Z (behind the ship), wrapping around the box.
    p.z = mod(p.z + uTravel + ${HALF.z.toFixed(1)}, ${(HALF.z * 2).toFixed(1)}) - ${HALF.z.toFixed(1)};
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = length(p);
    // Fade near stars and the wrap seam at the box's ends.
    float near = smoothstep(${NEAR.toFixed(1)}, ${(NEAR * 1.8).toFixed(1)}, dist);
    float seam = 1.0 - smoothstep(${(HALF.z * 0.8).toFixed(1)}, ${HALF.z.toFixed(1)}, abs(p.z));
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 40.0);
    vAlpha = near * seam * twinkle;
    vTint = aSeed;
    gl_PointSize = clamp(aSize * uPixelRatio * (260.0 / -mv.z), 1.0, 3.5 * uPixelRatio);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  varying float vTint;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float core = smoothstep(0.5, 0.0, r);
    vec3 warm = vec3(1.0, 0.86, 0.72);
    vec3 cool = vec3(0.75, 0.86, 1.0);
    vec3 color = mix(cool, warm, step(0.7, vTint)) ;
    gl_FragColor = vec4(color * core * vAlpha, 1.0);
  }
`;

export function StarStream({ count }: { count: number }) {
  const reduced = useReducedMotion();
  const { points, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * HALF.x;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * HALF.y;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * HALF.z;
      seeds[i] = Math.random();
      sizes[i] = 0.6 + Math.pow(Math.random(), 4) * 2.4;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const uniforms = {
      uTravel: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      // Additive and opaque-pass: drawn first, no depth, so everything paints over it.
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      transparent: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = -100;
    return { points, uniforms };
  }, [count]);

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value = clock.elapsedTime;
    // Always drifting (the ship is always flying); faster at full cruise.
    const speed = (reduced ? SPEED * 0.25 : SPEED) * (0.5 + 0.5 * cruise.current);
    uniforms.uTravel.value = (uniforms.uTravel.value + speed * Math.min(dt, 0.1)) % (HALF.z * 2);
  });

  return <primitive object={points} />;
}
