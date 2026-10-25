/**
 * Renders the link-preview image (public/og-image.png, 1200x630) shown when
 * the site is shared on Slack, LinkedIn, iMessage, etc. Text comes from
 * portfolio.ts (name, alias, tagline, reward), so re-run after editing it:
 *
 *   npm run og:image
 */
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const src = await readFile('src/content/portfolio.ts', 'utf8');
const pick = (key) => src.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? '';
const name = pick('name');
const alias = pick('alias');
const tagline = pick('tagline');
const reward = Number((src.match(/amount:\s*([\d_]+)/)?.[1] ?? '0').replaceAll('_', ''));
// Fonts inlined as data URLs (a page set from a string can't load local files).
const fonts = {};
for (const [key, pkg, file] of [
  ['o900', 'orbitron', 'orbitron-latin-900-normal.woff2'],
  ['o700', 'orbitron', 'orbitron-latin-700-normal.woff2'],
  ['mono', 'share-tech-mono', 'share-tech-mono-latin-400-normal.woff2'],
  ['raj', 'rajdhani', 'rajdhani-latin-500-normal.woff2'],
]) {
  const data = await readFile(`node_modules/@fontsource/${pkg}/files/${file}`);
  fonts[key] = `data:font/woff2;base64,${data.toString('base64')}`;
}

const stars = Array.from({ length: 160 }, (_, i) => {
  const x = (i * 7919) % 1200;
  const y = (i * 104729) % 630;
  const s = 1 + (i % 3);
  return `<i style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${0.3 + (i % 5) / 8}"></i>`;
}).join('');

const html = `<!doctype html><html><head><style>
@font-face { font-family: Orbitron; font-weight: 900; src: url(${fonts.o900}); }
@font-face { font-family: Orbitron; font-weight: 700; src: url(${fonts.o700}); }
@font-face { font-family: Mono; src: url(${fonts.mono}); }
@font-face { font-family: Rajdhani; src: url(${fonts.raj}); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; color: #e8eef2;
  background: radial-gradient(ellipse at 75% 120%, #c6602a 0%, #5a2410 22%, #0a0d14 55%, #020306 100%); }
i { position: absolute; background: #fff; border-radius: 50%; }
.planet { position: absolute; right: -160px; bottom: -330px; width: 760px; height: 760px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f2a65a, #c6602a 45%, #5a2410 75%); box-shadow: 0 0 80px #ff8a4a66; }
.poster { position: absolute; left: 70px; top: 60px; width: 340px; height: 510px; padding: 26px; transform: rotate(-3deg);
  background: #e9dcc0; color: #1b1410; border: 10px solid #1b1410; text-align: center; box-shadow: 0 30px 60px #000a; }
.poster h2 { font: 900 50px Orbitron; color: #8a1f15; letter-spacing: 4px; }
.photo { margin: 14px auto; width: 170px; height: 170px; background: #9a9a9a; position: relative; overflow: hidden; border: 3px solid #5a4630; }
.photo::before { content: ''; position: absolute; left: 50%; top: 34px; width: 64px; height: 64px; margin-left: -32px; border-radius: 50%; background: #6f6f6f; }
.photo::after { content: ''; position: absolute; left: 50%; top: 104px; width: 130px; height: 120px; margin-left: -65px; border-radius: 50%; background: #6f6f6f; }
.poster .name { font: 700 24px Orbitron; margin-top: 8px; }
.poster .alias { font: 22px Mono; margin-top: 6px; }
.poster .reward { font: 700 26px Orbitron; color: #8a1f15; margin-top: 18px; }
.copy { position: absolute; left: 470px; top: 120px; width: 660px; }
.kicker { font: 22px Mono; letter-spacing: 6px; color: #ffb347; }
.title { font: 900 56px/1.08 Orbitron; margin-top: 14px; color: #ffe81f; text-shadow: 0 0 30px #ffe81f44; }
.tag { font: 30px/1.3 Rajdhani; margin-top: 22px; color: #d8e2ea; }
.cta { display: inline-block; margin-top: 30px; padding: 12px 22px; border: 2px solid #5fd4ff; color: #5fd4ff; font: 22px Mono; letter-spacing: 2px; }
</style></head><body>${stars}<div class="planet"></div>
<div class="poster"><h2>WANTED</h2><div class="photo"></div>
<div class="name">${name}</div><div class="alias">“${alias}”</div>
<div class="reward">${reward.toLocaleString('en-US')} CREDITS</div></div>
<div class="copy"><div class="kicker">BOUNTY GUILD // CONTRACT</div>
<div class="title">BOUNTY HUNTER COCKPIT</div>
<div class="tag">${tagline}</div>
<div class="cta">CLIMB INTO THE COCKPIT ▸</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('Wrote public/og-image.png');
