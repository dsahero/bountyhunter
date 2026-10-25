/**
 * The DOM layer over the cockpit: a small title, the always-available
 * controls, the open panel, and the hidden keyboard/screen-reader mirrors.
 * Keyboard handling lives in ./hotkeys.
 */
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import { ConsoleMirror, ObjectsMirror } from './ScreenMirror';
import { LeadershipMirror } from '../hub/LeadershipList';
import { StationPanel } from '../hub/StationPanel';
import { HudControls } from './HudControls';
import { InspectPanel } from './InspectPanel';
import { AppPanel } from './AppPanel';
import { TerminalTouch } from './TerminalTouch';
import { useAttack } from '../hub/attack';
import { skipStage } from '../hub/games/terminal';
import { useHubHotkeys } from './hotkeys';

export function Hud() {
  useHubHotkeys();
  const station = useHub((s) => s.station);
  const stage = useAttack((s) => s.stage);
  const game = useAttack((s) => s.game);
  const games = lore.attack.games;
  const current = [games.firewall, games.typing, games.cargo][game];

  return (
    <div className="hud">
      <header className="hud__top">
        <h1 className="hud__title">
          <span className="hud__kicker">{lore.hud.kicker}</span>
          {portfolio.identity.name}
        </h1>
        <HudControls className="hud__controls" />
      </header>
      {stage === 'terminal' ? (
        <div className="terminal-mirror sr-only">
          <p role="status">
            {lore.attack.terminalTitle}. {current?.title}: {current?.help}
          </p>
          <button onClick={skipStage}>{lore.attack.skipStage}</button>
        </div>
      ) : (
        <ConsoleMirror />
      )}
      {(stage === 'alert' || stage === 'terminal') && (
        <div className="emergency-dim" aria-hidden="true" />
      )}
      <ObjectsMirror />
      <InspectPanel />
      <AppPanel />
      <TerminalTouch />
      {station === 'leadership' && <LeadershipMirror />}
      <StationPanel />
    </div>
  );
}
