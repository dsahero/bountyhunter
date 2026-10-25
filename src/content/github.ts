/**
 * Merges your public GitHub repos (src/content/github.data.ts, written by
 * `npm run sync:github`) into the posters:
 *
 *   - A poster whose links point at a repo gets its Source link (and the
 *     repo's homepage as a Live link) if they're missing.
 *   - A repo that isn't on any poster becomes a basic poster: the repo's
 *     name and description, its languages as the stack (only ones that are
 *     known associates), and links. Hand-written posters always come first;
 *     auto posters only fill slots that are left.
 *
 * To customize an auto poster, copy it into portfolio.ts (with a link to the
 * repo) and edit it there; the hand-written one then takes over.
 */
import type { Portfolio, Propaganda } from './schema';
import synced from './github.data';

interface Repo {
  name: string;
  description: string;
  url: string;
  homepage: string;
  languages: string[];
  topics: string[];
  stars: number;
  pushedAt: string;
}

const STYLES: Propaganda['posterStyle'][] = [
  'target',
  'ship',
  'halftone',
  'planet',
  'emblem',
  'grid',
];
const same = (a: string, b: string) =>
  a.replace(/\/$/, '').toLowerCase() === b.replace(/\/$/, '').toLowerCase();

const pretty = (name: string) =>
  name
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());

interface Options {
  /** Known associate skills (a poster's stack only uses these). */
  skills: readonly string[];
  /** Poster slots on the wall. */
  maxPosters: number;
  /** Wording for auto posters (portfolio.site.githubPosters). */
  text: Portfolio['site']['githubPosters'];
  /** The synced repos (tests pass their own). */
  repos?: Repo[];
}

export function withGitHub(
  posters: Propaganda[],
  { skills, maxPosters, text, repos = (synced as { repos: Repo[] }).repos }: Options,
): Propaganda[] {
  const known = (s: string) => skills.find((k) => k.toLowerCase() === s.toLowerCase());
  const repoFor = (p: Propaganda) => repos.find((r) => p.links.some((l) => same(l.href, r.url)));

  // Fill in missing links on hand-written posters.
  const merged = posters.map((p) => {
    const r = repoFor(p);
    const hasLive = p.links.some(
      (l) => same(l.href, r?.homepage ?? '') || /live|demo|site|app/i.test(l.label),
    );
    if (!r || !r.homepage || hasLive) return p;
    return { ...p, links: [{ label: text.live, href: r.homepage }, ...p.links] };
  });

  // New repos become posters while there's wall space.
  const used = new Set(merged.map(repoFor).filter(Boolean));
  const fresh = repos.filter((r) => !used.has(r) && r.description);
  const room = Math.max(0, maxPosters - merged.length);
  const auto = fresh.slice(0, room).map((r, i): Propaganda => {
    const stack = [...r.languages, ...r.topics].map(known).filter((s): s is string => !!s);
    const updated = new Date(r.pushedAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    return {
      id: `gh-${r.name.toLowerCase()}`,
      title: pretty(r.name),
      slogan: text.slogans[i % text.slogans.length]!,
      oneLiner: r.description,
      description: [r.description],
      stack: stack.length ? [...new Set(stack)] : ['Git'],
      role: text.role.replace('{DATE}', updated),
      links: [
        ...(r.homepage ? [{ label: text.live, href: r.homepage }] : []),
        { label: text.source, href: r.url },
      ],
      media: [],
      bountyValue: 60_000 + r.stars * 10_000,
      posterStyle: STYLES[i % STYLES.length]!,
      classified: false,
    };
  });
  return [...merged, ...auto];
}
