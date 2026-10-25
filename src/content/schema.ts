/**
 * Content schema for the whole site.
 *
 * Every view (cinematic cockpit, 2D fallback, plain dossier) reads from one
 * `portfolio` object that must satisfy this schema. zod gives us both the
 * TypeScript types (via z.infer) and a runtime check, so a typo in
 * portfolio.ts fails the test suite / build instead of breaking a hologram.
 *
 * App code imports only the *types* from here (`import type`), so zod itself
 * is never shipped to the browser. Runtime validation lives in tests/.
 */
import { z } from 'zod';

const url = z.string().url();
const nonEmpty = z.string().min(1);

const linkSchema = z.object({
  label: nonEmpty,
  href: z.union([url, z.string().startsWith('/'), z.string().startsWith('mailto:')]),
});

const identitySchema = z.object({
  name: nonEmpty,
  alias: nonEmpty,
  tagline: nonEmpty,
  /**
   * Your photo: a path under /public or a web address (loaded live, so it
   * follows your profile). Null shows a silhouette.
   */
  portrait: z.string().nullable(),
  /** Tried if `portrait` can't be loaded (e.g. your GitHub avatar). */
  portraitFallback: z.string().nullable(),
  /** Optional 3D scan (.glb under /public) shown as the wanted hologram. */
  scanModel: z.string().startsWith('/').nullable(),
  bio: z.array(nonEmpty).min(1),
  /** "Known traits" revealed by the dossier scanner. */
  traits: z.array(z.object({ label: nonEmpty, value: nonEmpty })).min(1),
  reward: z.object({ amount: z.number().int().positive(), terms: nonEmpty }),
  wantedFor: nonEmpty,
  lastSeen: nonEmpty,
});

const courseSchema = z.object({
  code: nonEmpty,
  title: nonEmpty,
  /** In-universe moon name orbiting the university planet. */
  moonName: nonEmpty,
  blurb: nonEmpty,
});

const planetSchema = z.object({
  name: nonEmpty,
  /** The real-world place this planet stands in for. */
  realLocation: nonEmpty,
  /** In-universe coordinates, e.g. "Blacksburg Sector, Virginia System". */
  coords: nonEmpty,
  /** Hex color used for the planet hologram. */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Position on the galaxy star map, normalized to [-1, 1]. */
  position: z.tuple([z.number().min(-1).max(1), z.number().min(-1).max(1)]),
  lore: nonEmpty,
});

const educationSchema = z.object({
  school: nonEmpty,
  degree: nonEmpty,
  specialization: nonEmpty,
  minor: nonEmpty,
  start: nonEmpty,
  end: nonEmpty,
  gpa: nonEmpty,
  honors: z.array(nonEmpty),
  planet: planetSchema,
  courses: z.array(courseSchema).min(1),
});

const chargeSchema = z.object({
  id: nonEmpty,
  kind: z.enum(['internship', 'leadership']),
  org: nonEmpty,
  /** Optional short name for tight spaces (labels, buttons). Defaults to the text before the first comma. */
  shortOrg: z.string().min(1).optional(),
  role: nonEmpty,
  start: nonEmpty,
  end: nonEmpty,
  realLocation: nonEmpty,
  planet: planetSchema.omit({ realLocation: true }),
  /** In-universe charge, e.g. "Infiltration of a corporate data fortress". */
  chargeTitle: nonEmpty,
  /** Real accomplishments, presented as "evidence". */
  evidence: z.array(nonEmpty).min(1),
  /** 1-5, drives the severity bar. */
  severity: z.number().int().min(1).max(5),
});

const archetypeSchema = z.enum(['trooper', 'jedi', 'droid', 'smuggler', 'merc', 'alien']);

const associateSchema = z.object({
  /** The real skill, e.g. "Python". */
  skill: nonEmpty,
  callsign: nonEmpty,
  archetype: archetypeSchema,
  rank: nonEmpty,
  /** Any group name; units are derived from whatever the associates use. */
  unit: nonEmpty,
  /** Proficiency 1-5, shown as "association level". */
  level: z.number().int().min(1).max(5),
  years: z.number().min(0),
  /** One-line in-universe dossier note. */
  note: nonEmpty,
  /** Hex accent for the bust's rank stripe / markings. */
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const propagandaSchema = z.object({
  id: nonEmpty,
  title: nonEmpty,
  /** Poster slogan, all-caps propaganda energy. */
  slogan: nonEmpty,
  oneLiner: nonEmpty,
  description: z.array(nonEmpty).min(1),
  /** Skills used; should match associate `skill` names so they cross-link. */
  stack: z.array(nonEmpty).min(1),
  role: nonEmpty,
  links: z.array(linkSchema),
  /**
   * Screenshots or short clips (.mp4/.webm play muted on a loop, on the
   * poster and in the transmission). `still` is an optional preview image.
   */
  media: z.array(
    z.object({ src: z.string().startsWith('/'), alt: nonEmpty, still: z.string().optional() }),
  ),
  bountyValue: z.number().int().positive(),
  /** Poster artwork layout. */
  posterStyle: z.enum([
    'starburst',
    'diagonal',
    'silhouette',
    'grid',
    'target',
    'ship',
    'halftone',
    'planet',
    'emblem',
  ]),
  /** Poster inks; leave out to pick one from the project id. */
  posterPalette: z
    .enum(['rust', 'navy', 'parchment', 'neon', 'jungle', 'violet', 'crimson', 'sand'])
    .optional(),
  /** Hidden until unlocked by an easter egg. */
  classified: z.boolean(),
});

const contactSchema = z.object({
  email: z.string().email(),
  github: url,
  linkedin: url,
  other: z.array(linkSchema),
});

// ---------------------------------------------------------------------------
// Site copy (portfolio.site): all non-personal text on the site.
// ---------------------------------------------------------------------------
const lines = z.array(nonEmpty).min(1);
const section = z.object({ real: nonEmpty, lore: nonEmpty });

export const SECTION_KEYS = [
  'about',
  'education',
  'experience',
  'leadership',
  'projects',
  'skills',
  'resume',
  'contact',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

const propText = z.object({ label: nonEmpty, blurb: nonEmpty });

const siteSchema = z.object({
  gate: z.object({
    kicker: nonEmpty,
    title: nonEmpty,
    subtitle: nonEmpty,
    enterWithSound: nonEmpty,
    enterSilently: nonEmpty,
    reducedMotionOn: nonEmpty,
    reducedMotionOff: nonEmpty,
    useReducedMotion: nonEmpty,
    useFullMotion: nonEmpty,
  }),
  titleCard: nonEmpty,
  crawl: z.object({
    logo: lines,
    episode: nonEmpty,
    title: nonEmpty,
    paragraphs: lines,
    continue: nonEmpty,
  }),
  contract: lines,
  sections: z.object({
    about: section,
    education: section,
    experience: section,
    leadership: section,
    projects: section,
    skills: section,
    resume: section,
    contact: section,
  }),
  hud: z.object({
    kicker: nonEmpty,
    sound: nonEmpty,
    on: nonEmpty,
    off: nonEmpty,
    volume: nonEmpty,
    motion: nonEmpty,
    motionFull: nonEmpty,
    motionReduced: nonEmpty,
    captions: nonEmpty,
    settings: nonEmpty,
    recruiter: nonEmpty,
    replay: nonEmpty,
    plainDossier: nonEmpty,
    skipIntro: nonEmpty,
    lowPower: nonEmpty,
  }),
  console: z.object({
    header: nonEmpty,
    status: nonEmpty,
    incoming: nonEmpty,
    files: nonEmpty,
    wanted: nonEmpty,
    call: nonEmpty,
    holoOff: nonEmpty,
    holoOn: nonEmpty,
    contactsTitle: nonEmpty,
    hangUp: nonEmpty,
    fireBlaster: nonEmpty,
    fireTorpedo: nonEmpty,
    /** Screen-reader list of the clickable things in the cockpit. */
    objects: nonEmpty,
    /** The menu's extra apps (page 2) and its page flipper. */
    achievements: nonEmpty,
    guestbook: nonEmpty,
    guestbookSub: nonEmpty,
    prevPage: nonEmpty,
    nextPage: nonEmpty,
    page: nonEmpty,
    share: nonEmpty,
    shared: nonEmpty,
    footer: nonEmpty,
  }),
  panel: z.object({ back: nonEmpty, console: nonEmpty }),
  labels: z.object({
    knownTraits: nonEmpty,
    wantedFor: nonEmpty,
    lastSeen: nonEmpty,
    academyRecord: nonEmpty,
    school: nonEmpty,
    degree: nonEmpty,
    dates: nonEmpty,
    gpa: nonEmpty,
    honors: nonEmpty,
    moons: nonEmpty,
    next: nonEmpty,
    evidence: nonEmpty,
    severity: nonEmpty,
    internshipKind: nonEmpty,
    leadershipKind: nonEmpty,
    experienceHint: nonEmpty,
    association: nonEmpty,
    associationLevels: z.array(z.string()).length(6),
    /** Plain-English skill levels for the plain dossier and resume (index 1-5). */
    proficiencyLevels: z.array(z.string()).length(6),
    servedWith: nonEmpty,
    jointOperations: nonEmpty,
    postersIntro: nonEmpty,
    allPosters: nonEmpty,
    transmission: nonEmpty,
    encrypted: nonEmpty,
    encryptedTitle: nonEmpty,
    encryptedBody: nonEmpty,
    classified: nonEmpty,
    associatesInvolved: nonEmpty,
    role: nonEmpty,
    bountyValue: nonEmpty,
    credits: nonEmpty,
    contactTag: nonEmpty,
    contactLead: nonEmpty,
    email: nonEmpty,
    github: nonEmpty,
    linkedin: nonEmpty,
    yourName: nonEmpty,
    message: nonEmpty,
    transmit: nonEmpty,
    transmitNote: nonEmpty,
    bountyClaimed: nonEmpty,
    downloadPdf: nonEmpty,
    plainText: nonEmpty,
    updated: nonEmpty,
    resumeSections: z.object({
      education: nonEmpty,
      experience: nonEmpty,
      leadership: nonEmpty,
      projects: nonEmpty,
      skills: nonEmpty,
    }),
  }),
  screens: z.object({ warrant: lines, comms: lines, datapad: lines }),
  holograms: z.object({ wanted: nonEmpty, currency: nonEmpty }),
  droidHints: lines,
  helmet: z.object({ label: nonEmpty, blurb: nonEmpty }),
  /**
   * The Call button's contacts. `cat` starts a holocall; `voicemail` rings,
   * then plays the contact's greeting (lines shown as subtitles, spoken in a
   * synthesized `voice`), then the tone.
   */
  contacts: z
    .array(
      z.object({
        name: nonEmpty,
        icon: nonEmpty,
        kind: z.enum(['voicemail', 'cat']),
        voice: z.enum(['deep', 'human', 'high', 'droid', 'alien']).optional(),
        greeting: z.array(nonEmpty).optional(),
      }),
    )
    .min(1),
  /** Greeting for a voicemail contact without its own. */
  voicemail: nonEmpty,
  attack: z.object({
    guitarTitle: nonEmpty,
    guitarBlurb: nonEmpty,
    caller: nonEmpty,
    alert: nonEmpty,
    terminalTitle: nonEmpty,
    skipStage: nonEmpty,
    shields: nonEmpty,
    progress: nonEmpty,
    games: z.object({
      firewall: z.object({ title: nonEmpty, help: nonEmpty }),
      typing: z.object({ title: nonEmpty, help: nonEmpty, words: z.array(nonEmpty).min(3) }),
      cargo: z.object({ title: nonEmpty, help: nonEmpty }),
    }),
    won: nonEmpty,
  }),
  captions: z.object({
    roar: nonEmpty,
    ventOpen: nonEmpty,
    grateOpen: nonEmpty,
    boot: nonEmpty,
    blaster: nonEmpty,
    torpedo: nonEmpty,
    ring: nonEmpty,
    voicemail: nonEmpty,
    meow: nonEmpty,
    hangUp: nonEmpty,
    alarm: nonEmpty,
    lightsOut: nonEmpty,
    lightsOn: nonEmpty,
    win: nonEmpty,
    helmet: nonEmpty,
    holoOff: nonEmpty,
    holoOn: nonEmpty,
    pickUp: nonEmpty,
    rumble: nonEmpty,
    screech: nonEmpty,
  }),
  /** Music files (paths under /public). Empty uses the built-in placeholder synth. */
  audio: z.object({
    crawl: z.string(),
    arrival: z.string(),
    cockpit: z.string(),
    alarm: z.string(),
  }),
  picture: z.object({ caption: nonEmpty }),
  /**
   * The site's public address (e.g. https://lihi.dev), used for link
   * previews; leave empty until the domain is final.
   */
  siteUrl: z.string(),
  /** Little goals for exploring the cockpit (the Achievements board). */
  achievements: z
    .array(
      z.object({
        id: nonEmpty,
        title: nonEmpty,
        description: nonEmpty,
        icon: nonEmpty,
        /** Shown instead while it's locked (a hint that doesn't spoil the surprise). */
        locked: z.object({ title: nonEmpty, description: nonEmpty }).optional(),
      }),
    )
    .min(1),
  achievementsText: z.object({
    intro: nonEmpty,
    toast: nonEmpty,
    progress: nonEmpty,
    locked: nonEmpty,
    reset: nonEmpty,
  }),
  /** The guestbook ("the hunter's log"): wording for the form and messages. */
  guestbook: z.object({
    intro: nonEmpty,
    name: nonEmpty,
    message: nonEmpty,
    sign: nonEmpty,
    signing: nonEmpty,
    thanks: nonEmpty,
    empty: nonEmpty,
    offline: nonEmpty,
    tooFast: nonEmpty,
    invalid: nonEmpty,
  }),
  /** Screen-reader labels (never shown, but read aloud). */
  a11y: z.object({
    timeline: nonEmpty,
    introControls: nonEmpty,
    openingCrawl: nonEmpty,
    contactLinks: nonEmpty,
    sections: nonEmpty,
    typeCodes: nonEmpty,
    cargoControls: nonEmpty,
  }),
  /** Text drawn by the defense-terminal games and their touch controls. */
  terminalUi: z.object({
    intruder: nonEmpty,
    hold: nonEmpty,
    next: nonEmpty,
    cargoHelp: z.array(nonEmpty),
    typePlaceholder: nonEmpty,
    touch: z.object({
      hold: nonEmpty,
      slam: nonEmpty,
      holdAria: nonEmpty,
      leftAria: nonEmpty,
      rotateAria: nonEmpty,
      rightAria: nonEmpty,
      dropAria: nonEmpty,
      slamAria: nonEmpty,
    }),
  }),
  /** Wording for posters made automatically from GitHub repos (src/content/github.ts). */
  githubPosters: z.object({
    slogans: z.array(nonEmpty).min(1),
    live: nonEmpty,
    source: nonEmpty,
    /** {DATE} becomes the month of the last push. */
    role: nonEmpty,
  }),
  /** Rubber stamps that land on some posters. */
  posterStamps: z.array(nonEmpty),
  /** Said when you press one of the cockpit's many unlabeled square buttons. */
  buttonQuips: z.array(nonEmpty).min(1),
  /** Flavor text for each tchotchke (click one to read it). */
  props: z.object({
    levers: propText,
    switches: propText,
    dice: propText,
    mug: propText,
    plant: propText,
    bobble: propText,
    picture: propText,
  }),
  /** Labels for the recruiter briefing page. */
  recruiterUi: z.object({
    kicker: nonEmpty,
    metaTitle: nonEmpty,
    tailorTitle: nonEmpty,
    tailorHint: nonEmpty,
    allRoles: nonEmpty,
    strongMatch: nonEmpty,
    goodMatch: nonEmpty,
    glance: nonEmpty,
    experience: nonEmpty,
    projects: nonEmpty,
    skills: nonEmpty,
    education: nonEmpty,
    leadership: nonEmpty,
    awards: nonEmpty,
    lookingFor: nonEmpty,
    email: nonEmpty,
    copyEmail: nonEmpty,
    copied: nonEmpty,
    resume: nonEmpty,
    saveContact: nonEmpty,
    schedule: nonEmpty,
    copySummary: nonEmpty,
    summaryCopied: nonEmpty,
    print: nonEmpty,
    share: nonEmpty,
    shareCopied: nonEmpty,
    cockpit: nonEmpty,
    years: nonEmpty,
    updated: nonEmpty,
    entry: nonEmpty,
    linkedin: nonEmpty,
    github: nonEmpty,
    gpa: nonEmpty,
    minor: nonEmpty,
  }),
  plain: z.object({
    kicker: nonEmpty,
    skipToContent: nonEmpty,
    enterCockpit: nonEmpty,
    downloadResume: nonEmpty,
    internships: nonEmpty,
    rebelCell: nonEmpty,
    charge: nonEmpty,
    homeworld: nonEmpty,
  }),
  quips: z.object({ resumeDownload: nonEmpty, gpa: nonEmpty, contactSent: nonEmpty }),
  disclaimer: nonEmpty,
});

/** The recruiter briefing (/recruiter): the facts a recruiter scans for first. */
const recruiterSchema = z.object({
  headline: nonEmpty,
  /** What you're looking for and when (shown as a badge). */
  status: nonEmpty,
  availability: nonEmpty,
  location: nonEmpty,
  /** Work authorization / clearance line (only what you're comfortable sharing). */
  authorization: nonEmpty,
  /** Two or three sentences: who you are and what you bring. */
  pitch: z.array(nonEmpty).min(1),
  /** Headline numbers, each backed by a line on the resume. */
  highlights: z.array(z.object({ value: nonEmpty, label: nonEmpty, detail: nonEmpty })).min(1),
  /**
   * The roles you fit. Picking one tailors the page: experience, projects,
   * and skills are ranked by how much they use these skills / mention these
   * keywords.
   */
  focusAreas: z
    .array(
      z.object({
        id: nonEmpty,
        label: nonEmpty,
        skills: z.array(nonEmpty),
        keywords: z.array(nonEmpty),
      }),
    )
    .min(1),
  /** Awards and recognition, one line each. */
  awards: z.array(nonEmpty),
  /** "What I'm looking for": a few short lines. */
  lookingFor: z.array(nonEmpty),
  /** Optional booking link (Calendly etc.); empty hides the button. */
  scheduleUrl: z.string(),
});

export const portfolioSchema = z.object({
  identity: identitySchema,
  education: educationSchema,
  charges: z.array(chargeSchema).min(1),
  associates: z.array(associateSchema).min(1),
  /** At most 12: one per poster slot (hub/layout.ts POSTER_SLOTS). */
  propaganda: z
    .array(propagandaSchema)
    .min(1)
    .max(12, 'Too many posters: add slots to POSTER_SLOTS in src/hub/layout.ts'),
  contact: contactSchema,
  resume: z.object({ pdf: z.string().startsWith('/'), updated: nonEmpty }),
  recruiter: recruiterSchema,
  /** All non-personal site copy (crawl, labels, captions, ...). */
  site: siteSchema,
});

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Charge = z.infer<typeof chargeSchema>;
export type Associate = z.infer<typeof associateSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type Propaganda = z.infer<typeof propagandaSchema>;
export type Contact = z.infer<typeof contactSchema>;
