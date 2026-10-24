/**
 * Side panel for inspectable things (your helmet, the guitar, the tchotchkes). The guitar's
 * text "loads" by scrolling until the incoming comm cuts it off.
 */
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import { useAttack } from '../hub/attack';
import { focusConsole } from './ScreenMirror';

export function InspectPanel() {
  const inspect = useHub((s) => s.inspect);
  const stage = useAttack((s) => s.stage);
  if (!inspect) return null;
  const guitar = inspect === 'guitar';
  const text =
    inspect === 'guitar'
      ? { label: lore.attack.guitarTitle, blurb: lore.attack.guitarBlurb }
      : inspect === 'helmet'
        ? lore.helmet
        : lore.props[inspect];
  const { label: title, blurb } = text;
  const close = () => {
    useHub.getState().close();
    focusConsole();
  };

  return (
    <aside className="panel panel--inspect" role="region" aria-labelledby="inspect-title">
      <header className="panel__header">
        <div>
          <h2 id="inspect-title" className="panel__title">
            {title}
          </h2>
        </div>
        <div className="panel__navs">
          <button className="panel__back" onClick={close} disabled={guitar && stage !== 'idle'}>
            {lore.panel.console}
          </button>
        </div>
      </header>
      <div className="panel__body">
        <p className={guitar ? 'inspect__loading' : undefined}>{blurb}</p>
      </div>
    </aside>
  );
}
