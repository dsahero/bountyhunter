/**
 * Tailoring the recruiter briefing to a role: scores experience, projects,
 * and skills against a focus area (portfolio.recruiter.focusAreas) by the
 * skills they use and the keywords they mention. Pure functions, so the
 * ranking is easy to test and identical on the server and in the browser.
 */
import { portfolio } from '../content/portfolio';
import type { Charge, Propaganda } from '../content/schema';

export type FocusArea = (typeof portfolio.recruiter.focusAreas)[number];

const SKILLS = portfolio.associates.map((a) => a.skill);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Skill names mentioned in a piece of text (word-bounded; short names like "C" match exactly). */
export function skillsIn(text: string, skills: readonly string[] = SKILLS): string[] {
  return skills.filter((s) => {
    const short = s.length <= 2;
    const re = new RegExp(`(^|[^\\w+#])${escape(s)}(?![\\w+#])`, short ? '' : 'i');
    return re.test(text);
  });
}

const chargeText = (c: Charge) => [c.role, c.org, ...c.evidence].join(' ');
const projectText = (p: Propaganda) =>
  [p.title, p.oneLiner, ...p.description, ...p.stack].join(' ');

/** Skills an experience or project shows (stated stack, plus any named in the text). */
export const chargeSkills = (c: Charge) => skillsIn(chargeText(c));
export const projectSkills = (p: Propaganda) => [
  ...new Set([...p.stack, ...skillsIn(projectText(p))]),
];

export interface Scored<T> {
  item: T;
  score: number;
  /** The focus skills/keywords it hit (shown as highlighted tags). */
  hits: string[];
}

function score(text: string, skills: string[], focus: FocusArea | null) {
  if (!focus) return { score: 0, hits: [] };
  const skillHits = skills.filter((s) => focus.skills.includes(s));
  // Whole words only (so "AI" doesn't match inside "maintain").
  const keywordHits = focus.keywords.filter((k) => new RegExp(`\\b${escape(k)}\\b`, 'i').test(text));
  return { score: skillHits.length * 2 + keywordHits.length, hits: skillHits };
}

/** Most relevant first (stable: equal scores keep their original order). */
function rank<T>(
  items: T[],
  text: (t: T) => string,
  skills: (t: T) => string[],
  focus: FocusArea | null,
) {
  return items
    .map((item, i) => ({ item, i, ...score(text(item), skills(item), focus) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ item, score, hits }): Scored<T> => ({ item, score, hits }));
}

export const rankCharges = (list: Charge[], focus: FocusArea | null) =>
  rank(list, chargeText, chargeSkills, focus);

export const rankProjects = (list: Propaganda[], focus: FocusArea | null) =>
  rank(list, projectText, projectSkills, focus);

/** "Strong match" / "Relevant" / nothing, from a score. */
export function matchLevel(score: number): 'strong' | 'good' | null {
  if (score >= 4) return 'strong';
  if (score >= 1) return 'good';
  return null;
}

export const focusById = (id: string | null) =>
  portfolio.recruiter.focusAreas.find((f) => f.id === id) ?? null;
