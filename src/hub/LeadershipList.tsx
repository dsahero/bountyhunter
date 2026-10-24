/**
 * Leadership as "rebel cells I've run": each role with the planet it happened
 * on to the left, and the role and description beside/under it.
 *
 * In the 3D cockpit this is projected as a hologram overhead (in place of the
 * star map). In the 2D fallback it renders inside a normal panel.
 */
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import { parseMonth } from './timeline';
import './leadership.css';

export function leadershipRoles() {
  return portfolio.charges
    .filter((c) => c.kind === 'leadership')
    .sort((a, b) => parseMonth(a.start) - parseMonth(b.start));
}

export function LeadershipList({ inWorld }: { inWorld: boolean }) {
  const roles = leadershipRoles();
  return (
    <div className={`leadership${inWorld ? ' leadership--world' : ''}`}>
      {inWorld && (
        <header className="leadership__header">
          <h2 className="leadership__title">{lore.sections.leadership.lore}</h2>
          <p className="leadership__real">{lore.sections.leadership.real}</p>
          <nav className="leadership__nav" aria-label="Leadership navigation">
            <button className="leadership__btn" onClick={() => useHub.getState().back()}>
              ◂ Back <kbd>⌫</kbd>
            </button>
            <button className="leadership__btn" onClick={() => useHub.getState().close()}>
              Console <kbd>Esc</kbd>
            </button>
          </nav>
        </header>
      )}
      <ol className="leadership__list">
        {roles.map((r) => (
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
