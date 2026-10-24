/**
 * The resume, rendered natively from the content file (no embedded PDF), so
 * it's crisp, searchable, and always in sync with the rest of the site. The
 * PDF stays one click away for downloading.
 */
import { useState } from 'react';
import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { chronological } from '../timeline';
import { leadershipRoles } from '../LeadershipList';

const byNewest = <T extends { start: string }>(list: T[]) => [...list].reverse();

export function ResumePanel() {
  const { identity, education: e, associates, propaganda, contact, resume } = portfolio;
  const [downloaded, setDownloaded] = useState(false);
  const internships = byNewest(chronological());
  const leadership = byNewest(leadershipRoles());
  const units = [...new Set(associates.map((a) => a.unit))];

  return (
    <article className="resume">
      <div className="resume__actions">
        <a className="btn" href={resume.pdf} download onClick={() => setDownloaded(true)}>
          Download PDF
        </a>
        <a className="btn btn--ghost" href="/dossier">
          Plain-text dossier
        </a>
        {downloaded && (
          <span className="panel__quip" role="status">
            {lore.quips.resumeDownload}
          </span>
        )}
      </div>

      <header className="resume__head">
        <h3 className="resume__name">{identity.name}</h3>
        <p className="resume__contact">
          <a href={`mailto:${contact.email}`}>{contact.email}</a> ·{' '}
          <a href={contact.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>{' '}
          ·{' '}
          <a href={contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      </header>

      <section>
        <h4 className="resume__section">Education</h4>
        <div className="resume__row">
          <strong>{e.school}</strong>
          <span>
            {e.start} – {e.end}
          </span>
        </div>
        <p className="resume__sub">
          {e.degree}, Specialization in {e.specialization}; {e.minor} Minor
        </p>
        <p>
          GPA {e.gpa}
          {e.honors.length > 0 && <> · {e.honors.join(' · ')}</>}
        </p>
      </section>

      <section>
        <h4 className="resume__section">Experience</h4>
        {internships.map((c) => (
          <div key={c.id} className="resume__entry">
            <div className="resume__row">
              <strong>{c.role}</strong>
              <span>
                {c.start} – {c.end}
              </span>
            </div>
            <p className="resume__sub">
              {c.org} · {c.realLocation}
            </p>
            <ul>
              {c.evidence.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h4 className="resume__section">Leadership</h4>
        {leadership.map((c) => (
          <div key={c.id} className="resume__entry">
            <div className="resume__row">
              <strong>{c.org}</strong>
              <span>
                {c.start} – {c.end}
              </span>
            </div>
            <p className="resume__sub">{c.role}</p>
            <ul>
              {c.evidence.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h4 className="resume__section">Projects</h4>
        {propaganda
          .filter((p) => !p.classified)
          .map((p) => (
            <div key={p.id} className="resume__entry">
              <div className="resume__row">
                <strong>{p.title}</strong>
                <span>{p.role}</span>
              </div>
              <p className="resume__sub">{p.stack.join(', ')}</p>
              <p>{p.oneLiner}</p>
            </div>
          ))}
      </section>

      <section>
        <h4 className="resume__section">Technical skills</h4>
        <dl className="resume__skills">
          {units.map((u) => (
            <div key={u}>
              <dt>{u}</dt>
              <dd>
                {associates
                  .filter((a) => a.unit === u)
                  .map((a) => a.skill)
                  .join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="panel__flavor">Updated {resume.updated}.</p>
    </article>
  );
}
