/**
 * In-universe flavor text: title card, opening crawl, labels, quips.
 * Edit freely; none of this is personal data (that lives in portfolio.ts).
 * Tokens like {NAME}, {ALIAS}, {WORLDS}, {REWARD} are filled from
 * portfolio.ts at render time (see content/derived.ts).
 */
export const lore = {
  titleCard: 'A not so long time ago, in a galaxy not so far away....',

  crawl: {
    /** Original wordmark that shrinks into the stars before the crawl (homage to the film opening). */
    logo: ['BOUNTY', 'HUNTER'],
    episode: 'EPISODE CS',
    title: 'A NEW HIRE',
    paragraphs: [
      'It is a period of fierce competition. Across the Outer Rim, corporate guilds wage a silent war for the galaxy’s rarest resource: talent.',
      'The Bounty Guild has posted its richest contract in a generation. The target, a rogue engineer known only as “{NAME}”, has been spotted shipping production code on {WORLDS} separate worlds.',
      'Aboard a battered hunter-class ship, YOU have accepted the contract. Study the dossier. Learn the target’s associates. And whatever you do, bring them in alive....',
    ],
  },

  /** Typed out on the main computer the first time the pilot sits down. */
  contract: [
    'You’re a bounty hunter working the Outer Rim.',
    'The best contracts go to the best talent.',
    'Here is your next target.',
  ],

  /** Real section names paired with their in-universe names. Real name always shown too. */
  sections: {
    about: { real: 'About', lore: 'Wanted Poster' },
    education: { real: 'Education', lore: 'Homeworld & Star Map' },
    experience: { real: 'Experience', lore: 'Charges' },
    leadership: { real: 'Leadership', lore: 'Rebel Cells' },
    projects: { real: 'Projects', lore: 'Rebel Propaganda' },
    skills: { real: 'Skills', lore: 'Known Associates' },
    resume: { real: 'Resume', lore: 'Intelligence File' },
    contact: { real: 'Contact', lore: 'Report a Sighting' },
  },

  quips: {
    resumeDownload: 'I have a good feeling about this.',
    gpa: 'Never tell me the odds.',
    contactSent: 'Bounty claimed. The target has been notified.',
  },

  disclaimer:
    'Unofficial fan project. Not affiliated with or endorsed by Lucasfilm Ltd. or The Walt Disney Company. Star Wars and related terms are trademarks of their respective owners. All artwork, models, and audio on this site are original.',
} as const;

export type SectionKey = keyof typeof lore.sections;
