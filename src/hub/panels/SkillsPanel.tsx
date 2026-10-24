import { portfolio } from '../../content/portfolio';
import { useHub, type Unit } from '../../state/hub';

const UNITS = [...new Set(portfolio.associates.map((a) => a.unit))] as Unit[];
const LEVELS = ['', 'Acquaintance', 'Contact', 'Ally', 'Trusted ally', 'Right hand'];

export function SkillsPanel() {
  const unit = useHub((s) => s.unit);
  const skill = useHub((s) => s.associate);
  const members = portfolio.associates.filter((a) => a.unit === unit);
  const a = members.find((m) => m.skill === skill) ?? members[0]!;
  const ops = portfolio.propaganda.filter((p) => !p.classified && p.stack.includes(a.skill));

  return (
    <>
      <div className="tabs" role="group" aria-label="Units">
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

      <ul className="roster" aria-label={`${unit} roster`}>
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
          Skill: <strong>{a.skill}</strong>
        </p>
        <p>{a.note}</p>
        <div className="meter" aria-label={`Association level ${a.level} of 5: ${LEVELS[a.level]}`}>
          <span className="meter__label">Association</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`meter__pip${n <= a.level ? ' meter__pip--on' : ''}`}
              aria-hidden="true"
            />
          ))}
          <span className="panel__flavor">{LEVELS[a.level]}</span>
        </div>
        <p className="panel__flavor">
          Served with the target for {a.years} {a.years === 1 ? 'year' : 'years'}.
        </p>
        {ops.length > 0 && (
          <>
            <h4 className="panel__sub">Joint operations</h4>
            <ul className="chips">
              {ops.map((p) => (
                <li key={p.id}>
                  <button
                    className="chip"
                    onClick={() => {
                      useHub.getState().selectProject(p.id);
                    }}
                  >
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
