/**
 * Post-processing: the "filmed on a real camera in a galaxy far away" layer.
 *   Bloom      holograms, screens, engines, and lights glow
 *   Scanlines  a faint CRT texture
 *   Chromatic  slight color fringing at the edges (off under reduced motion)
 *   Noise      light film grain
 *   Vignette   darker corners
 * Only on the high quality tier; phones and weak devices skip it.
 */
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Scanline,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { useReducedMotion } from '../../lib/reducedMotion';

const FRINGE = new Vector2(0.0007, 0.0007);

export function Effects() {
  const reduced = useReducedMotion();
  const bloom = (
    <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.25} intensity={0.85} />
  );
  const scan = <Scanline density={1.6} opacity={0.045} blendFunction={BlendFunction.OVERLAY} />;
  const grain = <Noise premultiply opacity={0.35} blendFunction={BlendFunction.SOFT_LIGHT} />;
  const vignette = <Vignette offset={0.28} darkness={0.65} />;

  return reduced ? (
    <EffectComposer multisampling={0}>
      {bloom}
      {scan}
      {vignette}
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      {bloom}
      {scan}
      <ChromaticAberration offset={FRINGE} radialModulation modulationOffset={0.35} />
      {grain}
      {vignette}
    </EffectComposer>
  );
}
