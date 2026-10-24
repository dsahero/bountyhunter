import { useState, type FormEvent } from 'react';
import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';

/**
 * "Report a sighting": contact links plus a message form. With no backend
 * yet, sending composes an email in the visitor's mail app (mailto:).
 */
export function ContactPanel() {
  const { contact, identity } = portfolio;
  const [claimed, setClaimed] = useState(false);

  const transmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const from = String(data.get('from') ?? '');
    const message = String(data.get('message') ?? '');
    const subject = encodeURIComponent(`Sighting report from ${from || 'a bounty hunter'}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    setClaimed(true);
  };

  return (
    <>
      <p className="transmission__tag">Incoming transmission · Open frequency</p>
      <p className="panel__lead">Spotted {identity.name}? Report it directly:</p>
      <ul className="contact-links">
        <li>
          <span>Email</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          <span>GitHub</span>
          <a href={contact.github} target="_blank" rel="noreferrer">
            {contact.github.replace('https://', '')}
          </a>
        </li>
        <li>
          <span>LinkedIn</span>
          <a href={contact.linkedin} target="_blank" rel="noreferrer">
            {contact.linkedin.replace('https://www.', '')}
          </a>
        </li>
        {contact.other.map((l) => (
          <li key={l.href}>
            <span>{l.label}</span>
            <a href={l.href}>{l.href}</a>
          </li>
        ))}
      </ul>

      <form className="transmit" onSubmit={transmit}>
        <label>
          Your name / guild
          <input name="from" autoComplete="name" />
        </label>
        <label>
          Message
          <textarea name="message" rows={4} required />
        </label>
        <button className="btn" type="submit">
          Transmit
        </button>
        <p className="panel__flavor">Opens your email app with the message ready to send.</p>
      </form>

      {claimed && (
        <div className="claimed" role="status">
          <div className="cryo" aria-hidden="true">
            <span className="cryo__name">{identity.name}</span>
          </div>
          <span className="claimed__stamp">Bounty claimed</span>
          <p>{lore.quips.contactSent}</p>
        </div>
      )}
    </>
  );
}
