/**
 * Where the seated hunter is looking, in radians.
 *
 * The camera rig eases toward this target every frame. Drag, arrow keys, and
 * station buttons all just set the target, so they never fight.
 * Yaw 0 faces forward; ±π faces the cargo hold behind the seat.
 */
import { create } from 'zustand';

export const LOOK_LIMITS = { pitchUp: 1.0, pitchDown: -0.95 } as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface LookState {
  yaw: number;
  pitch: number;
  lookAt: (yaw: number, pitch: number) => void;
  nudge: (dYaw: number, dPitch: number) => void;
}

export const useLook = create<LookState>((set, get) => ({
  yaw: 0,
  pitch: 0,
  lookAt: (yaw, pitch) =>
    set({
      // Keep yaw in (-π, π]; the camera rig turns the shortest way around.
      yaw: Math.atan2(Math.sin(yaw), Math.cos(yaw)),
      pitch: clamp(pitch, LOOK_LIMITS.pitchDown, LOOK_LIMITS.pitchUp),
    }),
  nudge: (dYaw, dPitch) => get().lookAt(get().yaw + dYaw, get().pitch + dPitch),
}));
