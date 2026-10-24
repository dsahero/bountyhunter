import { useEffect } from 'react';
import { audio } from './engine';
import { useSettings } from '../state/settings';
import { useExperience } from '../state/experience';

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

  useEffect(() => {
    if (phase === 'hub') audio.startAmbience();
    else if (phase === 'gate' || phase === 'title') audio.stopAmbience();
  }, [phase]);

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
