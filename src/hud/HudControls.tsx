/**
 * Always-available controls: sound + volume, motion, replay, and the plain
 * dossier (the "no dead ends" escape hatch). Labels come from portfolio.site.hud.
 */
import { Link } from 'react-router-dom';
import { lore } from '../content/lore';
import { useExperience } from '../state/experience';
import { useSettings } from '../state/settings';
import { useReducedMotion } from '../lib/reducedMotion';

export function HudControls({ className }: { className?: string }) {
  const replay = useExperience((s) => s.replay);
  const soundEnabled = useSettings((s) => s.soundEnabled);
  const volume = useSettings((s) => s.volume);
  const setSettings = useSettings((s) => s.set);
  const reduced = useReducedMotion();
  const h = lore.hud;

  return (
    <div className={className}>
      <button
        className="btn btn--ghost"
        aria-pressed={soundEnabled}
        onClick={() => setSettings({ soundEnabled: !soundEnabled })}
      >
        {h.sound}: {soundEnabled ? h.on : h.off}
      </button>
      {soundEnabled && (
        <input
          className="volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          aria-label={h.volume}
          onChange={(e) => setSettings({ volume: Number(e.target.value) })}
        />
      )}
      <button
        className="btn btn--ghost"
        aria-pressed={!reduced}
        onClick={() => setSettings({ reducedMotion: reduced ? 'off' : 'on' })}
      >
        {h.motion}: {reduced ? h.motionReduced : h.motionFull}
      </button>
      <button className="btn btn--ghost" onClick={replay}>
        {h.replay}
      </button>
      <Link className="btn btn--ghost" to="/dossier">
        {h.plainDossier}
      </Link>
    </div>
  );
}
