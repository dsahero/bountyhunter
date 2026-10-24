/**
 * Values derived from portfolio.ts, so nothing personal is ever typed twice.
 * Flavor text in lore.ts can use these tokens and they're filled in here:
 *   {NAME}     identity.name, uppercased
 *   {ALIAS}    identity.alias, uppercased
 *   {WORLDS}   how many different planets the experience happened on, in words
 *   {REWARD}   the bounty, formatted ("1,000,000")
 */
import { portfolio } from './portfolio';
import type { Charge } from './schema';

/** Short display name for an organization (explicit `shortOrg`, else the text before the first comma). */
export function orgLabel(c: Pick<Charge, 'org' | 'shortOrg'>): string {
  return c.shortOrg ?? c.org.split(',')[0]!;
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function rewardText(): string {
  return portfolio.identity.reward.amount.toLocaleString('en-US');
}

export function fillTokens(text: string): string {
  const worlds = new Set(
    portfolio.charges.filter((c) => c.kind === 'internship').map((c) => c.planet.name),
  ).size;
  return text
    .replaceAll('{NAME}', portfolio.identity.name.toUpperCase())
    .replaceAll('{ALIAS}', portfolio.identity.alias.toUpperCase())
    .replaceAll('{WORLDS}', WORDS[worlds] ?? String(worlds))
    .replaceAll('{REWARD}', rewardText());
}
