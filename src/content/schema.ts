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

export const linkSchema = z.object({
  label: nonEmpty,
  href: z.union([url, z.string().startsWith('/'), z.string().startsWith('mailto:')]),
});

export const identitySchema = z.object({
  name: nonEmpty,
  alias: nonEmpty,
  tagline: nonEmpty,
  /** Path under /public, or null to use the generated silhouette portrait. */
  portrait: z.string().startsWith('/').nullable(),
  bio: z.array(nonEmpty).min(1),
  /** "Known traits" revealed by the dossier scanner. */
  traits: z.array(z.object({ label: nonEmpty, value: nonEmpty })).min(1),
  reward: z.object({ amount: z.number().int().positive(), terms: nonEmpty }),
  wantedFor: nonEmpty,
  lastSeen: nonEmpty,
});

export const courseSchema = z.object({
  code: nonEmpty,
  title: nonEmpty,
  /** In-universe moon name orbiting the university planet. */
  moonName: nonEmpty,
  blurb: nonEmpty,
});

export const planetSchema = z.object({
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

export const educationSchema = z.object({
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

export const chargeSchema = z.object({
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

export const archetypeSchema = z.enum(['trooper', 'jedi', 'droid', 'smuggler', 'merc', 'alien']);

export const associateSchema = z.object({
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

export const propagandaSchema = z.object({
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
  media: z.array(z.object({ src: z.string().startsWith('/'), alt: nonEmpty })),
  bountyValue: z.number().int().positive(),
  posterStyle: z.enum(['starburst', 'diagonal', 'silhouette', 'grid']),
  /** Hidden until unlocked by an easter egg. */
  classified: z.boolean(),
});

export const contactSchema = z.object({
  email: z.string().email(),
  github: url,
  linkedin: url,
  other: z.array(linkSchema),
});

export const portfolioSchema = z.object({
  identity: identitySchema,
  education: educationSchema,
  charges: z.array(chargeSchema).min(1),
  associates: z.array(associateSchema).min(1),
  propaganda: z.array(propagandaSchema).min(1),
  contact: contactSchema,
  resume: z.object({ pdf: z.string().startsWith('/'), updated: nonEmpty }),
});

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Identity = z.infer<typeof identitySchema>;
export type Education = z.infer<typeof educationSchema>;
export type Charge = z.infer<typeof chargeSchema>;
export type Associate = z.infer<typeof associateSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type Propaganda = z.infer<typeof propagandaSchema>;
export type Contact = z.infer<typeof contactSchema>;
