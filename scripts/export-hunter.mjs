/**
 * Exports the hunter model to exports/hunter.glb (open it in Blender:
 * File > Import > glTF 2.0). Starts the Vite dev server, loads
 * /?export=hunter in headless Chromium, and saves what the page exports.
 *
 *   node scripts/export-hunter.mjs
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const PORT = 5199;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  shell: true,
  stdio: 'ignore',
});

try {
  const url = `http://localhost:${PORT}/?export=hunter`;
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* not up yet */
    }
    if (i > 120) throw new Error('dev server did not start');
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  page.on('console', (m) => m.type() === 'error' && console.error(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => document.title === 'exported', null, { timeout: 60_000 });
  const b64 = await page.evaluate(() => window.__glb);
  await browser.close();
  await mkdir('exports', { recursive: true });
  await writeFile('exports/hunter.glb', Buffer.from(b64, 'base64'));
  console.log('Wrote exports/hunter.glb');
} finally {
  server.kill();
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/f', '/t']);
}
