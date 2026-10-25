/**
 * Projects station: rebel propaganda posters pasted up in the cargo hold
 * behind the pilot's seat (slots in hub/layout.ts), each stirring in the air
 * from the vents, with a light sweep now and then and the project's media
 * (image or looping video) playing in its window. Click a poster to play its
 * "intercepted transmission" (the panel).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHub } from '../../state/hub';
import { posterOrder } from '../../state/hubView';
import { useUnlocks } from '../../state/unlocks';
import { CARGO_DOOR, POSTER_SIZE, posterSlot } from '../../hub/layout';
import type { Propaganda } from '../../content/schema';
import { MEDIA_RECT, POSTER_PX, makePosterTexture } from './posters';
import { useReducedMotion } from '../../lib/reducedMotion';
import { CabinLight } from '../scenes/Cockpit/cabinLight';
import { useClickable } from './common';
import { isVideo } from '../../lib/media';

type Placement = { position: readonly [number, number, number]; rotationY: number };

/** A project's media as a texture: a muted looping video, or an image. */
function useMediaTexture(media: Propaganda['media'][number] | undefined) {
  const texture = useMemo(() => {
    if (!media) return null;
    if (isVideo(media.src)) {
      const video = document.createElement('video');
      Object.assign(video, { src: media.src, muted: true, loop: true, playsInline: true });
      video.setAttribute('playsinline', '');
      if (media.still) video.poster = media.still;
      void video.play().catch(() => undefined);
      const t = new THREE.VideoTexture(video);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    const t = new THREE.TextureLoader().load(media.src);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [media]);
  useEffect(
    () => () => {
      const img = texture?.image as HTMLVideoElement | undefined;
      img?.pause?.();
      texture?.dispose();
    },
    [texture],
  );
  return texture;
}

/** The light sweep that glides across a poster now and then. */
const sweepMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uX: { value: -1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uX;
      varying vec2 vUv;
      void main() {
        float band = 1.0 - smoothstep(0.0, 0.12, abs(vUv.x + vUv.y * 0.4 - uX));
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * band * 0.22, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

function Poster({ project, slot, index }: { project: Propaganda; slot: Placement; index: number }) {
  const selected = useHub((s) => s.project === project.id);
  const unlocked = useUnlocks((s) => s.classified);
  const locked = project.classified && !unlocked;
  const texture = useMemo(() => makePosterTexture(project, locked), [project, locked]);
  const media = useMediaTexture(locked ? undefined : project.media[0]);
  const sweep = useMemo(sweepMaterial, []);
  const reduced = useReducedMotion();
  const sway = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const click = useClickable(
    useMemo(
      () => () => {
        useHub.getState().selectProject(project.id);
      },
      [project.id],
    ),
  );
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + index * 1.7;
    if (glow.current)
      glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, selected ? 0.9 : 0, 6, dt);
    // Paper stirring in the air from the vents, and a light sweep every few seconds.
    if (sway.current && !reduced) sway.current.rotation.x = Math.sin(t * 0.9) * 0.025;
    sweep.uniforms.uX!.value = reduced ? -1 : ((t * 0.35) % 3.2) - 0.6;
  });

  // Media window: canvas px -> meters on the poster plane.
  const { w, h } = POSTER_SIZE;
  const mx = ((MEDIA_RECT.x + MEDIA_RECT.w / 2) / POSTER_PX.w - 0.5) * w;
  const my = (0.5 - (MEDIA_RECT.y + MEDIA_RECT.h / 2) / POSTER_PX.h) * h;
  const mw = (MEDIA_RECT.w / POSTER_PX.w) * w;
  const mh = (MEDIA_RECT.h / POSTER_PX.h) * h;

  return (
    <group position={slot.position} rotation-y={slot.rotationY}>
      {/* Selection glow behind the poster */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w + 0.06, h + 0.06]} />
        <meshBasicMaterial ref={glow} color="#5fd4ff" transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* Hinged at the top, so it stirs like paper */}
      <group position={[0, h / 2, 0]}>
        <group ref={sway}>
          <group position={[0, -h / 2, 0]} {...click}>
            <mesh>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial
                map={texture}
                roughness={0.9}
                emissive="#ffffff"
                emissiveMap={texture}
                emissiveIntensity={0.25}
              />
            </mesh>
            {media && (
              <mesh position={[mx, my, 0.001]}>
                <planeGeometry args={[mw, mh]} />
                <meshBasicMaterial map={media} toneMapped={false} />
              </mesh>
            )}
            <mesh position={[0, 0, 0.002]} material={sweep}>
              <planeGeometry args={[w, h]} />
            </mesh>
          </group>
        </group>
      </group>
      {/* A small work light above each poster */}
      <mesh position={[0, h / 2 + 0.035, 0.02]}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
        <meshBasicMaterial color="#ffcf90" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A sealed pressure door at the back of the hold, to the rest of the ship. */
function CargoDoor() {
  const [x, y, z] = CARGO_DOOR.position;
  const { width, height } = CARGO_DOOR;
  const mats = useMemo(
    () => ({
      frame: new THREE.MeshStandardMaterial({ color: '#3a3f46', metalness: 0.85, roughness: 0.35 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#6b6f74', metalness: 0.8, roughness: 0.4 }),
      stripe: new THREE.MeshStandardMaterial({ color: '#d9a020', roughness: 0.6 }),
      light: new THREE.MeshBasicMaterial({ color: '#ff5a3c', toneMapped: false }),
      trim: new THREE.MeshBasicMaterial({ color: '#ffb347', toneMapped: false }),
      panel: new THREE.MeshStandardMaterial({ color: '#15171a', metalness: 0.6, roughness: 0.5 }),
      ok: new THREE.MeshBasicMaterial({ color: '#7dff9a', toneMapped: false }),
    }),
    [],
  );
  return (
    <group position={[x, y, z - 0.01]} rotation-y={Math.PI}>
      {/* Frame */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(width / 2 + 0.05) * s, 0, 0.02]} material={mats.frame}>
          <boxGeometry args={[0.1, height + 0.1, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, height / 2 + 0.05, 0.02]} material={mats.frame}>
        <boxGeometry args={[width + 0.2, 0.1, 0.06]} />
      </mesh>
      {/* Two leaves with a center seam */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(width / 4 + 0.003) * s, 0, 0.01]} material={mats.leaf}>
          <boxGeometry args={[width / 2 - 0.006, height, 0.03]} />
        </mesh>
      ))}
      {/* Hazard stripes and a status light */}
      {[-0.7, 0.7].map((k) => (
        <mesh key={k} position={[0, (height / 2) * k, 0.03]} material={mats.stripe}>
          <boxGeometry args={[width - 0.02, 0.06, 0.005]} />
        </mesh>
      ))}
      {/* Glowing trim around the opening, so it reads as a door from the seat */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(width / 2 + 0.004) * s, 0, 0.055]} material={mats.trim}>
          <boxGeometry args={[0.012, height, 0.004]} />
        </mesh>
      ))}
      <mesh position={[0, height / 2 + 0.004, 0.055]} material={mats.trim}>
        <boxGeometry args={[width + 0.02, 0.012, 0.004]} />
      </mesh>
      {/* Door control panel and its lights */}
      <mesh position={[width / 2 + 0.05, 0.05, 0.06]} material={mats.panel}>
        <boxGeometry args={[0.07, 0.16, 0.02]} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0.1, 0.071]} material={mats.light}>
        <boxGeometry args={[0.03, 0.025, 0.004]} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0.04, 0.071]} material={mats.ok}>
        <boxGeometry args={[0.03, 0.025, 0.004]} />
      </mesh>
    </group>
  );
}

export function PropagandaWall() {
  const posters = useMemo(posterOrder, []);
  return (
    <group>
      {posters.map((p, i) => (
        <Poster key={p.id} project={p} slot={posterSlot(i)} index={i} />
      ))}
      <CabinLight position={[0, 1.9, 2.2]} color="#ffb060" intensity={5} distance={3.5} />
      <CargoDoor />
    </group>
  );
}
