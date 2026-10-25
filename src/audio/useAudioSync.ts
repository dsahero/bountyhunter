import { useEffect } from 'react';
import { audio } from './engine';
import { useSettings } from '../state/settings';
import { useExperience } from '../state/experience';
import { portfolio } from '../content/portfolio';
import { useAttack, isEmergency } from '../hub/attack';
import { useCockpitMusic } from './useCockpitMusic';

/**
 * Keeps the audio engine in step with settings and the experience:
 * mute/volume, cockpit ambience once aboard, and a click on every control.
 * Returning visitors who left sound on are unlocked on their first gesture.
 */
export function useAudioSync() {
  const enabled = useSettings((s) => s.soundEnabled);
  const volume = useSettings((s) => s.volume);
  const phase = useExperience((s) => s.phase);

  useEffect(() => {
    audio.setEnabled(enabled);
    audio.setVolume(volume);
  }, [enabled, volume]);

  // Music: the crawl theme starts after the title card; "Continue" fades it
  // into the journey theme for the arrival. Aboard, music plays in idle-
  // triggered sets (useCockpitMusic). Your files in portfolio.site.audio
  // replace the placeholder synth.
  useEffect(() => {
    const files = portfolio.site.audio;
    if (phase === 'crawl') audio.music('crawl', files.crawl);
    else if (phase === 'arrival') audio.music('journey', files.arrival);
    else if (phase === 'hub') audio.startAmbience();
    else {
      audio.music(null);
      audio.stopAmbience();
    }
  }, [phase]);
  useCockpitMusic(phase === 'hub');

  const stage = useAttack((s) => s.stage);
  useEffect(() => {
    audio.alarm(isEmergency(stage) ? portfolio.site.audio.alarm : '');
  }, [stage]);

  useEffect(() => {
    const onGesture = (e: Event) => {
      if (useSettings.getState().soundEnabled) audio.unlock();
      const el = e.target as Element | null;
      if (e.type === 'pointerdown' && el?.closest('button, a')) audio.play('click');
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);
}
