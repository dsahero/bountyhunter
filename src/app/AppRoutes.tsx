import { Route, Routes } from 'react-router-dom';
import { Cinematic } from './Cinematic';
import { PlainDossier } from '../plain/PlainDossier';
import { RecruiterBriefing } from '../recruiter/RecruiterBriefing';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/dossier" element={<PlainDossier />} />
      <Route path="/recruiter" element={<RecruiterBriefing />} />
      {/* Everything else is the cockpit; deep links (e.g. /projects/dietre) open straight to a view. */}
      <Route path="*" element={<Cinematic />} />
    </Routes>
  );
}
