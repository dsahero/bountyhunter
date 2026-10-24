import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { useHub } from '../../state/hub';
import { chronological } from '../timeline';
import { orgLabel } from '../../content/derived';

/** Education: the homeworld (university) and its moons (key coursework). */
export function EducationPanel() {
  const { education: e } = portfolio;
  return (
    <>
      <p className="panel__lead">
        {e.planet.name} <span className="panel__flavor">({e.planet.realLocation})</span>
      </p>
      <p className="panel__flavor">{e.planet.coords}</p>
      <p>{e.planet.lore}</p>
      <h3 className="panel__sub">Academy record</h3>
      <dl className="traits">
        <div>
          <dt>School</dt>
          <dd>{e.school}</dd>
        </div>
        <div>
          <dt>Degree</dt>
          <dd>
            {e.degree}, {e.specialization}; {e.minor} minor
          </dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            {e.start} – {e.end}
          </dd>
        </div>
        <div>
          <dt>GPA</dt>
          <dd>
            {e.gpa} <span className="panel__flavor">// {lore.quips.gpa}</span>
          </dd>
        </div>
        {e.honors.length > 0 && (
          <div>
            <dt>Honors</dt>
            <dd>{e.honors.join(' · ')}</dd>
          </div>
        )}
      </dl>
      <h3 className="panel__sub">Moons (key coursework)</h3>
      <ul className="moons">
        {e.courses.map((c) => (
          <li key={c.code}>
            <span className="moons__name">{c.moonName}</span>
            <span>
              {c.code}: {c.title}
            </span>
            <span className="panel__flavor">{c.blurb}</span>
          </li>
        ))}
      </ul>
      <nav className="step-nav" aria-label="Timeline">
        <span />
        <button
          className="btn btn--holo"
          onClick={() => useHub.getState().selectCharge(chronological()[0]!.id)}
        >
          Next: {orgLabel(chronological()[0]!)} ▸
        </button>
      </nav>
    </>
  );
}
