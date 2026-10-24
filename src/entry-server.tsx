/**
 * Server entry used only at build time by scripts/prerender.mjs to turn the
 * plain dossier into static HTML (fast first paint, SEO, works without JS).
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './app/AppRoutes';
import { dossierMeta } from './plain/PlainDossier';

export function render(url: string) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
  return { html, meta: dossierMeta };
}
