import { Navigate, Route, Routes } from 'react-router-dom';
import { Cinematic } from './Cinematic';
import { PlainDossier } from '../plain/PlainDossier';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Cinematic />} />
      <Route path="/dossier" element={<PlainDossier />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
