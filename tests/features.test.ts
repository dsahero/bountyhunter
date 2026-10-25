import { parsePath, pathFor } from '../src/app/deepLinks';
import { useHub } from '../src/state/hub';
import { ACHIEVEMENT_IDS, useAchievements } from '../src/state/achievements';
import { consoleItems, FILES_PER_PAGE, menuPageCount } from '../src/hub/consoleModel';
import { withGitHub } from '../src/content/github';
import { validateEntry } from '../src/guestbook/shared';
import { portfolio } from '../src/content/portfolio';
import { SECTION_KEYS } from '../src/content/schema';

describe('deep links', () => {
  it('parses shareable paths', () => {
    expect(parsePath('/')).toBeNull();
    expect(parsePath('/nope')).toBeNull();
    expect(parsePath('/cockpit')).toEqual({});
    expect(parsePath('/projects/dietre')).toEqual({ station: 'projects', item: 'dietre' });
    expect(parsePath('/skills/Python')).toEqual({ station: 'skills', item: 'python' });
    expect(parsePath('/guestbook')).toEqual({ app: 'guestbook' });
  });

  it('builds the path for what is on screen', () => {
    useHub.getState().selectProject('dietre');
    expect(pathFor()).toBe('/projects/dietre');
    useHub.getState().openApp('achievements');
    expect(pathFor()).toBe('/achievements');
    useHub.getState().close();
    expect(pathFor()).toBe('/cockpit');
  });
});

describe('achievements', () => {
  beforeEach(() => useAchievements.getState().reset());

  it('every achievement the code awards has wording in the content file', () => {
    const ids = portfolio.site.achievements.map((a) => a.id);
    for (const id of ACHIEVEMENT_IDS) expect(ids).toContain(id);
  });

  it('opening every station unlocks Full Dossier', () => {
    for (const s of SECTION_KEYS) useHub.getState().open(s);
    expect(useAchievements.getState().unlocked).toContain('all-stations');
  });

  it('counters unlock at their goal', () => {
    for (let i = 0; i < 9; i++) useAchievements.getState().count('buttons', 10);
    expect(useAchievements.getState().unlocked).not.toContain('buttons');
    useAchievements.getState().count('buttons', 10);
    expect(useAchievements.getState().unlocked).toContain('buttons');
  });

  it('unlocking everything else awards Most Wanted', () => {
    ACHIEVEMENT_IDS.filter((id) => id !== 'completionist').forEach((id) =>
      useAchievements.getState().unlock(id),
    );
    expect(useAchievements.getState().unlocked).toContain('completionist');
  });
});

describe('console menu pages', () => {
  it('flips between pages and every file is on exactly one page', () => {
    const pages = menuPageCount();
    expect(pages).toBeGreaterThan(1);
    const seen = new Set<string>();
    const filesById = new Map<string, { label: string; sub?: string }>();
    for (let p = 0; p < pages; p++) {
      const files = consoleItems('menu', false, false, p).filter((i) => i.kind === 'station');
      expect(files.length).toBeLessThanOrEqual(FILES_PER_PAGE);
      files.forEach((f) => {
        seen.add(f.id);
        filesById.set(f.id, f);
      });
    }
    expect(seen.has('app:achievements')).toBe(true);
    expect(seen.has('app:guestbook')).toBe(true);
    for (const key of SECTION_KEYS) {
      expect(filesById.get(`station:${key}`)).toEqual({
        id: `station:${key}`,
        label: portfolio.site.sections[key].real,
        sub: portfolio.site.sections[key].lore,
        kind: 'station',
      });
    }
    // The 2D console lists everything at once.
    expect(consoleItems('menu', false, false, 0, false).filter((i) => i.kind === 'pager')).toEqual(
      [],
    );
  });
});

describe('GitHub sync', () => {
  const repo = (name: string, extra: object = {}) => ({
    name,
    description: `${name} does things`,
    url: `https://github.com/me/${name}`,
    homepage: '',
    languages: ['Python', 'Brainfuck'],
    topics: [],
    stars: 0,
    pushedAt: '2026-01-01T00:00:00Z',
    ...extra,
  });
  const skills = portfolio.associates.map((a) => a.skill);

  it('adds new repos as posters with known skills only, up to the slot limit', () => {
    const base = portfolio.propaganda.slice(0, 2);
    const text = portfolio.site.githubPosters;
    const out = withGitHub(base, {
      skills,
      maxPosters: 3,
      text,
      repos: [repo('alpha'), repo('beta')],
    });
    expect(out).toHaveLength(3);
    expect(out[2]!.title).toBe('Alpha');
    expect(out[2]!.stack).toEqual(['Python']);
  });

  it('adds a Live link to a poster that points at its repo', () => {
    const p = {
      ...portfolio.propaganda[0]!,
      links: [{ label: 'Source', href: 'https://github.com/me/alpha' }],
    };
    const [merged] = withGitHub([p], {
      skills,
      maxPosters: 5,
      text: portfolio.site.githubPosters,
      repos: [repo('alpha', { homepage: 'https://alpha.dev' })],
    });
    expect(merged!.links[0]).toEqual({
      label: portfolio.site.githubPosters.live,
      href: 'https://alpha.dev',
    });
  });
});

describe('guestbook validation', () => {
  it('accepts a normal entry and trims it', () => {
    expect(validateEntry({ name: '  Han  ', message: 'Great ship!' })).toEqual({
      name: 'Han',
      message: 'Great ship!',
    });
  });
  it('rejects bots, links, slurs, and blanks', () => {
    expect(validateEntry({ name: 'x', message: 'hi', website: 'spam.com' })).toBeNull();
    expect(validateEntry({ name: 'x', message: 'visit https://spam.example' })).toBeNull();
    expect(validateEntry({ name: 'x', message: 'shit' })).toBeNull();
    expect(validateEntry({ name: '', message: 'hi' })).toBeNull();
  });
});
