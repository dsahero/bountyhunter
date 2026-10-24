import { portfolioSchema } from '../src/content/schema';
import { portfolio } from '../src/content/portfolio';

describe('portfolio content', () => {
  it('matches the schema', () => {
    const result = portfolioSchema.safeParse(portfolio);
    // Print zod's readable issue list if this ever fails.
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it('only lists project tech that exists as a known associate', () => {
    const skills = new Set(portfolio.associates.map((a) => a.skill));
    const unknown = portfolio.propaganda.flatMap((p) => p.stack.filter((s) => !skills.has(s)));
    expect(unknown).toEqual([]);
  });

  it('has unique ids for charges and projects', () => {
    const ids = [...portfolio.charges, ...portfolio.propaganda].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
