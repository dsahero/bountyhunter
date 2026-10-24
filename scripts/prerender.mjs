/**
 * Build step: render /dossier to static HTML.
 *
 * Takes the client build's index.html (which already links the hashed JS/CSS),
 * injects the server-rendered dossier markup and its meta tags, and writes
 * dist/dossier.html. Vercel's cleanUrls serves it at /dossier.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const template = await readFile(`${root}dist/index.html`, 'utf8');
// Import via a file:// URL so this also works with Windows drive-letter paths.
const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url).href);

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const { html, meta } = render('/dossier');

const page = template
  .replace(/<title>.*?<\/title>/, `<title>${escape(meta.title)}</title>`)
  .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(meta.description)}$2`)
  .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(meta.title)}$2`)
  .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

if (!page.includes(html))
  throw new Error('prerender: could not find <div id="root"></div> in template');

await writeFile(`${root}dist/dossier.html`, page);
await rm(`${root}dist-ssr`, { recursive: true, force: true });
console.log(`prerender: wrote dist/dossier.html (${(page.length / 1024).toFixed(1)} KB)`);
