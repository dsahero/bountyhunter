import { useSyncExternalStore } from 'react';
import { useSettings } from '../state/settings';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSystemPreference() {
  return typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches;
}

/** Whether the operating system asks for reduced motion (ignores the in-app setting). */
export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSystemPreference, () => false);
}

/**
 * True when motion should be minimized. The in-app setting wins over the
 * OS setting, so a user can opt in or out either way.
 */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, getSystemPreference, () => false);
  const setting = useSettings((s) => s.reducedMotion);
  return setting === 'system' ? system : setting === 'on';
}
