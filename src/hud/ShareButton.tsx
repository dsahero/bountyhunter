/**
 * "Share link": copies a link straight to what's on screen (e.g.
 * /projects/dietre), which opens without the intro. Uses the phone's share
 * sheet when there is one.
 */
import { useState } from 'react';
import { lore } from '../content/lore';
import { track } from '../lib/analytics';

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = location.href;
    track('share', { path: location.pathname });
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ url, title: document.title });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* cancelled, or no clipboard access */
    }
  };
  return (
    <button className="panel__back" onClick={share} aria-live="polite">
      {copied ? lore.console.shared : lore.console.share}
    </button>
  );
}
