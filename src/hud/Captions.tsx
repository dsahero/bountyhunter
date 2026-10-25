import { useCaptions } from '../audio/cues';
import { useSettings } from '../state/settings';

/** On-screen captions for meaningful sounds. */
export function Captions() {
  const items = useCaptions((s) => s.items);
  const on = useSettings((s) => s.captions);
  if (!on) return null;
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
