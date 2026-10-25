import { useEffect, useState } from 'react';
import { lore } from '../content/lore';
import { fillTokens } from '../content/derived';
import { useExperience } from '../state/experience';
import { useReducedMotion } from '../lib/reducedMotion';

/**
 * The opening crawl, staged like the film:
 *   1. An original "BOUNTY HUNTER" wordmark appears huge and shrinks away
 *      into the stars.
 *   2. The yellow text rises from below the screen and recedes toward a
 *      vanishing point near the top.
 *
 * How the crawl works: a tall "floor" is hinged at the bottom edge of the
 * screen and tilted back with `rotateX`, so it only ever extends *away* from
 * the viewer. The text starts just below the floor's bottom edge (clipped by
 * the floor's overflow) and slides up along it toward the vanishing point.
 * Nothing is ever in front of the CSS perspective "eye", which is what caused
 * the half-hidden text glitch before.
 *
 * The background is transparent: the 3D starfield renders underneath, so
 * when the crawl ends the camera can tilt down without a cut.
 *
 * Reduced motion: the same text, flat and still, with a Continue button.
 */
export function OpeningCrawl() {
  const advance = useExperience((s) => s.advance);
  const reduced = useReducedMotion();
  const [showContinue, setShowContinue] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setShowContinue(true), 6000);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // Enter continues from anywhere once Continue is showing (unless another
  // control has focus, in which case Enter belongs to it).
  useEffect(() => {
    if (!showContinue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('button, a, input, textarea') && !t.closest('.crawl__continue')) return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showContinue, advance]);

  const body = (
    <>
      <p className="crawl__episode">{lore.crawl.episode}</p>
      <h2 className="crawl__title">{lore.crawl.title}</h2>
      {lore.crawl.paragraphs.map((p) => (
        <p key={p}>{fillTokens(p)}</p>
      ))}
    </>
  );

  return (
    <section className="crawl" aria-label={lore.a11y.openingCrawl}>
      {reduced ? (
        <div className="crawl__static">{body}</div>
      ) : (
        <>
          <p className="crawl__logo" aria-hidden="true">
            {lore.crawl.logo.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <div className="crawl__viewport">
            {/* The floor recedes from the bottom edge of the screen; the text slides up it. */}
            <div className="crawl__floor">
              <div className="crawl__text" onAnimationEnd={advance}>
                {body}
              </div>
            </div>
          </div>
        </>
      )}
      {showContinue && (
        <button className="btn btn--ghost crawl__continue" onClick={advance} autoFocus>
          {lore.crawl.continue}
        </button>
      )}
    </section>
  );
}
