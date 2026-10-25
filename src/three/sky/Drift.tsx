/**
 * Makes a sky object (planet, moon, galaxy) drift backward past the ship,
 * like the stars, once you're aboard. It slides out past the canopy's edges
 * and behind you, then reappears far ahead, small, and comes back around.
 *
 * During the intro the object sits still at its `intro` spot (the shots are
 * framed around it). Once the camera is in the cockpit it starts drifting
 * from exactly that spot, so nothing jumps between the exterior and interior.
 */
import { useRef } from 'react';
import { useFrame, type Camera } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../lib/reducedMotion';
import { cruise } from './motion';

/** True once the camera is on the cockpit set (the flyby happens 10 km away). */
const isAboard = (camera: Camera) => camera.position.lengthSq() < 1e4;

type V3 = readonly [number, number, number];

/** Behind this (meters, +Z) an object respawns far ahead. */
const BEHIND = 420;
const FAR = -1150;

export function Drift({
  intro,
  aboard = intro,
  speed = 7,
  clearance = 60,
  children,
}: {
  intro: V3;
  aboard?: V3;
  /** Meters per second at full cruise (all objects move alike: real parallax). */
  speed?: number;
  /**
   * How far off the ship's path (meters, sideways) the object's center must
   * pass. Set it well above the object's radius so it sweeps wide of the
   * ship and never cuts through the cockpit.
   */
  clearance?: number;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const was = useRef(false);
  /** This pass: where it started (z), and its sideways offset then and at its closest. */
  const pass = useRef({ z0: 0, from: new THREE.Vector2(), to: new THREE.Vector2() });
  const reduced = useReducedMotion();

  /** Plan a pass from (x, y, z): ease sideways out to the clearance by the time it's alongside. */
  const plan = (x: number, y: number, z: number) => {
    const p = pass.current;
    p.z0 = Math.min(z, -1);
    p.from.set(x, y);
    const side = p.from.length();
    p.to.copy(side > 1e-3 ? p.from : p.to.set(1, 0)).setLength(Math.max(side, clearance));
  };

  useFrame(({ camera }, dt) => {
    const g = group.current;
    if (!g) return;
    if (!isAboard(camera)) {
      g.position.set(...intro);
      was.current = false;
      return;
    }
    if (!was.current) {
      g.position.set(...aboard);
      plan(...aboard);
      was.current = true;
    }
    g.position.z += speed * (reduced ? 0.25 : 1) * (0.5 + 0.5 * cruise.current) * Math.min(dt, 0.1);
    const p = pass.current;
    // Sideways: from where it started, out to the clearance by the time it's level (z = 0).
    const t = THREE.MathUtils.smoothstep(g.position.z, p.z0, 0);
    g.position.x = THREE.MathUtils.lerp(p.from.x, p.to.x, t);
    g.position.y = THREE.MathUtils.lerp(p.from.y, p.to.y, t);
    if (g.position.z > BEHIND + clearance) {
      // Far ahead again, somewhere off-center (never dead ahead).
      const a = Math.random() * Math.PI * 2;
      const r = Math.max(clearance, (0.18 + Math.random() * 0.3) * -FAR);
      g.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.6, FAR);
      plan(g.position.x, g.position.y, FAR);
    }
  });

  return <group ref={group}>{children}</group>;
}
