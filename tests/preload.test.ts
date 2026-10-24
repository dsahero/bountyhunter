import { preload, progressFraction, usePreload } from '../src/lib/preload';

describe('preload progress', () => {
  it('reports an empty queue as complete', () => {
    expect(progressFraction({ done: 0, total: 0 })).toBe(1);
  });

  it('counts finished and failed tasks, and dedupes by name', async () => {
    const start = usePreload.getState();
    let resolveA!: () => void;
    const a = preload('test-a', () => new Promise<void>((r) => (resolveA = r)));
    preload('test-a', () => Promise.resolve()); // same name: reused, not double-counted
    const b = preload('test-b', () => Promise.reject(new Error('boom')));

    expect(usePreload.getState().total).toBe(start.total + 2);
    await b.catch(() => {});
    expect(usePreload.getState().done).toBe(start.done + 1);
    expect(usePreload.getState().failed).toContain('test-b');

    resolveA();
    await a;
    expect(usePreload.getState().done).toBe(start.done + 2);
  });
});
