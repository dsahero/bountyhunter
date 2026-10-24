import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { useHub } from '../../state/hub';

/** Units are whatever groups the associates in the content file use, in order of appearance. */
const UNITS = [...new Set(portfolio.associates.map((a) => a.unit))];

export function SkillsPanel() {
  const unit = useHub((s) => s.unit);
  const skill = useHub((s) => s.associate);
  const l = lore.labels;
  const members = portfolio.associates.filter((a) => a.unit === unit);
  const a = members.find((m) => m.skill === skill) ?? members[0];
  if (!a) return null;
  const ops = portfolio.propaganda.filter((p) => !p.classified && p.stack.includes(a.skill));

  return (
    <>
      <div className="tabs" role="group" aria-label={lore.sections.skills.real}>
        {UNITS.map((u) => (
          <button
            key={u}
            className="tab"
            aria-pressed={u === unit}
            onClick={() => {
              const first = portfolio.associates.find((x) => x.unit === u)!;
              useHub.getState().set({ unit: u, associate: first.skill });
            }}
          >
            {u}
          </button>
        ))}
      </div>

      <ul className="roster" aria-label={unit}>
        {members.map((m) => (
          <li key={m.skill}>
            <button
              className="roster__item"
              aria-pressed={m.skill === a.skill}
              onClick={() => useHub.getState().set({ associate: m.skill })}
            >
              <span className="roster__skill">{m.skill}</span>
              <span className="roster__callsign">{m.callsign}</span>
            </button>
          </li>
        ))}
      </ul>

      <article className="associate">
        <p className="charge__kind">
          {a.rank} · {a.unit}
        </p>
        <h3 className="charge__title">{a.callsign}</h3>
        <p className="panel__lead">
          <strong>{a.skill}</strong>
        </p>
        <p>{a.note}</p>
        <div
          className="meter"
          aria-label={`${l.association} ${a.level} / 5: ${l.associationLevels[a.level]}`}
        >
          <span className="meter__label">{l.association}</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`meter__pip${n <= a.level ? ' meter__pip--on' : ''}`}
              aria-hidden="true"
            />
          ))}
          <span className="panel__flavor">{l.associationLevels[a.level]}</span>
        </div>
        <p className="panel__flavor">{l.servedWith.replace('{YEARS}', String(a.years))}</p>
        {ops.length > 0 && (
          <>
            <h4 className="panel__sub">{l.jointOperations}</h4>
            <ul className="chips">
              {ops.map((p) => (
                <li key={p.id}>
                  <button className="chip" onClick={() => useHub.getState().selectProject(p.id)}>
                    {p.title}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>
    </>
  );
}
