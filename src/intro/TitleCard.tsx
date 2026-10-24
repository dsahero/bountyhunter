import { lore } from '../content/lore';
import { useExperience } from '../state/experience';

/**
 * Black screen, a beat of silence, then the blue title card fades in and out.
 * The CSS animation drives the timing; when it ends we advance to the crawl.
 */
export function TitleCard() {
  const advance = useExperience((s) => s.advance);
  return (
    <section className="title-card" aria-live="polite">
      <p className="title-card__text" onAnimationEnd={advance}>
        {lore.titleCard}
      </p>
    </section>
  );
}
