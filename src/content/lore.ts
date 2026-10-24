/**
 * Back-compat alias: all site copy now lives in portfolio.ts under `site`.
 * Import `lore` (or `portfolio.site`) anywhere you need on-screen text.
 */
import { portfolio } from './portfolio';
export type { SectionKey } from './schema';

export const lore = portfolio.site;
