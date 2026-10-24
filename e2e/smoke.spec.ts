import { expect, test, type Page } from '@playwright/test';
import { portfolio } from '../src/content/portfolio';

const NAME = portfolio.identity.name;
const FIRST_ORG = portfolio.charges[0]!.org;

/** Fail the test on any console error or uncaught exception (e.g. hydration mismatches). */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('plain dossier is server-rendered and hydrates cleanly', async ({ page, browser }) => {
  const errors = trackErrors(page);
  await page.goto('/dossier');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME);
  await expect(page.getByRole('heading', { name: /Experience/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Resume (PDF)', exact: true })).toHaveAttribute(
    'href',
    '/resume.pdf',
  );
  expect(errors).toEqual([]);

  // Works without JavaScript.
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const p2 = await noJs.newPage();
  await p2.goto('/dossier');
  await expect(p2.getByText(FIRST_ORG).first()).toBeVisible();
  await noJs.close();
});

test('skip intro lands in the hub and is remembered on reload', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Incoming Contract' })).toBeVisible();
  await page.getByRole('button', { name: /Skip intro/ }).click();
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible();
  await expect(page.getByRole('button', { name: /Skip intro/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Replay intro' }).click();
  await expect(page.getByRole('heading', { name: 'Incoming Contract' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('full intro plays through the 3D scenes into the cockpit', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter silently' }).click();
  await expect(page.getByText(/A not so long time ago/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Opening crawl' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: /Continue/ }).click({ timeout: 10_000 });
  // The arrival runs ~45s (slowed for pacing), then the HUD appears over the cockpit.
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible({ timeout: 120_000 });
  // The briefing types out, then becomes the dossier menu.
  await expect(page.getByRole('button', { name: /Show target|Charges/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('cockpit stations open from the computer and close with Esc', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  // Skip the briefing if it's still typing; otherwise the menu is already up.
  await page
    .getByRole('button', { name: /Show target|Charges/ })
    .first()
    .waitFor({ timeout: 30_000 });
  const showTarget = page.getByRole('button', { name: /Show target/ });
  // In-world buttons ride the camera's breathing bob, so they're never "stable": force the click.
  if (await showTarget.isVisible()) await showTarget.click({ force: true });
  await page.getByRole('button', { name: /Charges/ }).click({ force: true });
  await expect(page.getByRole('heading', { name: 'Charges' })).toBeVisible();
  await expect(page.getByText(FIRST_ORG).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Charges' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('arrow keys and Enter drive the console', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  const showTarget = page.getByRole('button', { name: /Show target/ });
  await page
    .getByRole('button', { name: /Show target|Charges/ })
    .first()
    .waitFor({ timeout: 30_000 });
  if (await showTarget.isVisible()) await showTarget.click({ force: true });
  await page.getByRole('button', { name: /Charges/ }).waitFor();
  await page.keyboard.press('ArrowDown'); // -> second file
  await page.keyboard.press('ArrowDown'); // -> third file
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: /Charges|Homeworld|Wanted/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.panel')).toHaveCount(0);
});

test('devices without WebGL get the 2D cockpit', async ({ page }) => {
  await page.goto('/?tier=none');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  await expect(page.getByText(/Low-power mode/)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('reduced motion shows a static crawl', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  // Full motion is the default; the start screen offers reduced motion when the OS asks for it.
  await page.getByRole('button', { name: 'Use reduced motion' }).click();
  await page.getByRole('button', { name: 'Enter silently' }).click();
  await expect(page.getByRole('region', { name: 'Opening crawl' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('.crawl__static')).toBeVisible();
  await expect(page.locator('.crawl__floor')).toHaveCount(0);
  await ctx.close();
});
