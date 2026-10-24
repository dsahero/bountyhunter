import { useCaptions } from '../audio/cues';

/** On-screen captions for meaningful sounds. */
export function Captions() {
  const items = useCaptions((s) => s.items);
  return (
    <div className="captions" aria-live="polite">
      {items.map((c) => (
        <p key={c.id} className="captions__line">
          {c.text}
        </p>
      ))}
    </div>
  );
}
