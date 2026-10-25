/**
 * Cockpit hub state: which station is open, and what's selected inside it.
 *
 * Opening a station turns the pilot's head toward it (via the look store) and
 * the camera zooms in; closing returns to the main computer. The 3D holograms
 * and the DOM panels both read this store, so selecting a charge in the panel
 * also highlights it on the star-map timeline, and vice versa.
 */
import { create } from 'zustand';
import { ANCHORS, PROPS, lookAtPoint, type StationId } from '../hub/layout';
import {
  INSPECT_POINTS,
  consoleLook,
  inspectFov,
  lookForPoint,
  lookForStation,
  posterOrder,
  type HubApp,
  type Inspectable,
} from './hubView';
import { useLook } from './look';
import { portfolio } from '../content/portfolio';
import { caption, cue } from '../audio/cues';
import { audio } from '../audio/engine';
import { useConsoleUi } from './consoleUi';
import { useAchievements, unlockAchievement } from './achievements';
import { track } from '../lib/analytics';
import { SECTION_KEYS } from '../content/schema';
import { chronological } from '../hub/timeline';
import type { Associate } from '../content/schema';

type Unit = Associate['unit'];

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
  /** A console app open in the side panel (from the menu's second page), if any. */
  app: HubApp | null;
  openApp: (app: HubApp) => void;
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
        | 'openApp'
        | 'recenter'
      >
    >,
  ) => void;
}

/** What's on screen: the station plus anything selected inside it. */
interface View {
  station: StationId | null;
  charge: string;
  project: string | null;
}

/** Stations whose view is a hologram (Holo off closes them). */
const HOLO_STATIONS: StationId[] = ['about', 'education', 'experience', 'leadership', 'skills'];

const firstAssociate = portfolio.associates[0]!;

/** A holocall rings this many times (this far apart, ms) before it's picked up. */
const CAT_RINGS = 3;
const VOICEMAIL_RINGS = 2;
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
    if (get().app) set({ app: null });
    // Opening a hologram station powers the holograms back up.
    if (v.station && get().holosOff) set({ holosOff: false });
    if (v.station === 'experience' || v.station === 'leadership') set({ overhead: v.station });
    set({ station: v.station, charge: v.charge, project: v.project });
    if (v.station) {
      useAchievements.getState().see('all-stations', v.station, SECTION_KEYS);
      if (v.station === 'resume') unlockAchievement('resume');
      track('open_station', { station: v.station });
    }
    if (v.station === 'projects' && v.project)
      useAchievements.getState().see(
        'all-posters',
        v.project,
        posterOrder().map((p) => p.id),
      );
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
    app: null,
    openApp: (app) => {
      if (get().call) get().hangUp();
      set({ station: null, history: [], inspect: null, app });
      // The panel opens beside the main computer; keep the screen in view.
      const { yaw, pitch } = lookForPoint(ANCHORS.console);
      turnTo(yaw, pitch, false);
    },
    inspectItem: (item) => {
      if (item === 'helmet') unlockAchievement('helmet');
      if (item in PROPS) useAchievements.getState().see('tchotchkes', item, Object.keys(PROPS));
      if (get().call) get().hangUp();
      set({ station: null, history: [], inspect: item, app: null });
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
            unlockAchievement('cat');
            cue('boot', captions.pickUp);
            const { yaw, pitch } = lookAtPoint(ANCHORS.experience);
            turnTo(yaw, pitch, false);
          }, CAT_RINGS * RING_GAP),
        );
      } else {
        // Rings twice, then the greeting (subtitled, in their voice), then the tone.
        set({ call: { index, kind: 'voicemail', connected: false } });
        const later = (ms: number, fn: () => void) =>
          callTimers.push(
            window.setTimeout(() => {
              if (get().call?.index === index) fn();
            }, ms),
          );
        const captions = portfolio.site.captions;
        for (let i = 0; i < VOICEMAIL_RINGS; i++)
          later(i * RING_GAP, () => cue('ring', captions.ring));
        let at = VOICEMAIL_RINGS * RING_GAP;
        later(at, () => set({ call: { index, kind: 'voicemail', connected: true } }));
        for (const line of contact.greeting ?? [portfolio.site.voicemail]) {
          const ms = Math.min(7000, Math.max(2600, 1400 + line.length * 55));
          later(at, () => {
            caption(`${contact.name}: “${line}”`, ms);
            audio.speak(contact.voice ?? 'human', (ms - 600) / 1000);
          });
          at += ms;
        }
        later(at, () => {
          cue('voicemail', captions.voicemail);
          unlockAchievement('voicemail');
          const everyone = portfolio.site.contacts.filter((c) => c.kind === 'voicemail');
          useAchievements.getState().see(
            'all-voicemails',
            contact.name,
            everyone.map((c) => c.name),
          );
        });
        later(at + 2400, () => set({ call: null }));
      }
    },
    hangUp: () => {
      callTimers.splice(0).forEach((t) => window.clearTimeout(t));
      audio.hush();
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
      unlockAchievement('holo-off');
      cue('holoOff', portfolio.site.captions.holoOff);
    },
    recenter: () => {
      const { station, inspect, app } = get();
      const want = station
        ? lookForStation(station)
        : app
          ? lookForPoint(ANCHORS.console)
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
      set({ history: [], inspect: null, app: null });
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
