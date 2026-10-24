/**
 * Cockpit hub state: which station is open, and what's selected inside it.
 *
 * Opening a station turns the pilot's head toward it (via the look store) and
 * the camera zooms in; closing returns to the main computer. The 3D holograms
 * and the DOM panels both read this store, so selecting a charge in the panel
 * also highlights it on the star-map timeline, and vice versa.
 */
import { create } from 'zustand';
import { ANCHORS, lookAtPoint, posterPoint, type StationId, type Vec3 } from '../hub/layout';
import { chargeWorldPoint } from '../hub/timeline';
import { useLook } from './look';
import { portfolio } from '../content/portfolio';
import { cue } from '../audio/cues';
import { chronological } from '../hub/timeline';
import type { Associate } from '../content/schema';

export type Unit = Associate['unit'];

interface HubState {
  station: StationId | null;
  /** Experience: selected charge id (shared by the panel and the timeline). */
  charge: string;
  /** Known associates: current unit and selected skill. */
  unit: Unit;
  associate: string;
  /** Propaganda: selected project id (null = wall overview). */
  project: string | null;
  /** The contract briefing types out once per visit. */
  contractShown: boolean;
  open: (id: StationId) => void;
  close: () => void;
  /** Select a charge; with Experience open, the head turns to its planet. */
  selectCharge: (id: string) => void;
  /** Select a project (or null for the wall); the head turns to its poster. */
  selectProject: (id: string | null) => void;
  /** Go back one step (Backspace / ◂ Back); from the first step, back to the console. */
  back: () => void;
  /** Views visited before the current one, most recent last. */
  history: View[];
  set: (patch: Partial<Omit<HubState, 'open' | 'close' | 'set' | 'back' | 'history'>>) => void;
}

/** What's on screen: the station plus anything selected inside it. */
interface View {
  station: StationId | null;
  charge: string;
  project: string | null;
}

/** Vertical field of view: wide at the console, zoomed in when a station is open. */
export function targetFov(stationOpen: boolean, portrait: boolean) {
  if (portrait) return stationOpen ? 60 : 82;
  return stationOpen ? 42 : 62;
}

/** Fraction of the screen width the station panel covers on desktop (see panels.css). */
export const PANEL_FRACTION = 0.56;

/** The posters, in wall order (classified last). */
export function posterOrder() {
  return [...portfolio.propaganda].sort((a, b) => Number(a.classified) - Number(b.classified));
}

/** The exact thing to look at for a station, given what's selected in it. */
function focusPoint(id: StationId, state: Pick<HubState, 'charge' | 'project'>): Vec3 {
  if (id === 'experience') return chargeWorldPoint(state.charge);
  if (id === 'projects' && state.project) {
    const i = posterOrder().findIndex((p) => p.id === state.project);
    if (i >= 0) return posterPoint(i, posterOrder().length);
  }
  return ANCHORS[id];
}

/**
 * Where to point the head for a point of interest. On desktop the target is
 * centered in the part of the screen the panel leaves uncovered; in portrait
 * it sits in the top third (the panel is a bottom sheet).
 */
export function lookForPoint(point: Vec3) {
  const look = lookAtPoint(point);
  if (typeof window === 'undefined') return look;
  const aspect = window.innerWidth / window.innerHeight;
  const portrait = aspect < 1;
  const halfV = ((targetFov(true, portrait) / 2) * Math.PI) / 180;
  if (portrait) {
    // Put the target ~1/3 of the way down: look lower by that fraction of the half-height.
    return { ...look, pitch: look.pitch - Math.atan(Math.tan(halfV) * 0.35) };
  }
  // Center the target in the part of the screen the panel leaves uncovered.
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const offset = PANEL_FRACTION; // target at (1 - PANEL_FRACTION) / 2 across = this much of the half-width left of center
  return { ...look, yaw: look.yaw - Math.atan(Math.tan(halfH) * offset) };
}

/** Stations shown entirely in-world (no side panel), so they're centered. */
export const IN_WORLD_STATIONS: StationId[] = ['leadership'];

export function lookForStation(id: StationId) {
  const point = focusPoint(id, useHub.getState());
  return IN_WORLD_STATIONS.includes(id) ? lookAtPoint(point) : lookForPoint(point);
}

export function consoleLook() {
  return lookAtPoint(ANCHORS.console);
}

const firstAssociate = portfolio.associates[0]!;

/** Turn the head toward a station; opening one plays a soft hologram boot-up. */
function turnTo(yaw: number, pitch: number, booting: boolean) {
  useLook.getState().lookAt(yaw, pitch);
  if (booting) cue('boot', '[Hologram powers up]');
}

export const useHub = create<HubState>((set, get) => {
  const view = (): View => ({
    station: get().station,
    charge: get().charge,
    project: get().project,
  });
  /** Remember the current view before changing it (skipping exact repeats). */
  const remember = () => {
    const v = view();
    const last = get().history.at(-1);
    if (
      last &&
      last.station === v.station &&
      last.charge === v.charge &&
      last.project === v.project
    )
      return;
    set({ history: [...get().history, v] });
  };
  /** Show a view: set state and turn the head. */
  const show = (v: View, booting: boolean) => {
    set({ station: v.station, charge: v.charge, project: v.project });
    const { yaw, pitch } = v.station ? lookForStation(v.station) : consoleLook();
    turnTo(yaw, pitch, booting && !!v.station);
  };

  return {
    station: null,
    charge: chronological()[0]!.id,
    unit: firstAssociate.unit,
    associate: firstAssociate.skill,
    project: null,
    contractShown: false,
    history: [],
    open: (id) => {
      if (get().station !== id) remember();
      show({ ...view(), station: id }, true);
    },
    close: () => {
      set({ history: [] });
      show({ ...view(), station: null, project: null }, false);
    },
    selectCharge: (id) => {
      remember();
      show({ ...view(), station: 'experience', charge: id }, get().station !== 'experience');
    },
    selectProject: (id) => {
      remember();
      show({ ...view(), station: 'projects', project: id }, get().station !== 'projects');
    },
    back: () => {
      const history = get().history;
      const previous = history.at(-1);
      if (!previous || !previous.station) return get().close();
      set({ history: history.slice(0, -1) });
      show(previous, false);
    },
    set: (patch) => set(patch),
  };
});
