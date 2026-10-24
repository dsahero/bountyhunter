/**
 * Sound + caption together. Any sound that carries meaning also gets a
 * caption, so nothing is conveyed only by audio. Captions are always on,
 * with or without sound.
 */
import { create } from 'zustand';
import { audio, type Sfx } from './engine';

interface Caption {
  id: number;
  text: string;
}

export const useCaptions = create<{ items: Caption[] }>(() => ({ items: [] }));

let nextId = 1;

export function caption(text: string, ms = 2600) {
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
