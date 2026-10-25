import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { useHub } from '../../state/hub';
import { posterOrder } from '../../state/hubView';
import { useUnlocks } from '../../state/unlocks';
import type { Propaganda } from '../../content/schema';
import { isVideo } from '../../lib/media';

function Transmission({ p, locked }: { p: Propaganda; locked: boolean }) {
  const l = lore.labels;
  const toSkill = (skill: string) => {
    const a = portfolio.associates.find((x) => x.skill === skill);
    if (!a) return;
    useHub.getState().set({ unit: a.unit, associate: a.skill });
    useHub.getState().open('skills');
  };

  if (locked) {
    return (
      <article className="transmission transmission--locked">
        <p className="transmission__tag">{l.encrypted}</p>
        <h3 className="charge__title">{l.encryptedTitle}</h3>
        <p>{l.encryptedBody}</p>
      </article>
    );
  }

  return (
    <article className="transmission">
      <p className="transmission__tag">{l.transmission}</p>
      <h3 className="charge__title">{p.title}</h3>
      <p className="transmission__slogan">“{p.slogan}”</p>
      <p className="panel__lead">{p.oneLiner}</p>
      {p.media.length > 0 && (
        <div className="transmission__media">
          {p.media.map((m) =>
            isVideo(m.src) ? (
              <video
                key={m.src}
                src={m.src}
                poster={m.still}
                aria-label={m.alt}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img key={m.src} src={m.src} alt={m.alt} loading="lazy" />
            ),
          )}
        </div>
      )}
      {p.description.map((d) => (
        <p key={d}>{d}</p>
      ))}
      <p className="panel__flavor">
        {l.role}: {p.role}
      </p>
      <h4 className="panel__sub">{l.associatesInvolved}</h4>
      <ul className="chips">
        {p.stack.map((s) => (
          <li key={s}>
            <button className="chip" onClick={() => toSkill(s)}>
              {s}
            </button>
          </li>
        ))}
      </ul>
      {p.links.length > 0 && (
        <p className="transmission__links">
          {p.links.map((link) => (
            <a
              key={link.href}
              className="btn btn--holo"
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label} ↗
            </a>
          ))}
        </p>
      )}
      <p className="panel__flavor">
        {l.bountyValue}: {p.bountyValue.toLocaleString('en-US')} {l.credits}
      </p>
    </article>
  );
}

export function ProjectsPanel() {
  const selected = useHub((s) => s.project);
  const unlocked = useUnlocks((s) => s.classified);
  const project = portfolio.propaganda.find((p) => p.id === selected);
  const l = lore.labels;
  const isLocked = (p: Propaganda) => p.classified && !unlocked;

  if (project) {
    // Step through the posters in wall order (wrapping around); the head turns to each.
    const order = posterOrder();
    const i = order.findIndex((p) => p.id === project.id);
    const prev = order[(i - 1 + order.length) % order.length]!;
    const next = order[(i + 1) % order.length]!;
    const name = (p: Propaganda) => (isLocked(p) ? l.classified : p.title);
    return (
      <>
        <nav className="step-nav" aria-label={lore.sections.projects.real}>
          <button
            className="btn btn--ghost"
            onClick={() => useHub.getState().selectProject(prev.id)}
          >
            ◂ {name(prev)}
          </button>
          <button
            className="btn btn--holo"
            onClick={() => useHub.getState().selectProject(next.id)}
          >
            {l.next}: {name(next)} ▸
          </button>
        </nav>
        <button className="link-button" onClick={() => useHub.getState().selectProject(null)}>
          {l.allPosters}
        </button>
        <Transmission p={project} locked={isLocked(project)} />
      </>
    );
  }

  return (
    <>
      <p className="panel__flavor">{l.postersIntro}</p>
      <ul className="list-buttons">
        {portfolio.propaganda.map((p) => (
          <li key={p.id}>
            <button className="list-button" onClick={() => useHub.getState().selectProject(p.id)}>
              <strong>{isLocked(p) ? l.classified : p.title}</strong>
              <span>{isLocked(p) ? l.encrypted : p.oneLiner}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
