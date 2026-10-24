import { useSettings } from '../state/settings';
import { useExperience } from '../state/experience';
import { LoadingBar } from './LoadingBar';
import { audio } from '../audio/engine';
import { useReducedMotion } from '../lib/reducedMotion';
import { lore } from '../content/lore';
import { fillTokens } from '../content/derived';

/**
 * "Click to enter". Browsers only allow audio to start after a user gesture,
 * so the gate doubles as the moment we ask whether sound should be on.
 * Full motion is the default; reduced motion is an explicit choice here.
 */
export function StartGate() {
  const setSettings = useSettings((s) => s.set);
  const advance = useExperience((s) => s.advance);
  const reduced = useReducedMotion();
  const g = lore.gate;

  const enter = (sound: boolean) => {
    setSettings({ soundEnabled: sound });
    // Browsers allow audio only after a gesture: this click is it.
    if (sound) audio.unlock();
    advance();
  };

  return (
    <section className="gate" aria-labelledby="gate-title">
      <p className="gate__kicker">{g.kicker}</p>
      <h1 id="gate-title" className="gate__title">
        {g.title}
      </h1>
      <p className="gate__sub">{fillTokens(g.subtitle)}</p>
      <div className="gate__actions">
        <button className="btn" onClick={() => enter(true)} autoFocus>
          {g.enterWithSound}
        </button>
        <button className="btn btn--ghost" onClick={() => enter(false)}>
          {g.enterSilently}
        </button>
      </div>
      <p className="gate__motion">
        {reduced ? g.reducedMotionOn : g.reducedMotionOff}{' '}
        <button
          className="gate__motion-toggle"
          onClick={() => setSettings({ reducedMotion: reduced ? 'off' : 'on' })}
        >
          {reduced ? g.useFullMotion : g.useReducedMotion}
        </button>
      </p>
      <LoadingBar label={g.title} />
    </section>
  );
}
