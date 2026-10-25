import { portfolio } from '../src/content/portfolio';
import { focusById, matchLevel, rankCharges, rankProjects, skillsIn } from '../src/recruiter/match';
import { candidateSummary, contactCard } from '../src/recruiter/exports';

const internships = portfolio.charges.filter((c) => c.kind === 'internship');

describe('recruiter matching', () => {
  it('finds skills named in text, without false hits', () => {
    expect(skillsIn('Built with Angular and RxJS on Kubernetes')).toEqual(
      expect.arrayContaining(['Angular', 'RxJS', 'Kubernetes']),
    );
    // "C" is not hiding inside C++ or C#, or inside words.
    expect(skillsIn('Written in C++ and C#, see Chapter 3')).not.toContain('C');
    expect(skillsIn('Written in C++ and C#')).toEqual(expect.arrayContaining(['C++', 'C#']));
  });

  it('ranks the ML research first for ML roles, and the full-stack internship for full-stack', () => {
    expect(rankCharges(internships, focusById('ml'))[0]!.item.id).toBe('hume');
    expect(rankCharges(internships, focusById('fullstack'))[0]!.item.id).toBe('nswc');
  });

  it('keeps the original order with no focus', () => {
    const ranked = rankProjects(portfolio.propaganda, null);
    expect(ranked.map((r) => r.item.id)).toEqual(portfolio.propaganda.map((p) => p.id));
    expect(ranked.every((r) => r.score === 0)).toBe(true);
  });

  it('labels match strength', () => {
    expect(matchLevel(0)).toBeNull();
    expect(matchLevel(2)).toBe('good');
    expect(matchLevel(6)).toBe('strong');
  });

  it('every focus area uses real skills', () => {
    const skills = new Set(portfolio.associates.map((a) => a.skill));
    for (const f of portfolio.recruiter.focusAreas)
      for (const s of f.skills) expect(skills.has(s), `${f.id}: ${s}`).toBe(true);
  });
});

describe('recruiter takeaways', () => {
  it('writes a tailored plain-text summary with contact details', () => {
    const text = candidateSummary(focusById('ml'), 'https://example.com/recruiter?focus=ml');
    expect(text).toContain(portfolio.identity.name);
    expect(text).toContain(portfolio.contact.email);
    expect(text).toContain('most relevant to ML');
    expect(text).toContain('https://example.com/recruiter?focus=ml');
  });

  it('builds a valid vCard', () => {
    const card = contactCard();
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true);
    expect(card).toContain(`EMAIL;TYPE=INTERNET:${portfolio.contact.email}`);
    expect(card.endsWith('END:VCARD')).toBe(true);
  });
});
