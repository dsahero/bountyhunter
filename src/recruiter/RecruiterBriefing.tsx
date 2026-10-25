/**
 * The recruiter briefing (/recruiter): everything a recruiter needs in a
 * 60-second scan, with no intro and no 3D.
 *
 *   - who, what, when, where, and clearance up top, with one-tap actions
 *     (email, resume, contact card, booking link, LinkedIn, GitHub)
 *   - headline numbers, each backed by a resume line
 *   - "Tailor this briefing": pick a role and experience, projects, and
 *     skills reorder by relevance with matches highlighted; the choice goes
 *     into the URL (?focus=ml) so the tailored page can be forwarded
 *   - a plain-text candidate summary to paste into an ATS, a print layout
 *
 * Prerendered to static HTML at build time (like /dossier): fast, indexable,
 * and readable without JavaScript.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { useDocumentMeta } from '../app/useDocumentMeta';
import { track } from '../lib/analytics';
import { isVideo } from '../lib/media';
import {
  chargeSkills,
  focusById,
  matchLevel,
  projectSkills,
  rankCharges,
  rankProjects,
  type FocusArea,
} from './match';
import { candidateSummary, contactCard } from './exports';
import './recruiter.css';

/** Shared with scripts/prerender.mjs (via entry-server) so the static HTML gets the same meta. */
export const recruiterMeta = {
  title: `${portfolio.identity.name} | ${portfolio.site.recruiterUi.metaTitle}`,
  description: `${portfolio.identity.name}: ${portfolio.recruiter.headline}. ${portfolio.recruiter.status}.`,
};

const ui = portfolio.site.recruiterUi;

/** A button that briefly confirms it worked ("Copied"). */
function ActionButton({
  label,
  done,
  onClick,
  primary = false,
}: {
  label: string;
  done: string;
  onClick: () => Promise<void> | void;
  primary?: boolean;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className={`rb__btn${primary ? ' rb__btn--primary' : ''}`}
      onClick={async () => {
        try {
          await onClick();
          setOk(true);
          window.setTimeout(() => setOk(false), 2200);
        } catch {
          /* clipboard blocked: nothing to confirm */
        }
      }}
      aria-live="polite"
    >
      {ok ? done : label}
    </button>
  );
}

function Tags({ skills, hits }: { skills: string[]; hits: string[] }) {
  return (
    <ul className="rb__tags">
      {skills.map((s) => (
        <li key={s} className={hits.includes(s) ? 'rb__tag rb__tag--hit' : 'rb__tag'}>
          {s}
        </li>
      ))}
    </ul>
  );
}

function Match({ score }: { score: number }) {
  const level = matchLevel(score);
  if (!level) return null;
  return (
    <span className={`rb__match rb__match--${level}`}>
      {level === 'strong' ? ui.strongMatch : ui.goodMatch}
    </span>
  );
}

export function RecruiterBriefing() {
  const { identity, recruiter, education, charges, associates, propaganda, contact, resume } =
    portfolio;
  useDocumentMeta(recruiterMeta);
  const [params, setParams] = useSearchParams();
  const focus: FocusArea | null = focusById(params.get('focus'));

  useEffect(() => track('recruiter_view'), []);

  const internships = useMemo(
    () =>
      rankCharges(
        charges.filter((c) => c.kind === 'internship'),
        focus,
      ),
    [charges, focus],
  );
  const leadership = charges.filter((c) => c.kind === 'leadership');
  const projects = useMemo(
    () =>
      rankProjects(
        propaganda.filter((p) => !p.classified),
        focus,
      ),
    [propaganda, focus],
  );
  const skills = useMemo(() => {
    const inFocus = (s: string) => (focus?.skills.includes(s) ? 1 : 0);
    return [...associates].sort(
      (a, b) => inFocus(b.skill) - inFocus(a.skill) || b.level - a.level || b.years - a.years,
    );
  }, [associates, focus]);

  const choose = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('focus', id);
    else next.delete('focus');
    setParams(next, { replace: true });
    track('recruiter_focus', { focus: id ?? 'all' });
  };

  const downloadCard = () => {
    const blob = new Blob([contactCard()], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${identity.name.replace(/\s+/g, '-')}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
    track('recruiter_action', { action: 'vcard' });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: identity.name,
    jobTitle: recruiter.headline,
    email: `mailto:${contact.email}`,
    sameAs: [contact.github, contact.linkedin],
    alumniOf: { '@type': 'CollegeOrUniversity', name: education.school },
    knowsAbout: associates.map((a) => a.skill),
  };

  return (
    <div className="rb">
      <header className="rb__bar">
        <span className="rb__kicker">{ui.kicker}</span>
        <Link className="rb__link" to="/cockpit">
          {ui.cockpit}
        </Link>
      </header>

      <main className="rb__main">
        {/* ---------- Who, what, when ---------- */}
        <section className="rb__hero" aria-labelledby="rb-name">
          <h1 id="rb-name">{identity.name}</h1>
          <p className="rb__headline">{recruiter.headline}</p>
          <ul className="rb__badges">
            <li className="rb__badge rb__badge--go">{recruiter.status}</li>
            <li className="rb__badge">{recruiter.availability}</li>
            <li className="rb__badge">{recruiter.location}</li>
            <li className="rb__badge">{recruiter.authorization}</li>
          </ul>
          {recruiter.pitch.map((p) => (
            <p key={p} className="rb__pitch">
              {p}
            </p>
          ))}
          <div className="rb__actions">
            <a
              className="rb__btn rb__btn--primary"
              href={`mailto:${contact.email}`}
              onClick={() => track('recruiter_action', { action: 'email' })}
            >
              {ui.email}
            </a>
            <a
              className="rb__btn"
              href={resume.pdf}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('recruiter_action', { action: 'resume' })}
            >
              {ui.resume}
            </a>
            <ActionButton
              label={ui.copyEmail}
              done={ui.copied}
              onClick={() => navigator.clipboard.writeText(contact.email)}
            />
            <button className="rb__btn" onClick={downloadCard}>
              {ui.saveContact}
            </button>
            {recruiter.scheduleUrl && (
              <a className="rb__btn" href={recruiter.scheduleUrl} target="_blank" rel="noreferrer">
                {ui.schedule}
              </a>
            )}
            <a className="rb__btn" href={contact.linkedin} target="_blank" rel="noreferrer">
              {ui.linkedin}
            </a>
            <a className="rb__btn" href={contact.github} target="_blank" rel="noreferrer">
              {ui.github}
            </a>
          </div>
        </section>

        {/* ---------- Numbers ---------- */}
        <section aria-labelledby="rb-glance">
          <h2 id="rb-glance">{ui.glance}</h2>
          <ul className="rb__stats">
            {recruiter.highlights.map((h) => (
              <li key={h.label} className="rb__stat">
                <span className="rb__stat-value">{h.value}</span>
                <span className="rb__stat-label">{h.label}</span>
                <span className="rb__stat-detail">{h.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Tailor ---------- */}
        <section className="rb__tailor" aria-labelledby="rb-tailor">
          <h2 id="rb-tailor">{ui.tailorTitle}</h2>
          <p className="rb__muted">{ui.tailorHint}</p>
          <div className="rb__chips" role="group" aria-labelledby="rb-tailor">
            <button className="rb__chip" aria-pressed={!focus} onClick={() => choose(null)}>
              {ui.allRoles}
            </button>
            {recruiter.focusAreas.map((f) => (
              <button
                key={f.id}
                className="rb__chip"
                aria-pressed={focus?.id === f.id}
                onClick={() => choose(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* ---------- Experience ---------- */}
        <section aria-labelledby="rb-exp">
          <h2 id="rb-exp">{ui.experience}</h2>
          {internships.map(({ item: c, score, hits }) => (
            <article key={c.id} className="rb__card">
              <header className="rb__card-head">
                <div>
                  <h3>{c.role}</h3>
                  <p className="rb__org">{c.org}</p>
                </div>
                <div className="rb__when">
                  <Match score={score} />
                  <span>
                    {c.start} – {c.end}
                  </span>
                  <span className="rb__muted">{c.realLocation}</span>
                </div>
              </header>
              <ul className="rb__bullets">
                {c.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <Tags skills={chargeSkills(c)} hits={hits} />
            </article>
          ))}
        </section>

        {/* ---------- Projects ---------- */}
        <section aria-labelledby="rb-proj">
          <h2 id="rb-proj">{ui.projects}</h2>
          <div className="rb__grid">
            {projects.map(({ item: p, score, hits }) => (
              <article key={p.id} className="rb__card rb__project">
                {p.media[0] &&
                  (isVideo(p.media[0].src) ? (
                    <video
                      className="rb__media"
                      src={p.media[0].src}
                      poster={p.media[0].still}
                      aria-label={p.media[0].alt}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      className="rb__media"
                      src={p.media[0].src}
                      alt={p.media[0].alt}
                      loading="lazy"
                    />
                  ))}
                <header className="rb__card-head">
                  <h3>{p.title}</h3>
                  <Match score={score} />
                </header>
                <p className="rb__muted">{p.role}</p>
                <p>{p.oneLiner}</p>
                <Tags skills={projectSkills(p)} hits={hits} />
                {p.links.length > 0 && (
                  <p className="rb__links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                        {l.label} ↗
                      </a>
                    ))}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Skills ---------- */}
        <section aria-labelledby="rb-skills">
          <h2 id="rb-skills">{ui.skills}</h2>
          <ul className="rb__skills">
            {skills.map((a) => (
              <li
                key={a.skill}
                className={
                  focus?.skills.includes(a.skill) ? 'rb__skill rb__skill--hit' : 'rb__skill'
                }
              >
                <span className="rb__skill-name">{a.skill}</span>
                <span className="rb__meter" aria-label={`${a.level} / 5`}>
                  <span style={{ width: `${a.level * 20}%` }} />
                </span>
                <span className="rb__muted">
                  {a.years} {ui.years}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="rb__two">
          {/* ---------- Education ---------- */}
          <section aria-labelledby="rb-edu">
            <h2 id="rb-edu">{ui.education}</h2>
            <article className="rb__card">
              <h3>{education.school}</h3>
              <p>
                {education.degree}
                {education.minor ? `, ${ui.minor} ${education.minor}` : ''}
              </p>
              <p className="rb__muted">
                {education.start} – {education.end} · {ui.gpa} {education.gpa}
              </p>
              <ul className="rb__tags">
                {education.courses.map((c) => (
                  <li key={c.code} className="rb__tag">
                    {c.code}: {c.title}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          {/* ---------- Leadership ---------- */}
          <section aria-labelledby="rb-lead">
            <h2 id="rb-lead">{ui.leadership}</h2>
            {leadership.map((c) => (
              <article key={c.id} className="rb__card">
                <h3>
                  {c.role}, {c.org}
                </h3>
                <p className="rb__muted">
                  {c.start} – {c.end}
                </p>
                <ul className="rb__bullets">
                  {c.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </div>

        <div className="rb__two">
          <section aria-labelledby="rb-awards">
            <h2 id="rb-awards">{ui.awards}</h2>
            <ul className="rb__bullets">
              {recruiter.awards.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="rb-looking">
            <h2 id="rb-looking">{ui.lookingFor}</h2>
            <ul className="rb__bullets">
              {recruiter.lookingFor.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* ---------- Take it with you ---------- */}
        <section className="rb__takeaway">
          <ActionButton
            primary
            label={ui.copySummary}
            done={ui.summaryCopied}
            onClick={async () => {
              await navigator.clipboard.writeText(candidateSummary(focus, location.href));
              track('recruiter_action', { action: 'summary' });
            }}
          />
          <ActionButton
            label={ui.share}
            done={ui.shareCopied}
            onClick={() => navigator.clipboard.writeText(location.href)}
          />
          <button className="rb__btn" onClick={() => window.print()}>
            {ui.print}
          </button>
        </section>
      </main>

      <footer className="rb__footer">
        <p>
          {ui.updated} {resume.updated} · {contact.email}
        </p>
        <p className="rb__muted">{lore.disclaimer}</p>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
