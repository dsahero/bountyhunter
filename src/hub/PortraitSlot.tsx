import { portfolio } from '../content/portfolio';
import { usePortrait } from '../lib/portrait';

/**
 * The wanted-poster photo (see lib/portrait: your live profile photo), or a
 * framed silhouette until one loads.
 */
export function PortraitSlot({ className }: { className?: string }) {
  const photo = usePortrait();
  return (
    <div className={`portrait-slot ${className ?? ''}`}>
      {photo ? (
        <img src={photo.src} alt={portfolio.identity.name} />
      ) : (
        <svg viewBox="0 0 60 70" aria-hidden="true">
          <circle cx="30" cy="24" r="13" />
          <path d="M6 70c2-16 12-24 24-24s22 8 24 24z" />
        </svg>
      )}
    </div>
  );
}
