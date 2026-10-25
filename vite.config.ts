/// <reference types="vitest/config" />
import { defineConfig, type Connect, type Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { portfolio } from './src/content/portfolio';
import { LIMITS, validateEntry, type GuestbookEntry } from './src/guestbook/shared';

/**
 * A stand-in for the guestbook API (api/guestbook.ts) during `vite dev` and
 * `vite preview`, kept in memory, so the log works locally and in tests.
 */
function guestbookDev(): Plugin {
  const entries: GuestbookEntry[] = [];
  const handle = (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (req.method === 'GET') return send(200, { entries: entries.slice(0, LIMITS.show) });
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(raw);
      } catch {
        /* empty */
      }
      const entry = validateEntry(body);
      if (!entry) return send(400, { error: 'invalid' });
      const saved = { ...entry, at: new Date().toISOString() };
      entries.unshift(saved);
      send(201, { entry: saved });
    });
  };
  const mount = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use('/api/guestbook', (req, res) => handle(req, res));
  };
  return { name: 'guestbook-dev', configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig({
  plugins: [
    react(),
    guestbookDev(),
    // index.html is static; fill personal values from the content file (single source of truth).
    {
      name: 'content-tokens',
      // 'pre': fill the tokens before Vite parses the HTML (it reads link URLs).
      transformIndexHtml: {
        order: 'pre',
        handler: (html) =>
          html
            .replaceAll('%NAME%', portfolio.identity.name)
            .replaceAll('%SITE_URL%', portfolio.site.siteUrl.replace(/\/$/, '')),
      },
    },
  ],
  // The lazy 3D chunk (three.js + R3F) is ~320 KB gzipped by design; it loads during the intro.
  build: { chunkSizeWarningLimit: 1100 },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
