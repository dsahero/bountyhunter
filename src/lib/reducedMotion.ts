import { useSettings } from '../state/settings';

/**
 * True when motion should be minimized. This is a manual choice (start screen
 * or HUD); full motion is the default regardless of the OS setting.
 */
export function useReducedMotion(): boolean {
  return useSettings((s) => s.reducedMotion === 'on');
}
