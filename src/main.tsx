import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/orbitron/latin-700.css';
import '@fontsource/orbitron/latin-900.css';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-700.css';
import '@fontsource/share-tech-mono/latin-400.css';
import './styles/global.css';
import { AppRoutes } from './app/AppRoutes';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
);

// /dossier is prerendered to static HTML at build time; attach to it instead
// of re-rendering. Every other route starts from an empty root.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
