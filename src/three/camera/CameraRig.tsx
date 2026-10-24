/**
 * The seated first-person camera.
 *
 * Every frame the camera eases toward the target yaw/pitch in the `look`
 * store. Only two things move that target:
 *   - dragging (mouse or touch) on the canvas
 *   - opening a station from the console (the head turns to it), or Esc
 *     (back to the console)
 * Arrow keys and Enter drive the console UI, not the camera (see Hud).
 *
 * When a station is open, the lens zooms in so the hologram fills more of the
 * view.
 *
 * Why the console used to wobble: drei's <Html> positions the in-world menu
 * from the camera's matrices, but three.js only refreshes those during
 * render, i.e. *after* every useFrame. So the menu was always placed with
 * last frame's camera. This rig runs first (priority -1) and refreshes the
 * camera matrices itself, so the menu and the 3D scene always agree.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLook } from '../../state/look';
import { consoleLook, targetFov, useHub } from '../../state/hub';
import { useReducedMotion } from '../../lib/reducedMotion';
import { EYE } from '../../hub/layout';

const DRAG_SPEED = 0.0055;

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const dom = useThree((s) => s.gl.domElement);
  const reduced = useReducedMotion();
  const current = useRef({ yaw: 0, pitch: 0 });

  // Adopt the current orientation, then settle on the main computer (or the open station).
  useEffect(() => {
    camera.up.set(0, 1, 0);
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    current.current = { yaw: e.y, pitch: e.x };
    const station = useHub.getState().station;
    if (station) useHub.getState().open(station);
    else {
      const { yaw, pitch } = consoleLook();
      useLook.getState().lookAt(yaw, pitch);
    }
  }, [camera]);

  // Drag to look.
  useEffect(() => {
    let dragging = false;
    let last = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
      dom.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      // "Grab the world", like Street View: dragging right turns the view left.
      useLook
        .getState()
        .nudge((e.clientX - last.x) * DRAG_SPEED, (e.clientY - last.y) * DRAG_SPEED);
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      dragging = false;
      dom.style.cursor = 'grab';
    };
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      dom.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [dom]);

  useFrame(({ size }, dt) => {
    const target = useLook.getState();
    const c = current.current;
    const lambda = reduced ? 20 : 2.4;
    // Shortest way around: ease toward the nearest equivalent of the target angle.
    const delta = Math.atan2(Math.sin(target.yaw - c.yaw), Math.cos(target.yaw - c.yaw));
    c.yaw = THREE.MathUtils.damp(c.yaw, c.yaw + delta, lambda, dt);
    c.pitch = THREE.MathUtils.damp(c.pitch, target.pitch, lambda, dt);

    const fov = targetFov(!!useHub.getState().station, size.width < size.height);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, lambda, dt);
      camera.updateProjectionMatrix();
    }

    camera.position.set(EYE[0], EYE[1], EYE[2]);
    camera.rotation.set(c.pitch, c.yaw, 0, 'YXZ');
    camera.updateMatrixWorld();
  }, -1);

  return null;
}
