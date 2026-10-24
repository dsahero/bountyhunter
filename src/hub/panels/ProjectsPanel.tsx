import { portfolio } from '../../content/portfolio';
import { useHub } from '../../state/hub';
import type { Propaganda } from '../../content/schema';

function Transmission({ p }: { p: Propaganda }) {
  const toSkill = (skill: string) => {
    const a = portfolio.associates.find((x) => x.skill === skill);
    if (!a) return;
    useHub.getState().set({ unit: a.unit, associate: a.skill });
    useHub.getState().open('skills');
  };

  if (p.classified) {
    return (
      <article className="transmission transmission--locked">
        <p className="transmission__tag">Intercepted transmission · Encrypted</p>
        <h3 className="charge__title">█████ ███████</h3>
        <p>
          This transmission is encrypted. Rumor says the decryption key is a riff played on the
          cargo-hold guitar.
        </p>
      </article>
    );
  }

  return (
    <article className="transmission">
      <p className="transmission__tag">Intercepted transmission · Rebel propaganda</p>
      <h3 className="charge__title">{p.title}</h3>
      <p className="transmission__slogan">“{p.slogan}”</p>
      <p className="panel__lead">{p.oneLiner}</p>
      {p.description.map((d) => (
        <p key={d}>{d}</p>
      ))}
      <p className="panel__flavor">Role: {p.role}</p>
      <h4 className="panel__sub">Associates involved</h4>
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
          {p.links.map((l) => (
            <a
              key={l.href}
              className="btn btn--holo"
              href={l.href}
              target="_blank"
              rel="noreferrer"
            >
              {l.label} ↗
            </a>
          ))}
        </p>
      )}
      <p className="panel__flavor">Bounty value: {p.bountyValue.toLocaleString('en-US')} credits</p>
    </article>
  );
}

export function ProjectsPanel() {
  const selected = useHub((s) => s.project);
  const project = portfolio.propaganda.find((p) => p.id === selected);

  if (project) {
    return (
      <>
        <button className="link-button" onClick={() => useHub.getState().selectProject(null)}>
          ◂ All posters
        </button>
        <Transmission p={project} />
      </>
    );
  }

  return (
    <>
      <p className="panel__flavor">
        Propaganda pasted up in the cargo hold. Select a poster to play its transmission.
      </p>
      <ul className="list-buttons">
        {portfolio.propaganda.map((p) => (
          <li key={p.id}>
            <button className="list-button" onClick={() => useHub.getState().selectProject(p.id)}>
              <strong>{p.classified ? 'CLASSIFIED' : p.title}</strong>
              <span>{p.classified ? 'Encrypted transmission' : p.oneLiner}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
