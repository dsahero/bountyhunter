import { lore } from '../../content/lore';
import { orgLabel } from '../../content/derived';
import { useHub } from '../../state/hub';
import { chronological } from '../timeline';

export function ExperiencePanel() {
  const selectedId = useHub((s) => s.charge);
  const charges = chronological();
  const index = Math.max(
    0,
    charges.findIndex((x) => x.id === selectedId),
  );
  const c = charges[index];
  const l = lore.labels;
  if (!c) return null;

  return (
    <>
      <StepNav index={index} charges={charges} />
      <p className="panel__flavor">{l.experienceHint}</p>
      <div className="tabs" role="group" aria-label={lore.sections.experience.real}>
        {charges.map((x) => (
          <button
            key={x.id}
            className="tab"
            aria-pressed={x.id === c.id}
            onClick={() => useHub.getState().selectCharge(x.id)}
          >
            {orgLabel(x)}
          </button>
        ))}
      </div>

      <article className="charge">
        <p className="charge__kind">
          {c.kind === 'leadership' ? l.leadershipKind : l.internshipKind}
        </p>
        <h3 className="charge__title">{c.chargeTitle}</h3>
        <p className="panel__lead">
          {c.role}, {c.org}
        </p>
        <p className="panel__flavor">
          {c.start} – {c.end} · {c.realLocation}
        </p>
        <div className="meter" aria-label={`${l.severity} ${c.severity} / 5`}>
          <span className="meter__label">{l.severity}</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`meter__pip${n <= c.severity ? ' meter__pip--on' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <h4 className="panel__sub">{l.evidence}</h4>
        <ul className="evidence">
          {c.evidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </article>
    </>
  );
}

/** Back / Next through the timeline; the ends lead to Education and Leadership. */
function StepNav({ index, charges }: { index: number; charges: ReturnType<typeof chronological> }) {
  const prev = charges[index - 1];
  const next = charges[index + 1];
  const hub = useHub.getState;
  return (
    <nav className="step-nav" aria-label={lore.a11y.timeline}>
      <button
        className="btn btn--ghost"
        onClick={() => (prev ? hub().selectCharge(prev.id) : hub().open('education'))}
      >
        ◂ {prev ? orgLabel(prev) : lore.sections.education.real}
      </button>
      <button
        className="btn btn--holo"
        onClick={() => (next ? hub().selectCharge(next.id) : hub().open('leadership'))}
      >
        {lore.labels.next}: {next ? orgLabel(next) : lore.sections.leadership.real} ▸
      </button>
    </nav>
  );
}
