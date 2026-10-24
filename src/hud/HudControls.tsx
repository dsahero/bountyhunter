/**
 * Always-available controls: sound toggle, replay, and the plain dossier
 * (the "no dead ends" escape hatch).
 */
import { Link } from 'react-router-dom';
import { useExperience } from '../state/experience';
import { useSettings } from '../state/settings';
import { useReducedMotion } from '../lib/reducedMotion';

export function HudControls({ className }: { className?: string }) {
  const replay = useExperience((s) => s.replay);
  const soundEnabled = useSettings((s) => s.soundEnabled);
  const setSettings = useSettings((s) => s.set);
  const volume = useSettings((s) => s.volume);
  const reduced = useReducedMotion();

  return (
    <div className={className}>
      <button
        className="btn btn--ghost"
        aria-pressed={soundEnabled}
        onClick={() => setSettings({ soundEnabled: !soundEnabled })}
      >
        Sound: {soundEnabled ? 'on' : 'off'}
      </button>
      {soundEnabled && (
        <input
          className="volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          aria-label="Volume"
          onChange={(e) => setSettings({ volume: Number(e.target.value) })}
        />
      )}
      <button
        className="btn btn--ghost"
        aria-pressed={!reduced}
        onClick={() => setSettings({ reducedMotion: reduced ? 'off' : 'on' })}
      >
        Motion: {reduced ? 'reduced' : 'full'}
      </button>
      <button className="btn btn--ghost" onClick={replay}>
        Replay intro
      </button>
      <Link className="btn btn--ghost" to="/dossier">
        Plain dossier
      </Link>
    </div>
  );
}
