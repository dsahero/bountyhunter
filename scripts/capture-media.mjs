/**
 * Records poster media for projects with a live site: a short, silent,
 * looping clip of the page slowly scrolling (MP4) plus a still (JPG).
 *
 *   node scripts/capture-media.mjs dietre=https://dietre.us studyscout=https://...
 *
 * Writes public/media/<id>.mp4 and public/media/<id>.jpg. Then add to the
 * project in portfolio.ts:
 *   media: [{ src: '/media/<id>.mp4', still: '/media/<id>.jpg', alt: '...' }]
 * Needs ffmpeg on PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const jobs = process.argv.slice(2).map((arg) => {
  const [id, ...url] = arg.split('=');
  return { id, url: url.join('=') };
});
if (!jobs.length || jobs.some((j) => !j.id || !j.url)) {
  console.error('usage: node scripts/capture-media.mjs <id>=<url> [...]');
  process.exit(1);
}

const OUT = 'public/media';
const TMP = join(OUT, '.recording');
const SIZE = { width: 960, height: 600 };
await mkdir(TMP, { recursive: true });
const browser = await chromium.launch();

for (const { id, url } of jobs) {
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: TMP, size: SIZE },
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
  } catch {
    await page.waitForTimeout(8000); // slow app (e.g. a sleeping server): give it time
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, `${id}.jpg`), type: 'jpeg', quality: 80 });
  // Scroll gently down and back, about 7 seconds in all.
  await page.evaluate(async () => {
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const to = Math.min(max, innerHeight * 1.5);
    const step = (t) => scrollTo(0, to * Math.sin(Math.min(1, t) * Math.PI));
    for (let i = 0; i <= 140; i++) {
      step(i / 140);
      await new Promise((r) => setTimeout(r, 50));
    }
  });
  const video = page.video();
  await context.close();
  const raw = await video.path();
  // Drop the loading seconds; small H.264, no audio, starts fast on the web.
  execFileSync('ffmpeg', [
    '-loglevel',
    'error',
    '-y',
    '-ss',
    '4',
    '-i',
    raw,
    '-t',
    '7',
    '-an',
    '-vf',
    'scale=640:-2,fps=24',
    '-c:v',
    'libx264',
    '-crf',
    '30',
    '-preset',
    'slow',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    join(OUT, `${id}.mp4`),
  ]);
  console.log(`Wrote ${OUT}/${id}.mp4 and ${id}.jpg`);
}

await browser.close();
for (const f of await readdir(TMP)) await rm(join(TMP, f));
await rm(TMP, { recursive: true, force: true });
