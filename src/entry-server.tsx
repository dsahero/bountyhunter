/**
 * Server entry used only at build time by scripts/prerender.mjs to turn the
 * text pages (/dossier, /recruiter) into static HTML (fast first paint, SEO,
 * works without JS).
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './app/AppRoutes';
import { dossierMeta } from './plain/PlainDossier';
import { recruiterMeta } from './recruiter/RecruiterBriefing';

export function render(url: string) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
  return { html, meta: url === '/recruiter' ? recruiterMeta : dossierMeta };
}
