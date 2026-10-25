import { expect, test, type Page } from '@playwright/test';
import { portfolio } from '../src/content/portfolio';
import { chronological } from '../src/hub/timeline';

const NAME = portfolio.identity.name;
// The Experience panel opens on the earliest role (same ordering the site uses).
const FIRST_ORG = chronological()[0]!.org;

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

test('skip intro lands in the hub and is remembered on reload', async ({ page, isMobile }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Incoming Contract' })).toBeVisible();
  await page.getByRole('button', { name: /Skip intro/ }).click();
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible();
  await expect(page.getByRole('button', { name: /Skip intro/ })).toHaveCount(0);

  // On phones the HUD controls fold behind a Settings button.
  if (isMobile) await page.getByRole('button', { name: /Settings/ }).click();
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
  await expect(page.getByRole('button', { name: /Charges/ })).toBeAttached();
  expect(errors).toEqual([]);
});

test('cockpit stations open from the computer and close with Esc', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  // The in-world screen is a canvas; its buttons are mirrored as real (visually hidden) buttons.
  const charges = page.getByRole('button', { name: /Charges/ });
  await charges.waitFor({ state: 'attached', timeout: 30_000 });
  await charges.dispatchEvent('click');
  await expect(page.getByRole('heading', { name: 'Charges' })).toBeVisible();
  await expect(page.getByText(FIRST_ORG).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Charges' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('arrow keys and Enter drive the console', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  await page
    .getByRole('button', { name: /Charges/ })
    .waitFor({ state: 'attached', timeout: 30_000 });
  // The menu focuses its first file; two steps down is the third (Experience).
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Charges' })).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(page.locator('.panel')).toHaveCount(0);
});

test('the guitar starts the attack; beating the terminal unlocks the last poster', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors = trackErrors(page);
  const site = portfolio.site;
  await page.goto('/');
  await page.getByRole('button', { name: /Skip intro/ }).click();
  // The guitar is found by snooping; keyboard/screen-reader users get it in the objects list.
  const guitar = page.locator('#object-guitar');
  await guitar.waitFor({ state: 'attached', timeout: 30_000 });
  await guitar.dispatchEvent('click');
  await expect(page.getByRole('heading', { name: site.attack.guitarTitle })).toBeVisible();
  // Comm, alarms, then the console turns into the defense terminal.
  const skip = page.getByRole('button', { name: site.attack.skipStage });
  await skip.waitFor({ state: 'attached', timeout: 30_000 });
  for (let i = 0; i < 3; i++) await skip.dispatchEvent('click');
  await expect(page.getByText(site.attack.won).first()).toBeAttached();
  const projects = page.locator('[id="console-station:projects"]');
  await projects.waitFor({ state: 'attached', timeout: 30_000 });
  await projects.dispatchEvent('click');
  const classified = portfolio.propaganda.find((p) => p.classified)!;
  await expect(page.getByText(classified.title).first()).toBeVisible();
  expect(errors).toEqual([]);
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

test('a shared link opens straight to a project, without the intro', async ({ page }) => {
  const errors = trackErrors(page);
  const dietre = portfolio.propaganda.find((p) => p.id === 'dietre')!;
  await page.goto('/projects/dietre');
  await expect(
    page.getByRole('heading', { name: portfolio.site.sections.projects.lore }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('.transmission').getByText(dietre.title).first()).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/dietre$/);
  // Stepping to the next poster updates the address bar.
  await page.locator('.step-nav .btn--holo').first().click();
  await expect(page).not.toHaveURL(/\/projects\/dietre$/);
  expect(errors).toEqual([]);
});

test('menu page two: sign the guestbook, then see the achievement', async ({ page }) => {
  const errors = trackErrors(page);
  const site = portfolio.site;
  await page.goto('/cockpit');
  const next = page.locator('[id="console-page:next"]');
  await next.waitFor({ state: 'attached', timeout: 30_000 });
  await next.dispatchEvent('click');
  await page.locator('[id="console-app:guestbook"]').dispatchEvent('click');
  await page.getByLabel(site.guestbook.name).fill('Test Pilot');
  const note = `Smooth landing ${Date.now()}.`;
  await page.getByLabel(site.guestbook.message).fill(note);
  await page.getByRole('button', { name: site.guestbook.sign }).click();
  await expect(page.getByText(site.guestbook.thanks)).toBeVisible();
  await expect(page.getByText(note)).toBeVisible();
  await page.goto('/achievements');
  const signed = site.achievements.find((a) => a.id === 'guestbook')!;
  await expect(page.locator('.achievement--on').getByText(signed.title)).toBeVisible({
    timeout: 30_000,
  });
  expect(errors).toEqual([]);
});

test('phones get touch controls for the cargo game', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch controls are for phones');
  test.setTimeout(90_000);
  await page.goto('/cockpit');
  const guitar = page.locator('#object-guitar');
  await guitar.waitFor({ state: 'attached', timeout: 30_000 });
  await guitar.dispatchEvent('click');
  const skip = page.getByRole('button', { name: portfolio.site.attack.skipStage });
  await skip.waitFor({ state: 'attached', timeout: 30_000 });
  await skip.dispatchEvent('click'); // firewall
  await expect(page.locator('.terminal-touch__type')).toBeVisible(); // typing
  await skip.dispatchEvent('click');
  await expect(page.getByRole('group', { name: portfolio.site.a11y.cargoControls })).toBeVisible();
  // The HUD folds behind a Settings button on a phone.
  await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();
});

test('recruiter briefing: prerendered, tailorable, and reachable from anywhere', async ({
  page,
  browser,
}) => {
  const errors = trackErrors(page);
  const r = portfolio.recruiter;
  const ui = portfolio.site.recruiterUi;
  const hume = portfolio.charges.find((c) => c.id === 'hume')!;

  // ?recruiter on any link lands on the briefing.
  await page.goto('/projects?recruiter');
  await expect(page).toHaveURL(/\/recruiter$/);
  await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
  await expect(page.getByText(r.headline)).toBeVisible();

  // Tailoring reorders experience and puts the choice in the URL.
  const ml = r.focusAreas.find((f) => f.id === 'ml')!;
  await page.getByRole('button', { name: ml.label, exact: true }).click();
  await expect(page).toHaveURL(/focus=ml/);
  await expect(page.locator('#rb-exp ~ article h3').first()).toHaveText(hume.role);
  await expect(page.getByText(ui.strongMatch).first()).toBeVisible();
  expect(errors).toEqual([]);

  // Static HTML: readable with JavaScript off.
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noJs.newPage();
  await plain.goto('/recruiter');
  await expect(plain.getByText(r.highlights[0]!.detail)).toBeVisible();
  await noJs.close();
});
