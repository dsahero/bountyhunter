/**
 * The plain dossier (/dossier): a fast, text-first, accessible resume page.
 *
 * This is the recruiter fast path and the SEO surface. It is prerendered to
 * static HTML at build time (scripts/prerender.mjs), so it works with
 * JavaScript disabled. Real section names come first; lore names are flavor.
 */
import { Link } from 'react-router-dom';
import { portfolio } from '../content/portfolio';
import { lore, type SectionKey } from '../content/lore';
import type { Associate } from '../content/schema';
import { useDocumentMeta } from '../app/useDocumentMeta';
import './plain.css';

const credits = (n: number) => `${n.toLocaleString('en-US')} credits`;

function SectionHeading({ id, k }: { id: string; k: SectionKey }) {
  const s = lore.sections[k];
  return (
    <h2 id={id}>
      {s.real} <span className="plain__lore">// {s.lore}</span>
    </h2>
  );
}

function groupByUnit(list: Associate[]) {
  const groups = new Map<Associate['unit'], Associate[]>();
  for (const a of list) groups.set(a.unit, [...(groups.get(a.unit) ?? []), a]);
  return [...groups];
}

const levelWords = ['', 'Familiar', 'Working', 'Proficient', 'Advanced', 'Expert'];

/** Shared with scripts/prerender.mjs (via entry-server) so static HTML gets the same meta. */
export const dossierMeta = {
  title: `${portfolio.identity.name}, Software Engineer | Plain Dossier`,
  description: `${portfolio.identity.name}: ${portfolio.identity.tagline} ${portfolio.education.degree}, ${portfolio.education.school}.`,
};

export function PlainDossier() {
  const { identity, education, charges, associates, propaganda, contact, resume } = portfolio;
  useDocumentMeta(dossierMeta);

  const internships = charges.filter((c) => c.kind === 'internship');
  const leadership = charges.filter((c) => c.kind === 'leadership');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: identity.name,
    alternateName: identity.alias,
    description: identity.tagline,
    email: `mailto:${contact.email}`,
    sameAs: [contact.github, contact.linkedin],
    alumniOf: { '@type': 'CollegeOrUniversity', name: education.school },
  };

  return (
    <div className="plain">
      <a className="plain__skiplink" href="#main">
        Skip to content
      </a>
      <header className="plain__header">
        <p className="plain__kicker">Bounty Guild · Intelligence File · Declassified</p>
        <h1>{identity.name}</h1>
        <p className="plain__alias">a.k.a. “{identity.alias}”</p>
        <p className="plain__tagline">{identity.tagline}</p>
        <nav aria-label="Contact and resume" className="plain__links">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.github}>GitHub</a>
          <a href={contact.linkedin}>LinkedIn</a>
          <a href={resume.pdf} download>
            Resume (PDF)
          </a>
          {contact.other.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <nav aria-label="Sections" className="plain__toc">
          <a href="#about">About</a>
          <a href="#education">Education</a>
          <a href="#experience">Experience</a>
          <a href="#leadership">Leadership</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
          <Link to="/" className="plain__cockpit">
            Enter the cockpit →
          </Link>
        </nav>
      </header>

      <main id="main">
        <section aria-labelledby="about">
          <SectionHeading id="about" k="about" />
          {identity.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="plain__wanted">
            <strong>Wanted for:</strong> {identity.wantedFor}. <strong>Reward:</strong>{' '}
            {credits(identity.reward.amount)}. {identity.reward.terms}
          </p>
        </section>

        <section aria-labelledby="education">
          <SectionHeading id="education" k="education" />
          <article className="plain__entry">
            <div className="plain__entry-head">
              <h3>{education.school}</h3>
              <span>
                {education.start} – {education.end}
              </span>
            </div>
            <p>
              {education.degree}, Specialization in {education.specialization}. {education.minor}{' '}
              Minor. GPA {education.gpa}.
            </p>
            {education.honors.length > 0 && <p>Honors: {education.honors.join(' · ')}</p>}
            <p>
              Key coursework: {education.courses.map((c) => `${c.code} ${c.title}`).join(' · ')}
            </p>
            <p className="plain__flavor">
              Homeworld: {education.planet.name}, {education.planet.coords}.
            </p>
          </article>
        </section>

        <section aria-labelledby="experience">
          <SectionHeading id="experience" k="experience" />
          {[{ label: 'Internships & Research', list: internships }].map(({ label, list }) => (
            <div key={label}>
              <h3 className="plain__subhead">{label}</h3>
              {list.map((c) => (
                <article key={c.id} className="plain__entry">
                  <div className="plain__entry-head">
                    <h4>
                      {c.role}, {c.org}
                    </h4>
                    <span>
                      {c.start} – {c.end} · {c.realLocation}
                    </span>
                  </div>
                  <ul>
                    {c.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                  <p className="plain__flavor">
                    Charge: {c.chargeTitle} ({c.planet.name})
                  </p>
                </article>
              ))}
            </div>
          ))}
        </section>

        <section aria-labelledby="leadership">
          <SectionHeading id="leadership" k="leadership" />
          {leadership.map((c) => (
            <article key={c.id} className="plain__entry">
              <div className="plain__entry-head">
                <h3>
                  {c.role}, {c.org}
                </h3>
                <span>
                  {c.start} – {c.end} · {c.realLocation}
                </span>
              </div>
              <ul>
                {c.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="plain__flavor">
                Rebel cell: {c.chargeTitle} ({c.planet.name})
              </p>
            </article>
          ))}
        </section>

        <section aria-labelledby="projects">
          <SectionHeading id="projects" k="projects" />
          {propaganda
            .filter((p) => !p.classified)
            .map((p) => (
              <article key={p.id} className="plain__entry">
                <div className="plain__entry-head">
                  <h3>{p.title}</h3>
                  <span>{p.role}</span>
                </div>
                <p>
                  <strong>{p.oneLiner}</strong>
                </p>
                {p.description.map((d) => (
                  <p key={d}>{d}</p>
                ))}
                <p>Tech: {p.stack.join(', ')}</p>
                {p.links.length > 0 && (
                  <p className="plain__project-links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href}>
                        {l.label}
                      </a>
                    ))}
                  </p>
                )}
              </article>
            ))}
        </section>

        <section aria-labelledby="skills">
          <SectionHeading id="skills" k="skills" />
          <div className="plain__skills">
            {groupByUnit(associates).map(([unit, list]) => (
              <div key={unit}>
                <h3 className="plain__subhead">{unit}</h3>
                <ul>
                  {list.map((a) => (
                    <li key={a.skill}>
                      <strong>{a.skill}</strong>: {levelWords[a.level]}, {a.years} yr
                      {a.years === 1 ? '' : 's'}
                      <span className="plain__flavor"> ({a.callsign})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="contact">
          <SectionHeading id="contact" k="contact" />
          <p>
            Email <a href={`mailto:${contact.email}`}>{contact.email}</a>, or find me on{' '}
            <a href={contact.github}>GitHub</a> and <a href={contact.linkedin}>LinkedIn</a>.
          </p>
          <p>
            <a className="btn" href={resume.pdf} download>
              Download resume (PDF)
            </a>{' '}
            <span className="plain__flavor">Updated {resume.updated}</span>
          </p>
        </section>
      </main>

      <footer className="plain__footer">
        <p>{lore.disclaimer}</p>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
