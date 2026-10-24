import { portfolio } from '../content/portfolio';

/**
 * The wanted-poster photo. Shows `identity.portrait` when set; otherwise an
 * empty framed slot (with a silhouette) waiting for your photo.
 */
export function PortraitSlot({ className }: { className?: string }) {
  const { portrait, name } = portfolio.identity;
  return (
    <div className={`portrait-slot ${className ?? ''}`}>
      {portrait ? (
        <img src={portrait} alt={name} />
      ) : (
        <svg viewBox="0 0 60 70" aria-hidden="true">
          <circle cx="30" cy="24" r="13" />
          <path d="M6 70c2-16 12-24 24-24s22 8 24 24z" />
        </svg>
      )}
    </div>
  );
}
