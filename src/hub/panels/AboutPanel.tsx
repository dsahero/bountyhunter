import { portfolio } from '../../content/portfolio';

export function AboutPanel() {
  const { identity } = portfolio;
  return (
    <>
      <div className="wanted">
        <p className="wanted__title">Wanted</p>
        <p className="wanted__name">{identity.name}</p>
        <p className="wanted__alias">a.k.a. “{identity.alias}”</p>
        <p className="wanted__reward">{identity.reward.amount.toLocaleString('en-US')} credits</p>
        <p className="wanted__terms">{identity.reward.terms}</p>
      </div>
      <p className="panel__lead">{identity.tagline}</p>
      {identity.bio.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3 className="panel__sub">Known traits</h3>
      <dl className="traits">
        {identity.traits.map((t) => (
          <div key={t.label}>
            <dt>{t.label}</dt>
            <dd>{t.value}</dd>
          </div>
        ))}
      </dl>
      <p className="panel__flavor">
        Wanted for: {identity.wantedFor}. Last seen: {identity.lastSeen}.
      </p>
    </>
  );
}
