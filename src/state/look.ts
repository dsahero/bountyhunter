/**
 * Where the seated hunter is looking (radians) and how far they're zoomed.
 *
 * The camera rig eases toward `yaw`/`pitch` every frame. Two kinds of input
 * set them:
 *   - focusOn: the hub turning the head to a station or the console. This
 *     also records the `anchor`, i.e. what the pilot is "supposed" to be
 *     looking at.
 *   - nudge: free-look by dragging. The anchor stays put, so the arrow keys
 *     can snap the view back to it (refocus).
 * Yaw 0 faces forward; ±π faces the cargo hold behind the seat.
 */
import { create } from 'zustand';

export const LOOK_LIMITS = { pitchUp: 1.0, pitchDown: -0.95 } as const;
/** Zoom: -1 = pulled all the way back, 0 = normal, 1 = zoomed all the way in. */
export const ZOOM_LIMITS = { min: -1, max: 1 } as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap = (yaw: number) => Math.atan2(Math.sin(yaw), Math.cos(yaw));

interface LookState {
  yaw: number;
  pitch: number;
  zoom: number;
  anchor: { yaw: number; pitch: number };
  focusOn: (yaw: number, pitch: number) => void;
  nudge: (dYaw: number, dPitch: number) => void;
  /** Snap back to the anchor if the view was dragged away. Returns true if it moved. */
  refocus: () => boolean;
  zoomBy: (delta: number) => void;
  /** Back-compat: same as focusOn. */
  lookAt: (yaw: number, pitch: number) => void;
}

export const useLook = create<LookState>((set, get) => ({
  yaw: 0,
  pitch: 0,
  zoom: 0,
  anchor: { yaw: 0, pitch: 0 },
  focusOn: (yaw, pitch) => {
    const v = { yaw: wrap(yaw), pitch: clamp(pitch, LOOK_LIMITS.pitchDown, LOOK_LIMITS.pitchUp) };
    set({ ...v, anchor: v, zoom: 0 });
  },
  lookAt: (yaw, pitch) => get().focusOn(yaw, pitch),
  nudge: (dYaw, dPitch) =>
    set({
      yaw: wrap(get().yaw + dYaw),
      pitch: clamp(get().pitch + dPitch, LOOK_LIMITS.pitchDown, LOOK_LIMITS.pitchUp),
    }),
  refocus: () => {
    const { yaw, pitch, anchor } = get();
    const off = Math.abs(wrap(yaw - anchor.yaw)) + Math.abs(pitch - anchor.pitch);
    if (off < 0.02) return false;
    set({ yaw: anchor.yaw, pitch: anchor.pitch });
    return true;
  },
  zoomBy: (delta) => set({ zoom: clamp(get().zoom + delta, ZOOM_LIMITS.min, ZOOM_LIMITS.max) }),
}));
