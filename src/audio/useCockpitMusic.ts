/**
 * Background music aboard, played in sets rather than nonstop:
 *
 *   - It waits until you've been idle for a few seconds (no clicks, keys, or
 *     scrolling), then fades in.
 *   - After a few minutes it fades out, rests for half a minute, and starts
 *     again.
 *   - During the attack it cuts out; it resumes once the lights are back.
 *
 * The track is your cockpit file if portfolio.site.audio names one, else the
 * arrival track (file or placeholder synth).
 */
import { useEffect } from 'react';
import { audio } from './engine';
import { portfolio } from '../content/portfolio';
import { useAttack, isEmergency } from '../hub/attack';

export const COCKPIT_MUSIC = { idleSeconds: 6, playSeconds: 180, restSeconds: 30 } as const;

export function useCockpitMusic(aboard: boolean) {
  const stage = useAttack((s) => s.stage);
  const quiet = isEmergency(stage) || stage === 'incoming';

  useEffect(() => {
    if (!aboard) return;
    // Coming aboard, or the attack starting: whatever was playing fades out.
    audio.music(null);
    if (quiet) return;

    const files = portfolio.site.audio;
    let timer = 0;
    let waiting = true; // for the first idle stretch

    const startSet = () => {
      waiting = false;
      if (files.cockpit) audio.music('cockpit', files.cockpit);
      else audio.music('journey', files.arrival);
      timer = window.setTimeout(endSet, COCKPIT_MUSIC.playSeconds * 1000);
    };
    const endSet = () => {
      audio.music(null);
      timer = window.setTimeout(startSet, COCKPIT_MUSIC.restSeconds * 1000);
    };
    const waitForIdle = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(startSet, COCKPIT_MUSIC.idleSeconds * 1000);
    };
    // Any activity pushes the first set back until things go quiet.
    const onActivity = () => {
      if (waiting) waitForIdle();
    };

    waitForIdle();
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [aboard, quiet]);
}
