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
import { PerfStats, perfEnabled } from './fx/PerfStats';

export default function Stage({ tier }: { tier: Tier }) {
  const phase = useExperience((s) => s.phase);
  const [showPerf] = useState(perfEnabled);
  const maxDpr = tier === 'high' ? 2 : 1.5;
  // Resolution adapts to the device: start a little under the screen's
  // density, step up while frames are comfortably fast, back down if not.
  const ceiling = Math.min(window.devicePixelRatio, maxDpr);
  const [dpr, setDpr] = useState(Math.min(ceiling, 1.5));

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
        <PerformanceMonitor
          onIncline={() => setDpr((d) => Math.min(ceiling, d + 0.25))}
          onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
        />
        <HoloClock />
        <Sky tier={tier} />
        <Cockpit tier={tier} showHelmet={phase === 'hub'} />
        {phase === 'hub' ? <CameraRig /> : <Arrival started={phase === 'arrival'} />}
        {tier === 'high' ? <Effects /> : <OutlineOnly />}
        {showPerf && <PerfStats />}
      </Selection>
    </Canvas>
  );
}
