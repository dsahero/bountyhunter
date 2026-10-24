import { useSettings } from '../state/settings';
import { useExperience } from '../state/experience';
import { LoadingBar } from './LoadingBar';
import { rewardText } from '../content/derived';
import { audio } from '../audio/engine';
import { useReducedMotion, useSystemReducedMotion } from '../lib/reducedMotion';

/**
 * "Click to enter". Browsers only allow audio to start after a user gesture,
 * so the gate doubles as the moment we ask whether sound should be on.
 */
export function StartGate() {
  const setSettings = useSettings((s) => s.set);
  const advance = useExperience((s) => s.advance);
  const systemReduced = useSystemReducedMotion();
  const reduced = useReducedMotion();

  const enter = (sound: boolean) => {
    setSettings({ soundEnabled: sound });
    // Browsers allow audio only after a gesture: this click is it.
    if (sound) audio.unlock();
    advance();
  };

  return (
    <section className="gate" aria-labelledby="gate-title">
      <p className="gate__kicker">Bounty Guild // Secure Contract Terminal</p>
      <h1 id="gate-title" className="gate__title">
        Incoming Contract
      </h1>
      <p className="gate__sub">
        Priority: Extreme · Target: Classified · Reward: {rewardText()} credits
      </p>
      <div className="gate__actions">
        <button className="btn" onClick={() => enter(true)} autoFocus>
          Enter with sound
        </button>
        <button className="btn btn--ghost" onClick={() => enter(false)}>
          Enter silently
        </button>
      </div>
      {systemReduced && (
        <p className="gate__motion">
          {reduced
            ? 'Your device asks for reduced motion, so the cinematic will play as still frames.'
            : 'Full motion is on, overriding your device’s reduced-motion setting.'}{' '}
          <button
            className="gate__motion-toggle"
            onClick={() => setSettings({ reducedMotion: reduced ? 'off' : 'on' })}
          >
            {reduced ? 'Play the full cinematic' : 'Use reduced motion'}
          </button>
        </p>
      )}
      <LoadingBar label="Ship systems" />
    </section>
  );
}
