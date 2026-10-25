/**
 * The cinematic route (/). Renders whichever phase the experience state
 * machine is in.
 *
 * Layers, bottom to top: a 2D starfield (shown until the 3D chunk is ready),
 * the shared 3D <Stage> (from the crawl onward), the crawl text, the HUD.
 * Because the 3D scene is already running under the crawl, the arrival can
 * start with a camera tilt instead of a cut. Devices without WebGL get the
 * 2D hub and skip the 3D scenes entirely.
 */
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useExperience, type Phase } from '../state/experience';
import { useCinema } from '../state/cinema';
import { preload } from '../lib/preload';
import { getTier } from '../lib/quality';
import { portfolio } from '../content/portfolio';
import { StartGate } from '../intro/StartGate';
import { TitleCard } from '../intro/TitleCard';
import { OpeningCrawl } from '../intro/OpeningCrawl';
import { IntroControls } from '../intro/IntroControls';
import { LoadingBar } from '../intro/LoadingBar';
import { Starfield } from '../intro/Starfield';
import { Hud } from '../hud/Hud';
import { Captions } from '../hud/Captions';
import { ContractOverlay } from '../hud/ContractOverlay';
import { Hub2D } from '../fallback/Hub2D';
import { useDocumentMeta } from './useDocumentMeta';
import { useAudioSync } from '../audio/useAudioSync';
import { useUrlSync } from './deepLinks';
import '../intro/intro.css';
import '../hud/hud.css';

const loadStage = () => preload('stage', () => import('../three/Stage'));
const Stage = lazy(loadStage);

const PHASES_3D: Phase[] = ['crawl', 'arrival', 'hub'];

export function Cinematic() {
  const phase = useExperience((s) => s.phase);
  const blackout = useCinema((s) => s.blackout);
  const tier = useMemo(getTier, []);
  const webgl = tier !== 'none';
  useAudioSync();
  useUrlSync();

  useDocumentMeta({
    title: `Bounty Hunter Cockpit | ${portfolio.identity.name}`,
    description:
      'A cinematic Star Wars-inspired portfolio. Climb into the cockpit and hunt down the galaxy’s best engineering talent.',
  });

  useEffect(() => {
    useExperience.getState().configure({ webgl });
    if (webgl) void loadStage().catch(() => {});
    void preload('fonts', () => document.fonts.ready);
  }, [webgl]);

  return (
    <div className="cinematic">
      {phase === 'gate' && <StartGate />}
      {phase === 'title' && <TitleCard />}
      {phase === 'crawl' && <Starfield />}

      {webgl && PHASES_3D.includes(phase) && (
        <Suspense
          fallback={
            phase === 'crawl' ? null : (
              <div className="gate">
                <LoadingBar label="Ship systems" />
              </div>
            )
          }
        >
          <Stage tier={tier} />
        </Suspense>
      )}

      {phase === 'crawl' && <OpeningCrawl />}
      {phase === 'arrival' && <ContractOverlay />}
      {phase === 'hub' && (webgl ? <Hud /> : <Hub2D />)}

      {phase !== 'hub' && <IntroControls />}
      <Captions />
      <div className={`blackout${blackout ? ' blackout--on' : ''}`} aria-hidden="true" />
    </div>
  );
}
