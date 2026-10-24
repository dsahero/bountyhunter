/**
 * Dev-only: export the hunter (and their helmet) as a .glb for Blender.
 * Open /?export=hunter on the dev server; `node scripts/export-hunter.mjs`
 * does that headlessly and writes exports/hunter.glb.
 *
 * Every primitive stays its own object, named by body part, material, and
 * shape (e.g. "Head_hair_capsule_2"), grouped under the body-part pivots
 * (Spine, Neck, Head, UpperArm_L, Forearm_L, Hand_L, Leg_L, Knee_L, ...).
 * Materials keep their names (skin, hair, steel, ...).
 */
import { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Hunter, type HunterHandle } from '../three/scenes/Arrival/Hunter';
import { Helmet } from '../three/scenes/Cockpit/Helmet';
import { nameRig } from '../three/scenes/Arrival/hunterParts';

function Exporter({ hunter, helmet }: { hunter: React.RefObject<HunterHandle>; helmet: React.RefObject<THREE.Group> }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    // Let the rig settle into its rest pose for a few frames, then export.
    const t = window.setTimeout(() => {
      const h = hunter.current;
      if (!h || !helmet.current) return;
      nameRig(h.root, 'Hunter', true);
      nameRig(helmet.current, 'Helmet', true);
      const exporter = new GLTFExporter();
      exporter.parse(
        [h.root, helmet.current],
        (result) => {
          const bytes = new Uint8Array(result as ArrayBuffer);
          let bin = '';
          for (let i = 0; i < bytes.length; i += 0x8000)
            bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          (window as unknown as { __glb: string }).__glb = btoa(bin);
          document.title = 'exported';
        },
        (err) => console.error(err),
        { binary: true, onlyVisible: true },
      );
    }, 800);
    return () => window.clearTimeout(t);
  }, [scene, hunter, helmet]);
  return null;
}

export function ExportHunter() {
  const hunter = useRef<HunterHandle>(null);
  const helmet = useRef<THREE.Group>(null);
  return (
    <Canvas style={{ width: '100vw', height: '100vh' }} camera={{ position: [1.5, 1.4, -2.5] }}>
      <ambientLight />
      <directionalLight position={[2, 3, -2]} />
      <Hunter ref={hunter} />
      {/* The helmet, set beside the hunter (head height) so the face stays visible */}
      <Helmet ref={helmet} position={[0.6, 1.7, 0]} />
      <Exporter hunter={hunter} helmet={helmet} />
    </Canvas>
  );
}
