/**
 * The seated first-person camera.
 *
 * Every frame the camera eases toward the target in the `look` store, then
 * *settles*: once it's within a hair of the target it snaps exactly onto it
 * and stops changing, so nothing on screen creeps or dips while you're still.
 *
 * Input:
 *   - drag (mouse or touch) to look around (free-look; arrows snap back)
 *   - mouse wheel, two-finger pinch, or +/- to zoom. Zooming in narrows the
 *     lens; zooming out pulls the eye back, widening the perspective
 *   - opening a station turns the head there (and resets the zoom)
 *
 * The hunter's head isn't a tripod: a slow breathing bob (off under reduced
 * motion), plus a shake when the hull rumbles during the attack.
 *
 * Runs at useFrame priority -1 and refreshes the camera matrices itself, so
 * everything that reads the camera this frame sees its final position.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLook } from '../../state/look';
import { consoleLook, currentFov, useHub } from '../../state/hub';
import { useReducedMotion } from '../../lib/reducedMotion';
import { EYE } from '../../hub/layout';
import { rumbleAt } from '../../hub/rumble';

const DRAG_SPEED = 0.0055;
const SETTLE = 1e-4;
/** How far the eye pulls back at full zoom-out (meters), and the lens range. */
const DOLLY = 0.32;

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const dom = useThree((s) => s.gl.domElement);
  const reduced = useReducedMotion();
  const current = useRef({ yaw: 0, pitch: 0, zoom: 0 });
  const forward = useRef(new THREE.Vector3()).current;

  // Adopt the current orientation, then settle on the main computer (or the open station).
  useEffect(() => {
    camera.up.set(0, 1, 0);
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    current.current = { yaw: e.y, pitch: e.x, zoom: 0 };
    const station = useHub.getState().station;
    if (station) useHub.getState().open(station);
    else {
      const { yaw, pitch } = consoleLook();
      useLook.getState().focusOn(yaw, pitch);
    }
  }, [camera]);

  // Drag to look, pinch to zoom.
  useEffect(() => {
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture(e.pointerId);
      dom.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      const last = pointers.get(e.pointerId);
      if (!last) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()] as [
          { x: number; y: number },
          { x: number; y: number },
        ];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) useLook.getState().zoomBy((d - pinch) * 0.01);
        pinch = d;
        return;
      }
      // "Grab the world", like Street View: dragging right turns the view left.
      useLook
        .getState()
        .nudge((e.clientX - last.x) * DRAG_SPEED, (e.clientY - last.y) * DRAG_SPEED);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
      dom.style.cursor = 'grab';
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      useLook.getState().zoomBy(-e.deltaY * 0.004);
    };
    const keys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '+' || e.key === '=') useLook.getState().zoomBy(0.4);
      if (e.key === '-' || e.key === '_') useLook.getState().zoomBy(-0.4);
    };
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', keys);
    return () => {
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('wheel', wheel);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', keys);
    };
  }, [dom]);

  useFrame(({ size, clock }, dt) => {
    const target = useLook.getState();
    const c = current.current;
    const lambda = reduced ? 20 : 2.6;

    // Shortest way around, then settle exactly onto the target.
    const dYaw = Math.atan2(Math.sin(target.yaw - c.yaw), Math.cos(target.yaw - c.yaw));
    c.yaw =
      Math.abs(dYaw) < SETTLE ? target.yaw : THREE.MathUtils.damp(c.yaw, c.yaw + dYaw, lambda, dt);
    c.pitch =
      Math.abs(target.pitch - c.pitch) < SETTLE
        ? target.pitch
        : THREE.MathUtils.damp(c.pitch, target.pitch, lambda, dt);
    c.zoom =
      Math.abs(target.zoom - c.zoom) < SETTLE
        ? target.zoom
        : THREE.MathUtils.damp(c.zoom, target.zoom, 16, dt);

    // Lens: station zoom-in, then the user's zoom (in: narrower; out: a little wider).
    const base = currentFov(size.width < size.height);
    const fov = c.zoom >= 0 ? base * (1 - 0.45 * c.zoom) : base * (1 - 0.15 * c.zoom);
    const settledFov =
      Math.abs(camera.fov - fov) < 0.02 ? fov : THREE.MathUtils.damp(camera.fov, fov, lambda, dt);
    if (settledFov !== camera.fov) {
      camera.fov = settledFov;
      camera.updateProjectionMatrix();
    }

    // Breathing bob, and the hull's rumble.
    const t = clock.elapsedTime;
    const bob = reduced ? 0 : 1;
    const shake = reduced ? 0 : rumbleAt() * 0.012;
    const jitter = (f: number, p: number) => Math.sin(t * f + p) * Math.sin(t * f * 1.7 + p * 2);
    const bobPitch = bob * Math.sin(t * 1.25) * 0.004 + shake * jitter(37, 1);
    const bobYaw = bob * Math.sin(t * 0.62) * 0.003 + shake * jitter(31, 2);
    const bobRoll = bob * Math.sin(t * 0.62 + 1) * 0.002 + shake * jitter(41, 3) * 0.6;
    camera.rotation.set(c.pitch + bobPitch, c.yaw + bobYaw, bobRoll, 'YXZ');
    // Zooming out pulls the eye back along the view direction (perspective widens).
    const pull = c.zoom < 0 ? -c.zoom * DOLLY : 0;
    forward.set(0, 0, -1).applyEuler(camera.rotation);
    camera.position.set(EYE[0], EYE[1], EYE[2]).addScaledVector(forward, -pull);
    camera.position.y += bob * Math.sin(t * 1.25) * 0.004;
    camera.updateMatrixWorld();
  }, -1);

  return null;
}
