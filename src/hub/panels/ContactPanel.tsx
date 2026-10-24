import { useState, type FormEvent } from 'react';
import { portfolio } from '../../content/portfolio';
import { lore } from '../../content/lore';

/**
 * "Report a sighting": contact links plus a message form. With no backend
 * yet, sending composes an email in the visitor's mail app (mailto:).
 */
export function ContactPanel() {
  const { contact, identity } = portfolio;
  const l = lore.labels;
  const [claimed, setClaimed] = useState(false);

  const transmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const from = String(data.get('from') ?? '');
    const message = String(data.get('message') ?? '');
    const subject = encodeURIComponent(`${lore.sections.contact.lore}: ${from}`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${encodeURIComponent(message)}`;
    setClaimed(true);
  };

  return (
    <>
      <p className="transmission__tag">{l.contactTag}</p>
      <p className="panel__lead">{l.contactLead.replace('{NAME}', identity.name)}</p>
      <ul className="contact-links">
        <li>
          <span>{l.email}</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </li>
        <li>
          <span>{l.github}</span>
          <a href={contact.github} target="_blank" rel="noreferrer">
            {contact.github.replace('https://', '')}
          </a>
        </li>
        <li>
          <span>{l.linkedin}</span>
          <a href={contact.linkedin} target="_blank" rel="noreferrer">
            {contact.linkedin.replace('https://www.', '')}
          </a>
        </li>
        {contact.other.map((link) => (
          <li key={link.href}>
            <span>{link.label}</span>
            <a href={link.href}>{link.href}</a>
          </li>
        ))}
      </ul>

      <form className="transmit" onSubmit={transmit}>
        <label>
          {l.yourName}
          <input name="from" autoComplete="name" />
        </label>
        <label>
          {l.message}
          <textarea name="message" rows={4} required />
        </label>
        <button className="btn" type="submit">
          {l.transmit}
        </button>
        <p className="panel__flavor">{l.transmitNote}</p>
      </form>

      {claimed && (
        <div className="claimed" role="status">
          <div className="cryo" aria-hidden="true">
            <span className="cryo__name">{identity.name}</span>
          </div>
          <span className="claimed__stamp">{l.bountyClaimed}</span>
          <p>{lore.quips.contactSent}</p>
        </div>
      )}
    </>
  );
}
