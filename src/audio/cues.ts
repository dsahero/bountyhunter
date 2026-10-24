/**
 * Sound + caption together. Any sound that carries meaning also gets a
 * caption, so nothing is conveyed only by audio. Captions only show while
 * sound is on (they describe what you'd be hearing).
 */
import { create } from 'zustand';
import { audio, type Sfx } from './engine';
import { useSettings } from '../state/settings';

interface Caption {
  id: number;
  text: string;
}

export const useCaptions = create<{ items: Caption[] }>(() => ({ items: [] }));

let nextId = 1;

export function caption(text: string, ms = 2600) {
  if (!useSettings.getState().soundEnabled) return;
  const id = nextId++;
  useCaptions.setState((s) => ({ items: [...s.items.slice(-2), { id, text }] }));
  window.setTimeout(
    () => useCaptions.setState((s) => ({ items: s.items.filter((c) => c.id !== id) })),
    ms,
  );
}

export function cue(sfx: Sfx, text?: string) {
  audio.play(sfx);
  if (text) caption(text);
}
