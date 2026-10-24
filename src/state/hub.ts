/**
 * Cockpit hub state: which station is open, and what's selected inside it.
 *
 * Opening a station turns the pilot's head toward it (via the look store) and
 * the camera zooms in; closing returns to the main computer. The 3D holograms
 * and the DOM panels both read this store, so selecting a charge in the panel
 * also highlights it on the star-map timeline, and vice versa.
 */
import { create } from 'zustand';
import {
  ANCHORS,
  EYE,
  GUITAR,
  HELMET_ON_SHELF,
  PROPS,
  type PropId,
  lookAtPoint,
  posterPoint,
  type StationId,
  type Vec3,
} from '../hub/layout';
import { chargeWorldPoint } from '../hub/timeline';
import { useLook } from './look';
import { portfolio } from '../content/portfolio';
import { caption, cue } from '../audio/cues';
import { useConsoleUi } from './consoleUi';
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
  /** A cockpit object being looked at closely (side panel), if any. */
  inspect: Inspectable | null;
  inspectItem: (item: Inspectable) => void;
  /** An active comms call (a contact from portfolio.site.contacts), if any. */
  /** `connected`: a holocall rings a few times before it's picked up. */
  call: { index: number; kind: 'voicemail' | 'cat'; connected: boolean } | null;
  /** Call a contact: voicemail, or (the cat) a holocall on the overhead projector. */
  startCall: (index: number) => void;
  hangUp: () => void;
  /** Holo off / on: every hologram in the cockpit powers down (or back up). */
  holoShutdown: () => void;
  holosOff: boolean;
  /**
   * What the overhead projector shows: the last overhead hologram you opened
   * (star map or leadership). It stays up after you close the panel, until
   * Holo off or you open the other one.
   */
  overhead: 'experience' | 'leadership' | null;
  /** Turn the head back onto whatever is selected (after a drag or zoom). Returns true if it moved. */
  recenter: () => boolean;
  set: (
    patch: Partial<
      Omit<
        HubState,
        | 'open'
        | 'close'
        | 'set'
        | 'back'
        | 'history'
        | 'startCall'
        | 'hangUp'
        | 'holoShutdown'
        | 'inspectItem'
        | 'recenter'
      >
    >,
  ) => void;
}

export type Inspectable = 'helmet' | 'guitar' | PropId;

/** Where each inspectable object is (world points). */
export const INSPECT_POINTS: Record<Inspectable, Vec3> = {
  helmet: HELMET_ON_SHELF.position,
  guitar: [GUITAR.position[0], GUITAR.position[1] + 0.06, GUITAR.position[2]],
  ...PROPS,
};

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

/** Rough size (radius, meters) of each inspectable thing, so the close-up frames it. */
/** How much room to leave around an inspected object (1 = it fills the view). */
const CLOSEUP_ROOM = 2.0;

const INSPECT_RADIUS: Partial<Record<Inspectable, number>> = { guitar: 0.6, helmet: 0.2 };

/**
 * Lens for a close look at an inspected object: narrow enough that it fills
 * the view (the camera zooms in; the object itself never grows).
 */
export function inspectFov(item: Inspectable, portrait: boolean) {
  const [x, y, z] = INSPECT_POINTS[item];
  const d = Math.hypot(x - EYE[0], y - EYE[1], z - EYE[2]);
  const r = INSPECT_RADIUS[item] ?? 0.11;
  // Frame the object with plenty of room around it (it fills about half the view).
  const fov = ((2 * Math.atan((r * CLOSEUP_ROOM) / d) * 180) / Math.PI) * (portrait ? 1.5 : 1);
  return Math.min(50, Math.max(18, fov));
}

/** The lens for what's on screen right now. */
export function currentFov(portrait: boolean) {
  const { station, inspect } = useHub.getState();
  if (inspect) return inspectFov(inspect, portrait);
  return targetFov(!!station, portrait);
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
    if (i >= 0) return posterPoint(i);
  }
  return ANCHORS[id];
}

/**
 * Where to point the head for a point of interest. On desktop the target is
 * centered in the part of the screen the panel leaves uncovered; in portrait
 * it sits in the top third (the panel is a bottom sheet).
 */
export function lookForPoint(point: Vec3, fov?: number) {
  const look = lookAtPoint(point);
  if (typeof window === 'undefined') return look;
  const aspect = window.innerWidth / window.innerHeight;
  const portrait = aspect < 1;
  const halfV = (((fov ?? targetFov(true, portrait)) / 2) * Math.PI) / 180;
  if (portrait) {
    // Put the target ~1/3 of the way down: look lower by that fraction of the half-height.
    return { ...look, pitch: look.pitch - Math.atan(Math.tan(halfV) * 0.35) };
  }
  // Center the target in the part of the screen the panel leaves uncovered.
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const offset = PANEL_FRACTION; // target at (1 - PANEL_FRACTION) / 2 across = this much of the half-width left of center
  return { ...look, yaw: look.yaw - Math.atan(Math.tan(halfH) * offset) };
}

/** Stations whose view is a hologram (Holo off closes them). */
const HOLO_STATIONS: StationId[] = ['about', 'education', 'experience', 'leadership', 'skills'];

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

/** A holocall rings this many times (this far apart, ms) before it's picked up. */
const CAT_RINGS = 3;
const RING_GAP = 2400;
const callTimers: number[] = [];

/** Turn the head toward a station; opening one plays a soft hologram boot-up. */
function turnTo(yaw: number, pitch: number, booting: boolean) {
  useLook.getState().focusOn(yaw, pitch);
  if (booting) cue('boot', portfolio.site.captions.boot);
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
  /** Show a view: set state and turn the head. Choosing anything else hangs up a call. */
  const show = (v: View, booting: boolean) => {
    if (get().call) get().hangUp();
    useConsoleUi.getState().set({ mode: 'menu' });
    if (get().inspect) set({ inspect: null });
    // Opening a hologram station powers the holograms back up.
    if (v.station && get().holosOff) set({ holosOff: false });
    if (v.station === 'experience' || v.station === 'leadership') set({ overhead: v.station });
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
    history: [],
    call: null,
    inspect: null,
    inspectItem: (item) => {
      if (get().call) get().hangUp();
      set({ station: null, history: [], inspect: item });
      const portrait = typeof window !== 'undefined' && window.innerWidth < window.innerHeight;
      const { yaw, pitch } = lookForPoint(INSPECT_POINTS[item], inspectFov(item, portrait));
      turnTo(yaw, pitch, false);
    },
    startCall: (index) => {
      const contact = portfolio.site.contacts[index];
      if (!contact) return;
      if (get().call) get().hangUp();
      if (contact.kind === 'cat') {
        set({ station: null, history: [], call: { index, kind: 'cat', connected: false } });
        // The comm rings a few times; then the cat picks up, the hologram
        // appears overhead, and the head turns up to it.
        const captions = portfolio.site.captions;
        for (let i = 0; i < CAT_RINGS; i++)
          callTimers.push(window.setTimeout(() => cue('ring', captions.ring), i * RING_GAP));
        callTimers.push(
          window.setTimeout(() => {
            if (get().call?.index !== index) return;
            set({ call: { index, kind: 'cat', connected: true } });
            cue('boot', captions.pickUp);
            const { yaw, pitch } = lookAtPoint(ANCHORS.experience);
            turnTo(yaw, pitch, false);
          }, CAT_RINGS * RING_GAP),
        );
      } else {
        set({ call: { index, kind: 'voicemail', connected: true } });
        cue('voicemail', portfolio.site.captions.voicemail);
        caption(`${contact.name}: ${portfolio.site.voicemail}`, 6000);
        window.setTimeout(() => {
          if (get().call?.index === index) set({ call: null });
        }, 6000);
      }
    },
    hangUp: () => {
      callTimers.splice(0).forEach((t) => window.clearTimeout(t));
      const wasCat = get().call?.kind === 'cat' && get().call?.connected;
      set({ call: null });
      if (wasCat) cue('holoOff', portfolio.site.captions.hangUp);
    },
    holosOff: false,
    overhead: null,
    holoShutdown: () => {
      const hub = get();
      if (hub.holosOff) {
        set({ holosOff: false });
        cue('boot', portfolio.site.captions.holoOn);
        return;
      }
      if (hub.call) hub.hangUp();
      if (hub.station && HOLO_STATIONS.includes(hub.station)) hub.close();
      set({ holosOff: true });
      cue('holoOff', portfolio.site.captions.holoOff);
    },
    recenter: () => {
      const { station, inspect } = get();
      const want = station
        ? lookForStation(station)
        : inspect
          ? lookForPoint(
              INSPECT_POINTS[inspect],
              inspectFov(inspect, window.innerWidth < window.innerHeight),
            )
          : consoleLook();
      const look = useLook.getState();
      const off =
        Math.abs(Math.atan2(Math.sin(look.yaw - want.yaw), Math.cos(look.yaw - want.yaw))) +
        Math.abs(look.pitch - want.pitch);
      if (off < 0.02 && look.zoom === 0) return false;
      look.focusOn(want.yaw, want.pitch);
      return true;
    },
    open: (id) => {
      if (get().station !== id) remember();
      show({ ...view(), station: id }, true);
    },
    close: () => {
      set({ history: [], inspect: null });
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
