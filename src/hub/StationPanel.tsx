/**
 * The open station's content: a hologram-styled panel (side panel on
 * desktop, bottom sheet in portrait). Every panel shows the real section
 * name next to the lore name, and always offers a way back.
 */
import { useEffect, useRef } from 'react';
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import type { StationId } from './layout';
import { AboutPanel } from './panels/AboutPanel';
import { EducationPanel } from './panels/EducationPanel';
import { ExperiencePanel } from './panels/ExperiencePanel';
import { SkillsPanel } from './panels/SkillsPanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { ResumePanel } from './panels/ResumePanel';
import { ContactPanel } from './panels/ContactPanel';
import { LeadershipList } from './LeadershipList';
import './panels/panels.css';
import { ShareButton } from '../hud/ShareButton';

const BODIES: Record<StationId, () => JSX.Element | null> = {
  about: AboutPanel,
  education: EducationPanel,
  experience: ExperiencePanel,
  leadership: LeadershipList,
  skills: SkillsPanel,
  projects: ProjectsPanel,
  resume: ResumePanel,
  contact: ContactPanel,
};

/**
 * `flat`: the 2D fallback, where every station (including Leadership) uses a panel.
 * In 3D, Leadership is shown as an in-world hologram instead.
 */
export function StationPanel({ flat = false }: { flat?: boolean }) {
  const station = useHub((s) => s.station);
  const close = useHub((s) => s.close);
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus into the panel when a station opens, for keyboard and screen-reader users.
  useEffect(() => {
    if (station) heading.current?.focus({ preventScroll: true });
  }, [station]);

  if (!station || (station === 'leadership' && !flat)) return null;
  const Body = BODIES[station];
  const toConsole = () => {
    close();
    document.getElementById(`console-station:${station}`)?.focus({ preventScroll: true });
  };
  const back = () => {
    useHub.getState().back();
    if (!useHub.getState().station)
      document.getElementById(`console-station:${station}`)?.focus({ preventScroll: true });
  };

  return (
    <aside key={station} className="panel" role="region" aria-labelledby="panel-title">
      <header className="panel__header">
        <div>
          <p className="panel__real">{lore.sections[station].real}</p>
          <h2 id="panel-title" ref={heading} tabIndex={-1} className="panel__title">
            {lore.sections[station].lore}
          </h2>
        </div>
        <div className="panel__navs">
          <ShareButton />
          <button className="panel__back" onClick={back}>
            {lore.panel.back} <kbd>⌫</kbd>
          </button>
          <button className="panel__back" onClick={toConsole}>
            {lore.panel.console} <kbd>Esc</kbd>
          </button>
        </div>
      </header>
      <div className="panel__body">
        <Body />
      </div>
    </aside>
  );
}
