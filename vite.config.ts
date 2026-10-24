/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { portfolio } from './src/content/portfolio';

export default defineConfig({
  plugins: [
    react(),
    // index.html is static; fill personal values from the content file (single source of truth).
    {
      name: 'content-tokens',
      transformIndexHtml: (html) => html.replaceAll('%NAME%', portfolio.identity.name),
    },
  ],
  // The lazy 3D chunk (three.js + R3F) is ~260 KB gzipped by design; it loads during the intro.
  build: { chunkSizeWarningLimit: 1100 },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
