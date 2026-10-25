/**
 * The 2D cockpit, used when the device can't run WebGL (or with ?tier=none).
 * Same main-computer menu, station panels, and console apps (achievements,
 * guestbook) as the 3D cockpit, laid out flat.
 */
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { ConsoleUI } from '../hub/ConsoleUI';
import { StationPanel } from '../hub/StationPanel';
import { HudControls } from '../hud/HudControls';
import { useHubHotkeys } from '../hud/hotkeys';
import { AppPanel } from '../hud/AppPanel';
import './hub2d.css';

export function Hub2D() {
  useHubHotkeys();
  return (
    <section className="hub2d" aria-labelledby="hub2d-title">
      <header className="hub2d__top">
        <h1 id="hub2d-title" className="hud__title">
          <span className="hud__kicker">{lore.hud.kicker}</span>
          {portfolio.identity.name}
        </h1>
        <HudControls className="hud__controls" />
      </header>
      <p className="hub2d__status">{lore.hud.lowPower}</p>
      <ConsoleUI />
      <p className="hub2d__disclaimer">{lore.disclaimer}</p>
      <StationPanel flat />
      <AppPanel />
    </section>
  );
}
