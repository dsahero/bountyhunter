import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';
import { rewardText } from '../../content/derived';
import { PortraitSlot } from '../PortraitSlot';

export function AboutPanel() {
  const { identity } = portfolio;
  const l = lore.labels;
  return (
    <>
      <div className="wanted">
        <p className="wanted__title">{lore.holograms.wanted}</p>
        <PortraitSlot className="wanted__photo" />
        <p className="wanted__name">{identity.name}</p>
        <p className="wanted__alias">“{identity.alias}”</p>
        <p className="wanted__reward">
          {rewardText()} {l.credits}
        </p>
        <p className="wanted__terms">{identity.reward.terms}</p>
      </div>
      <p className="panel__lead">{identity.tagline}</p>
      {identity.bio.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3 className="panel__sub">{l.knownTraits}</h3>
      <dl className="traits">
        {identity.traits.map((t) => (
          <div key={t.label}>
            <dt>{t.label}</dt>
            <dd>{t.value}</dd>
          </div>
        ))}
      </dl>
      <p className="panel__flavor">
        {l.wantedFor}: {identity.wantedFor}. {l.lastSeen}: {identity.lastSeen}.
      </p>
    </>
  );
}
