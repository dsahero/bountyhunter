/**
 * The single WebGL canvas shared by the crawl, the arrival, and the hub.
 *
 * It mounts during the crawl (the text floats over its starfield) so the
 * arrival can begin with a tilt down instead of a cut. This module and
 * everything it imports is lazy-loaded as its own chunk, downloaded in the
 * background while the visitor is still at the gate.
 */
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { useExperience } from '../state/experience';
import type { Tier } from '../lib/quality';
import { Sky } from './sky/Sky';
import { Cockpit } from './scenes/Cockpit/Cockpit';
import { Arrival } from './scenes/Arrival/Arrival';
import { CameraRig } from './camera/CameraRig';
import { HoloClock } from './holo/holoMaterial';
import { Effects, OutlineOnly } from './fx/Effects';
import { Selection } from '@react-three/postprocessing';

export default function Stage({ tier }: { tier: Tier }) {
  const phase = useExperience((s) => s.phase);
  const maxDpr = tier === 'high' ? 2 : 1.5;
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, maxDpr));

  return (
    <Canvas
      className="stage"
      dpr={dpr}
      gl={{ antialias: tier === 'high', powerPreference: 'high-performance' }}
      camera={{ fov: 50, near: 0.02, far: 4000, position: [0, 0, -10000] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        // Hide only the pixels from assistive tech. The wrapper must stay visible:
        // the main computer's real HTML menu is mounted inside it.
        gl.domElement.setAttribute('aria-hidden', 'true');
      }}
    >
      {/* Drop resolution if the frame rate sags; never below 1x. */}
      <Selection>
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <HoloClock />
        <Sky tier={tier} />
        <Cockpit tier={tier} showHelmet={phase === 'hub'} />
        {phase === 'hub' ? <CameraRig /> : <Arrival started={phase === 'arrival'} />}
        {tier === 'high' ? <Effects /> : <OutlineOnly />}
      </Selection>
    </Canvas>
  );
}
