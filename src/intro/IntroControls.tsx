import { Link } from 'react-router-dom';
import { lore } from '../content/lore';
import { useExperience } from '../state/experience';

/**
 * Always-visible escape hatches during the intro: skip straight to the
 * cockpit, or leave the cinematic entirely for the plain dossier.
 */
export function IntroControls() {
  const skip = useExperience((s) => s.skip);
  return (
    <nav className="intro-controls" aria-label="Intro controls">
      <Link className="btn btn--ghost" to="/dossier">
        {lore.hud.plainDossier}
      </Link>
      <button className="btn btn--holo" onClick={skip}>
        {lore.hud.skipIntro}
      </button>
    </nav>
  );
}
