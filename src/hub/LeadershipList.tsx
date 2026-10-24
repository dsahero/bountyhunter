/**
 * Leadership: the "rebel cells" I've run, from the content file.
 *   - In 3D: an overhead canvas hologram (three/stations/LeadershipHologram),
 *     paged two roles at a time, with a hidden keyboard mirror (below).
 *   - In 2D: this list renders inside a normal panel.
 */
import { create } from 'zustand';
import { useEffect } from 'react';
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import { parseMonth } from './timeline';
import './leadership.css';

export const LEADERSHIP_PER_PAGE = 2;

export function leadershipRoles() {
  return portfolio.charges
    .filter((c) => c.kind === 'leadership')
    .sort((a, b) => parseMonth(a.start) - parseMonth(b.start));
}

const pageCount = () => Math.max(1, Math.ceil(leadershipRoles().length / LEADERSHIP_PER_PAGE));

export const useLeadershipPage = create<{
  page: number;
  focus: string | null;
  set: (p: { page?: number; focus?: string | null }) => void;
}>((set) => ({ page: 0, focus: null, set: (p) => set(p) }));

export function activateLeadership(id: string) {
  const { page, set } = useLeadershipPage.getState();
  if (id === 'back') return useHub.getState().back();
  if (id === 'console') return useHub.getState().close();
  if (id === 'prev') return set({ page: (page - 1 + pageCount()) % pageCount() });
  if (id === 'next') return set({ page: (page + 1) % pageCount() });
}

/** Hidden real buttons for the leadership hologram (keyboard + screen readers). */
export function LeadershipMirror() {
  const set = useLeadershipPage((s) => s.set);
  const roles = leadershipRoles();
  const items = [
    { id: 'back', label: lore.panel.back },
    { id: 'console', label: lore.panel.console },
    ...(pageCount() > 1
      ? [
          { id: 'prev', label: '◂' },
          { id: 'next', label: '▸' },
        ]
      : []),
  ];
  useEffect(() => {
    document.getElementById('leadership-back')?.focus({ preventScroll: true });
  }, []);
  return (
    <nav className="leadership-mirror sr-only" aria-label={lore.sections.leadership.real}>
      <ul>
        {roles.map((r) => (
          <li key={r.id}>
            {r.role}, {r.org}, {r.start} – {r.end}. {r.evidence.join(' ')}
          </li>
        ))}
      </ul>
      {items.map((b) => (
        <button
          key={b.id}
          id={`leadership-${b.id}`}
          onFocus={() => set({ focus: b.id })}
          onBlur={() => set({ focus: null })}
          onClick={() => activateLeadership(b.id)}
        >
          {b.label}
        </button>
      ))}
    </nav>
  );
}

/** The 2D (no-WebGL) version, shown in a regular panel. */
export function LeadershipList() {
  return (
    <div className="leadership">
      <ol className="leadership__list">
        {leadershipRoles().map((r) => (
          <li key={r.id} className="cell">
            <div className="cell__planet" style={{ ['--planet' as string]: r.planet.color }}>
              <span className="cell__orb" aria-hidden="true" />
              <span className="cell__planet-name">{r.planet.name}</span>
              <span className="cell__where">{r.realLocation}</span>
            </div>
            <div className="cell__body">
              <h3 className="cell__role">
                {r.role}, {r.org}
              </h3>
              <p className="cell__meta">
                {r.start} – {r.end} · <em>{r.chargeTitle}</em>
              </p>
              <ul className="cell__evidence">
                {r.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
