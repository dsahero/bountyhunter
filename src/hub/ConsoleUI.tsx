/**
 * The main computer as plain DOM, for the 2D (no-WebGL) cockpit. It renders
 * the same items as the in-world canvas screen (see consoleModel.ts).
 */
import { portfolio } from '../content/portfolio';
import { lore } from '../content/lore';
import { rewardText } from '../content/derived';
import { activateConsoleItem, consoleItems } from './consoleModel';
import { useConsoleUi } from '../state/consoleUi';
import { useHub } from '../state/hub';
import { PortraitSlot } from './PortraitSlot';
import './console.css';

export function ConsoleUI() {
  const mode = useConsoleUi((s) => s.mode);
  const call = useHub((s) => s.call);
  const station = useHub((s) => s.station);
  const holosOff = useHub((s) => s.holosOff);
  const items = consoleItems(mode, !!call, holosOff);
  const { identity } = portfolio;
  const c = lore.console;

  return (
    <div className="console console--flat">
      <header className="console__header">
        <span>{c.header}</span>
        <span className="console__utils">
          {items
            .filter((i) => i.kind === 'util')
            .map((i) => (
              <button
                key={i.id}
                id={`console-${i.id}`}
                className="console__util"
                onClick={() => activateConsoleItem(i.id)}
              >
                {i.label}
              </button>
            ))}
        </span>
      </header>

      {mode === 'contacts' ? (
        <div className="console__contacts">
          <p className="console__files-title">{c.contactsTitle}</p>
          {items
            .filter((i) => i.kind !== 'contact')
            .map((i) => (
              <button
                key={i.id}
                id={`console-${i.id}`}
                className="console__util"
                onClick={() => activateConsoleItem(i.id)}
              >
                {i.label}
              </button>
            ))}
          <ul>
            {items
              .filter((i) => i.kind === 'contact')
              .map((i) => (
                <li key={i.id}>
                  <button
                    id={`console-${i.id}`}
                    className="console__file"
                    onClick={() => activateConsoleItem(i.id)}
                  >
                    <span aria-hidden="true">{i.icon}</span> {i.label}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <div className="console__main">
          <button
            id="console-wanted"
            className="console__wanted"
            onClick={() => activateConsoleItem('wanted')}
          >
            <span className="console__wanted-title">{c.wanted}</span>
            <PortraitSlot className="console__photo" />
            <span className="console__wanted-name">{identity.name}</span>
            <span className="console__wanted-alias">“{identity.alias}”</span>
            <span className="console__wanted-reward">
              {rewardText()} {lore.labels.credits}
            </span>
          </button>
          <nav className="console__files" aria-label={c.files}>
            <p className="console__files-title">{c.files}</p>
            <ol>
              {items
                .filter((i) => i.kind === 'station')
                .map((i) => (
                  <li key={i.id}>
                    <button
                      id={`console-${i.id}`}
                      className="console__file"
                      aria-current={station && i.id === `station:${station}` ? 'true' : undefined}
                      onClick={() => activateConsoleItem(i.id)}
                    >
                      <span className="console__file-key" aria-hidden="true">
                        ▸
                      </span>
                      <span className="console__file-lore">{i.label}</span>
                      <span className="console__file-real">{i.sub}</span>
                    </button>
                  </li>
                ))}
            </ol>
          </nav>
        </div>
      )}
      <footer className="console__footer">{c.footer}</footer>
    </div>
  );
}
