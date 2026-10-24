import { useHub } from '../../state/hub';
import { chronological } from '../timeline';
import { orgLabel } from '../../content/derived';

export function ExperiencePanel() {
  const selectedId = useHub((s) => s.charge);
  const charges = chronological();
  const index = Math.max(
    0,
    charges.findIndex((x) => x.id === selectedId),
  );
  const c = charges[index]!;

  return (
    <>
      <p className="panel__flavor">
        The overhead star map traces each charge in order; select one to follow the lane.
      </p>
      <div className="tabs" role="group" aria-label="Charges">
        {charges.map((x, i) => (
          <button
            key={x.id}
            className="tab"
            aria-pressed={x.id === c.id}
            onClick={() => useHub.getState().selectCharge(x.id)}
          >
            {i + 1}. {x.kind === 'leadership' ? '⚑ ' : ''}
            {orgLabel(x)}
          </button>
        ))}
      </div>

      <article className="charge">
        <p className="charge__kind">
          {c.kind === 'leadership' ? 'Leadership' : 'Internship / Research'}
        </p>
        <h3 className="charge__title">{c.chargeTitle}</h3>
        <p className="panel__lead">
          {c.role}, {c.org}
        </p>
        <p className="panel__flavor">
          {c.start} – {c.end} · {c.realLocation} → {c.planet.name}
        </p>
        <div className="meter" aria-label={`Severity ${c.severity} of 5`}>
          <span className="meter__label">Severity</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`meter__pip${n <= c.severity ? ' meter__pip--on' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <h4 className="panel__sub">Evidence</h4>
        <ul className="evidence">
          {c.evidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </article>
      <StepNav index={index} charges={charges} />
    </>
  );
}

/** Back / Next through the timeline; Back from the first charge returns to Education. */
function StepNav({ index, charges }: { index: number; charges: ReturnType<typeof chronological> }) {
  const prev = charges[index - 1];
  const next = charges[index + 1];
  return (
    <nav className="step-nav" aria-label="Timeline">
      <button
        className="btn btn--ghost"
        onClick={() =>
          prev ? useHub.getState().selectCharge(prev.id) : useHub.getState().open('education')
        }
      >
        ◂ {prev ? orgLabel(prev) : 'Education'}
      </button>
      {next ? (
        <button className="btn btn--holo" onClick={() => useHub.getState().selectCharge(next.id)}>
          Next: {orgLabel(next)} ▸
        </button>
      ) : (
        <button className="btn btn--holo" onClick={() => useHub.getState().open('leadership')}>
          Next: Leadership ▸
        </button>
      )}
    </nav>
  );
}
