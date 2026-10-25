/**
 * Performance report: starts the dev server, opens a few cockpit views with
 * ?perf in headless Chromium, and prints frames per second, draw calls,
 * triangles, lights, and meshes for each (from src/three/fx/PerfStats.tsx).
 *
 *   npm run perf                       (the default views)
 *   npm run perf -- /cockpit,/skills   (your own list; add ?tier=low etc.)
 *
 * Headless Chromium renders in software, so frame rates are far below a real
 * GPU's; compare draw calls and meshes between runs instead.
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const PORT = 5196;
const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  shell: true,
  stdio: 'ignore',
});
try {
  for (;;) {
    try {
      if ((await fetch(`http://localhost:${PORT}/`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const views = (process.argv[2] ?? '/cockpit,/projects,/skills,/experience,/education').split(',');
  for (const v of views) {
    await page.goto(`http://localhost:${PORT}${v}${v.includes('?') ? '&' : '?'}perf`);
    await page.waitForFunction(() => window.__perf, null, { timeout: 120000 });
    await page.waitForTimeout(6000);
    console.log(v.padEnd(12), JSON.stringify(await page.evaluate(() => window.__perf)));
  }
  await browser.close();
} finally {
  server.kill();
  spawn('taskkill', ['/pid', String(server.pid), '/f', '/t']);
}
