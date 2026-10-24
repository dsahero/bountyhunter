/**
 * Real loading progress.
 *
 * Heavy pieces (the hub/3D code chunk, fonts, later the 3D assets) are
 * registered as tasks and kicked off as soon as the visitor lands on the
 * gate. They keep loading in the background while the title card and crawl
 * play, so by the time the crawl ends there's usually nothing left to wait for.
 *
 * Progress is "tasks finished / tasks started", which is honest: it only moves
 * when something has actually finished downloading.
 */
import { create } from 'zustand';

interface PreloadState {
  done: number;
  total: number;
  failed: string[];
}

export const usePreload = create<PreloadState>(() => ({ done: 0, total: 0, failed: [] }));

const started = new Map<string, Promise<unknown>>();

/** Start a named task once; calling again with the same name reuses it. */
export function preload<T>(name: string, task: () => Promise<T>): Promise<T> {
  const existing = started.get(name);
  if (existing) return existing as Promise<T>;

  usePreload.setState((s) => ({ total: s.total + 1 }));
  const promise = task().then(
    (value) => {
      usePreload.setState((s) => ({ done: s.done + 1 }));
      return value;
    },
    (error: unknown) => {
      // Count failures as finished so the bar never hangs; record them for the fallback logic.
      usePreload.setState((s) => ({ done: s.done + 1, failed: [...s.failed, name] }));
      throw error;
    },
  );
  started.set(name, promise);
  return promise;
}

export function progressFraction({ done, total }: Pick<PreloadState, 'done' | 'total'>): number {
  return total === 0 ? 1 : done / total;
}
