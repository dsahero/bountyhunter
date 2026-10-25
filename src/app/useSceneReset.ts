/**
 * Every time the scene changes (gate -> title -> crawl -> arrival -> cockpit,
 * or back to the start with Replay intro), whatever belongs to the previous
 * scene stops: calls (and the cat's meows), voicemail voices, the attack and
 * its alarm, and captions still on screen. Music is handed over per scene by
 * useAudioSync / useCockpitMusic, so two tracks never overlap.
 */
import { useEffect, useRef } from 'react';
import { useExperience } from '../state/experience';
import { useHub } from '../state/hub';
import { useAttack } from '../hub/attack';
import { useCaptions } from '../audio/cues';
import { audio } from '../audio/engine';

export function useSceneReset() {
  const phase = useExperience((s) => s.phase);
  const previous = useRef(phase);
  useEffect(() => {
    if (previous.current === phase) return;
    previous.current = phase;
    const hub = useHub.getState();
    if (hub.call) hub.hangUp();
    audio.hush();
    if (useAttack.getState().stage !== 'idle') useAttack.getState().reset();
    audio.alarm('');
    useCaptions.setState({ items: [] });
  }, [phase]);
}
