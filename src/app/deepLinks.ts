/**
 * Links straight to things, without the intro:
 *
 *   /cockpit                 the main computer
 *   /about /education /leadership /resume /contact
 *   /experience/<charge-id>  e.g. /experience/nswc
 *   /projects/<project-id>   e.g. /projects/dietre
 *   /skills/<skill>          e.g. /skills/python
 *   /achievements /guestbook
 *
 * "/" still plays the full intro. While you look around, the address bar
 * follows what's on screen, so any view can be copied and shared (the panels
 * have a Share link button too).
 */
import { useEffect } from 'react';
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { SECTION_KEYS, type SectionKey } from '../content/schema';
import { useHub } from '../state/hub';
import { HUB_APPS, type HubApp } from '../state/hubView';
import { useExperience } from '../state/experience';
import { chronological } from '../hub/timeline';
import { track } from '../lib/analytics';

interface LinkTarget {
  station?: SectionKey;
  item?: string;
  app?: HubApp;
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

/** What a path points at, or null if it isn't a deep link ("/" or unknown). */
export function parsePath(pathname: string): LinkTarget | null {
  const [head, item] = pathname
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
  if (!head) return null;
  if (head === 'cockpit') return {};
  if ((HUB_APPS as readonly string[]).includes(head)) return { app: head as HubApp };
  if ((SECTION_KEYS as readonly string[]).includes(head))
    return { station: head as SectionKey, item: item ? slug(item) : undefined };
  return null;
}

/** The path for what's on screen now. */
export function pathFor(s = useHub.getState()): string {
  if (s.app) return `/${s.app}`;
  switch (s.station) {
    case null:
      return '/cockpit';
    case 'experience':
      return `/experience/${s.charge}`;
    case 'projects':
      return s.project ? `/projects/${s.project}` : '/projects';
    case 'skills':
      return `/skills/${encodeURIComponent(slug(s.associate))}`;
    default:
      return `/${s.station}`;
  }
}

/** A page title for what's on screen (shows in tabs and shared links). */
function titleFor(s = useHub.getState()) {
  const name = portfolio.identity.name;
  if (s.app) return `${lore.console[s.app]} | ${name}`;
  if (s.station === 'projects' && s.project) {
    const p = portfolio.propaganda.find((x) => x.id === s.project);
    if (p && !p.classified) return `${p.title} | ${name}`;
  }
  if (s.station) return `${lore.sections[s.station].real} | ${name}`;
  return `Bounty Hunter Cockpit | ${name}`;
}

/** Open what a link points at (in the hub). Unknown items fall back to their station. */
function openTarget(t: LinkTarget) {
  const hub = useHub.getState();
  if (t.app) return hub.openApp(t.app);
  if (!t.station) return;
  if (t.station === 'experience' && t.item) {
    const c = chronological().find((x) => x.id === t.item);
    if (c) return hub.selectCharge(c.id);
  }
  if (t.station === 'projects' && t.item) {
    const p = portfolio.propaganda.find((x) => x.id === t.item);
    if (p) return hub.selectProject(p.id);
  }
  if (t.station === 'skills' && t.item) {
    const a = portfolio.associates.find((x) => slug(x.skill) === t.item);
    if (a) hub.set({ unit: a.unit, associate: a.skill });
  }
  hub.open(t.station);
}

let pending: LinkTarget | null = null;

/**
 * On load: if the address is a deep link, skip the intro (just this once;
 * nothing is saved) and remember what to open once the cockpit is up.
 */
export function takeDeepLink() {
  const target = parsePath(location.pathname);
  if (!target) {
    if (location.pathname !== '/') history.replaceState(null, '', '/');
    return;
  }
  pending = target;
  useExperience.getState().jumpIn();
  track('deep_link', { path: location.pathname });
}

/**
 * While aboard: open any pending deep link, then keep the address bar (and
 * title) in step with what's on screen. Leaving the cockpit (replaying the
 * intro) puts the address back to "/".
 */
export function useUrlSync() {
  const phase = useExperience((s) => s.phase);
  useEffect(() => {
    if (phase !== 'hub') {
      if (!['/', '/dossier', '/recruiter'].includes(location.pathname))
        history.replaceState(null, '', '/');
      return;
    }
    // Let the cockpit settle on the console first, then open the link.
    const t = window.setTimeout(() => {
      if (pending) openTarget(pending);
      pending = null;
      sync();
    }, 60);
    const sync = () => {
      const path = pathFor();
      if (location.pathname !== path) history.replaceState(null, '', path);
      document.title = titleFor();
    };
    const unsubscribe = useHub.subscribe(sync);
    return () => {
      window.clearTimeout(t);
      unsubscribe();
    };
  }, [phase]);
}
