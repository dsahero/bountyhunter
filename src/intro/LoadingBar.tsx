import { progressFraction, usePreload } from '../lib/preload';

/** Themed progress bar driven by real task completion (see lib/preload.ts). */
export function LoadingBar({ label }: { label: string }) {
  const done = usePreload((s) => s.done);
  const total = usePreload((s) => s.total);
  const pct = Math.round(progressFraction({ done, total }) * 100);

  return (
    <div className="loading">
      <div
        className="loading__track"
        role="progressbar"
        aria-label={`${label} loading`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="loading__fill" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <p className="loading__text">
        {label}: {pct < 100 ? `${pct}% online` : 'ready'}
      </p>
    </div>
  );
}
