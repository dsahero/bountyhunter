/**
 * A tiny performance readout for tuning: frames per second, draw calls,
 * triangles, and lights in the scene. Only shown with `?perf` in the URL.
 * The numbers are also kept on `window.__perf` so tests can read them.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const perfEnabled = () =>
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('perf');

interface Perf {
  fps: number;
  calls: number;
  triangles: number;
  lights: number;
  meshes: number;
  visibleMeshes: number;
}

export function PerfStats() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const box = useRef<HTMLDivElement | null>(null);
  const frames = useRef({ n: 0, t: performance.now() });

  useEffect(() => {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed',
      left: '8px',
      bottom: '8px',
      zIndex: '99',
      padding: '6px 8px',
      font: '12px monospace',
      color: '#7dff9a',
      background: 'rgba(0,0,0,0.7)',
      pointerEvents: 'none',
      whiteSpace: 'pre',
    });
    document.body.appendChild(el);
    box.current = el;
    return () => el.remove();
  }, []);

  // Count a whole frame (post-processing draws several passes, and the
  // renderer would otherwise reset its counters on each one).
  useEffect(() => {
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl]);
  const last = useRef({ calls: 0, triangles: 0 });

  useFrame(() => {
    // Runs before this frame draws: the counters hold the previous frame.
    last.current = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
    gl.info.reset();
    const f = frames.current;
    f.n++;
    const now = performance.now();
    if (now - f.t < 1000) return;
    let lights = 0;
    let meshes = 0;
    let visibleMeshes = 0;
    scene.traverse((o) => {
      if ((o as THREE.Light).isLight) lights++;
      if ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints) meshes++;
    });
    scene.traverseVisible((o) => {
      if ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints) visibleMeshes++;
    });
    const perf: Perf = {
      fps: Math.round((f.n * 1000) / (now - f.t)),
      calls: last.current.calls,
      triangles: last.current.triangles,
      lights,
      meshes,
      visibleMeshes,
    };
    (window as unknown as { __perf: Perf }).__perf = perf;
    if (box.current)
      box.current.textContent = `fps ${perf.fps}\ncalls ${perf.calls}\ntris ${perf.triangles}\nlights ${perf.lights}\nmeshes ${perf.visibleMeshes}/${perf.meshes}`;
    f.n = 0;
    f.t = now;
  });

  return null;
}
