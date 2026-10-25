/**
 * Side panel for the console's apps (menu page 2): the Achievements board
 * and the Hunter's Log (guestbook). Same panel chrome as the stations.
 */
import { useEffect, useState } from 'react';
import { lore } from '../content/lore';
import { useHub } from '../state/hub';
import { ACHIEVEMENT_IDS, unlockAchievement, useAchievements } from '../state/achievements';
import { LIMITS, type GuestbookEntry } from '../guestbook/shared';
import { track } from '../lib/analytics';
import { focusConsole } from './ScreenMirror';
import { ShareButton } from './ShareButton';

export function AppPanel() {
  const app = useHub((s) => s.app);
  if (!app) return null;
  const title = app === 'achievements' ? lore.console.achievements : lore.console.guestbook;
  const close = () => {
    useHub.getState().close();
    focusConsole();
  };
  return (
    <aside className="panel" role="region" aria-labelledby="app-title">
      <header className="panel__header">
        <div>
          <h2 id="app-title" className="panel__title">
            {title}
          </h2>
        </div>
        <div className="panel__navs">
          <ShareButton />
          <button className="panel__back" onClick={close}>
            {lore.panel.console}
          </button>
        </div>
      </header>
      <div className="panel__body">
        {app === 'achievements' ? <AchievementsBoard /> : <Guestbook />}
      </div>
    </aside>
  );
}

function AchievementsBoard() {
  const unlocked = useAchievements((s) => s.unlocked);
  const t = lore.achievementsText;
  const list = lore.achievements.filter((a) =>
    (ACHIEVEMENT_IDS as readonly string[]).includes(a.id),
  );
  return (
    <>
      <p className="panel__flavor">{t.intro}</p>
      <p className="panel__lead">
        {t.progress}: {unlocked.length} / {list.length}
      </p>
      <ul className="achievements">
        {list.map((a) => {
          const on = unlocked.includes(a.id);
          return (
            <li key={a.id} className={`achievement${on ? ' achievement--on' : ''}`}>
              <span className="achievement__icon" aria-hidden="true">
                {on ? a.icon : '🔒'}
              </span>
              <span>
                <strong>{a.title}</strong>
                <span className="achievement__desc">
                  {a.description}
                  <span className="sr-only"> ({on ? t.progress : t.locked})</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <button className="link-button" onClick={() => useAchievements.getState().reset()}>
        {t.reset}
      </button>
    </>
  );
}

type Status = 'loading' | 'ready' | 'offline';

function Guestbook() {
  const g = lore.guestbook;
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/guestbook')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { entries: GuestbookEntry[] }) => {
        if (!alive) return;
        setEntries(d.entries);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('offline'));
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return setNote(g.invalid);
    setSending(true);
    setNote('');
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, website }),
      });
      if (res.status === 429) setNote(g.tooFast);
      else if (res.status === 400) setNote(g.invalid);
      else if (!res.ok) setNote(g.offline);
      else {
        const { entry } = (await res.json()) as { entry: GuestbookEntry };
        setEntries((list) => [entry, ...list]);
        setMessage('');
        setNote(g.thanks);
        unlockAchievement('guestbook');
        track('guestbook_sign');
      }
    } catch {
      setNote(g.offline);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <p className="panel__flavor">{g.intro}</p>
      {status === 'offline' ? (
        <p className="guestbook__note">{g.offline}</p>
      ) : (
        <form className="guestbook__form" onSubmit={submit}>
          <label>
            {g.name}
            <input
              value={name}
              maxLength={LIMITS.name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
              required
            />
          </label>
          <label>
            {g.message}
            <textarea
              value={message}
              maxLength={LIMITS.message}
              rows={3}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>
          {/* Honeypot: hidden from people, irresistible to bots. */}
          <input
            className="guestbook__trap"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            name="website"
          />
          <button className="btn btn--holo" type="submit" disabled={sending}>
            {sending ? g.signing : g.sign}
          </button>
          {note && (
            <p className="guestbook__note" role="status">
              {note}
            </p>
          )}
        </form>
      )}
      {status === 'ready' && (
        <ol className="guestbook__list">
          {entries.length === 0 && <li className="panel__flavor">{g.empty}</li>}
          {entries.map((e) => (
            <li key={`${e.at}${e.name}`}>
              <p className="guestbook__message">“{e.message}”</p>
              <p className="panel__flavor">
                {e.name} · {new Date(e.at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
