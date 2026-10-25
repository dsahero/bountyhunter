import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { orgLabel } from '../../content/derived';
import { useHub } from '../../state/hub';
import { chronological } from '../timeline';

/** Education: the homeworld (university) and its moons (key coursework). */
export function EducationPanel() {
  const { education: e } = portfolio;
  const l = lore.labels;
  const first = chronological()[0];
  return (
    <>
      {first && (
        <nav className="step-nav" aria-label={lore.a11y.timeline}>
          <span />
          <button
            className="btn btn--holo"
            onClick={() => useHub.getState().selectCharge(first.id)}
          >
            {l.next}: {orgLabel(first)} ▸
          </button>
        </nav>
      )}
      <p className="panel__lead">
        {e.planet.name} <span className="panel__flavor">({e.planet.realLocation})</span>
      </p>
      <p className="panel__flavor">{e.planet.coords}</p>
      <p>{e.planet.lore}</p>
      <h3 className="panel__sub">{l.academyRecord}</h3>
      <dl className="traits">
        <div>
          <dt>{l.school}</dt>
          <dd>{e.school}</dd>
        </div>
        <div>
          <dt>{l.degree}</dt>
          <dd>
            {e.degree}, {e.specialization}; {e.minor}
          </dd>
        </div>
        <div>
          <dt>{l.dates}</dt>
          <dd>
            {e.start} – {e.end}
          </dd>
        </div>
        <div>
          <dt>{l.gpa}</dt>
          <dd>
            {e.gpa} <span className="panel__flavor">// {lore.quips.gpa}</span>
          </dd>
        </div>
        {e.honors.length > 0 && (
          <div>
            <dt>{l.honors}</dt>
            <dd>{e.honors.join(' · ')}</dd>
          </div>
        )}
      </dl>
      <h3 className="panel__sub">{l.moons}</h3>
      <ul className="moons">
        {e.courses.map((c) => (
          <li key={c.code}>
            <span className="moons__name">{c.moonName}</span>
            <span>{c.code}</span>
            <span className="panel__flavor">{c.blurb}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
