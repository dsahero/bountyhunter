/**
 * Things a recruiter can take away from the briefing: a plain-text candidate
 * summary (for an ATS or notes) and a contact card (.vcf).
 */
import { portfolio } from '../content/portfolio';
import { rankCharges, rankProjects, type FocusArea } from './match';

/** A short plain-text summary, tailored to the chosen focus area. */
export function candidateSummary(focus: FocusArea | null, url: string): string {
  const { identity, recruiter, education, contact, propaganda, charges } = portfolio;
  const work = rankCharges(
    charges.filter((c) => c.kind === 'internship'),
    focus,
  ).slice(0, 3);
  const projects = rankProjects(
    propaganda.filter((p) => !p.classified),
    focus,
  ).slice(0, 3);
  return [
    `${identity.name}: ${recruiter.headline}`,
    `${recruiter.status}. ${recruiter.availability}. ${recruiter.location}. ${recruiter.authorization}.`,
    `${education.degree}, ${education.school} (${education.gpa}).`,
    '',
    'Highlights:',
    ...recruiter.highlights.map((h) => `- ${h.value} ${h.label}: ${h.detail}`),
    '',
    `Experience${focus ? ` (most relevant to ${focus.label})` : ''}:`,
    ...work.map(({ item: c }) => `- ${c.role}, ${c.org} (${c.start} to ${c.end})`),
    '',
    'Projects:',
    ...projects.map(({ item: p }) => `- ${p.title}: ${p.oneLiner}`),
    '',
    `Contact: ${contact.email} · ${contact.linkedin} · ${contact.github}`,
    `Briefing: ${url}`,
  ].join('\n');
}

/** A vCard 3.0 contact card. */
export function contactCard(): string {
  const { identity, contact, recruiter, education } = portfolio;
  const [first, ...rest] = identity.name.split(' ');
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1');
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(rest.join(' '))};${esc(first ?? '')};;;`,
    `FN:${esc(identity.name)}`,
    `TITLE:${esc(recruiter.headline)}`,
    `ORG:${esc(education.school)}`,
    `EMAIL;TYPE=INTERNET:${contact.email}`,
    `URL:${contact.linkedin}`,
    `URL:${contact.github}`,
    `NOTE:${esc(`${recruiter.status}. ${recruiter.availability}.`)}`,
    'END:VCARD',
  ].join('\r\n');
}
