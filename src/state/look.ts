/**
 * Where the seated hunter is looking (radians) and how far they're zoomed.
 *
 * The camera rig eases toward `yaw`/`pitch` every frame. Two kinds of input
 * set them:
 *   - focusOn: the hub turning the head to a station or the console (this
 *     also resets the zoom).
 *   - nudge: free-look by dragging (the arrow keys bring the view back onto
 *     what's selected; see useHub.recenter).
 * Yaw 0 faces forward; ±π faces the cargo hold behind the seat.
 */
import { create } from 'zustand';
import { unlockAchievement } from './achievements';

const LOOK_LIMITS = { pitchUp: 1.0, pitchDown: -0.95 } as const;
/** Zoom: -1 = pulled all the way back, 0 = normal, 1 = zoomed all the way in. */
const ZOOM_LIMITS = { min: -1, max: 1 } as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap = (yaw: number) => Math.atan2(Math.sin(yaw), Math.cos(yaw));

interface LookState {
  yaw: number;
  pitch: number;
  zoom: number;
  focusOn: (yaw: number, pitch: number) => void;
  nudge: (dYaw: number, dPitch: number) => void;
  zoomBy: (delta: number) => void;
}

export const useLook = create<LookState>((set, get) => ({
  yaw: 0,
  pitch: 0,
  zoom: 0,
  focusOn: (yaw, pitch) => {
    const v = { yaw: wrap(yaw), pitch: clamp(pitch, LOOK_LIMITS.pitchDown, LOOK_LIMITS.pitchUp) };
    set({ ...v, zoom: 0 });
  },
  nudge: (dYaw, dPitch) => {
    set({
      yaw: wrap(get().yaw + dYaw),
      pitch: clamp(get().pitch + dPitch, LOOK_LIMITS.pitchDown, LOOK_LIMITS.pitchUp),
    });
    // Looking right round, into the cargo hold behind the seat.
    if (Math.abs(get().yaw) > 2.4) unlockAchievement('six');
  },
  zoomBy: (delta) => set({ zoom: clamp(get().zoom + delta, ZOOM_LIMITS.min, ZOOM_LIMITS.max) }),
}));
