/**
 * Flexibility: adding experiences, projects, or skills must never push
 * anything out of the cockpit.
 */
import { CARGO_DOOR, POSTER_SIZE, POSTER_SLOTS, posterSlot } from '../src/hub/layout';
import { timelineLocal, TIMELINE } from '../src/hub/timeline';
import { portfolioSchema } from '../src/content/schema';
import { portfolio } from '../src/content/portfolio';

const inCockpit = ([x, y, z]: readonly number[]) =>
  Math.abs(x!) <= 1.25 && y! > 0 && y! < 2.2 && z! > -1.4 && z! <= 3.0;

describe('layout flexibility', () => {
  it('every poster slot is inside the ship, and posters never overlap each other or the door', () => {
    POSTER_SLOTS.forEach((s) => expect(inCockpit(s.position)).toBe(true));
    const { w, h } = POSTER_SIZE;
    const overlap = (a: readonly number[], b: readonly number[], bw: number, bh: number) =>
      Math.abs(a[2]! - b[2]!) < 0.1 &&
      Math.abs(a[0]! - b[0]!) < (w + bw) / 2 &&
      Math.abs(a[1]! - b[1]!) < (h + bh) / 2;
    for (let i = 0; i < POSTER_SLOTS.length; i++) {
      const a = POSTER_SLOTS[i]!.position;
      for (let j = i + 1; j < POSTER_SLOTS.length; j++)
        expect(overlap(a, POSTER_SLOTS[j]!.position, w, h)).toBe(false);
      // The door plus its 10 cm frame.
      expect(overlap(a, CARGO_DOOR.position, CARGO_DOOR.width + 0.2, CARGO_DOOR.height + 0.1)).toBe(false);
    }
  });

  it('extra posters never index past the slot list', () => {
    expect(posterSlot(99)).toBe(POSTER_SLOTS[POSTER_SLOTS.length - 1]);
  });

  it('the schema refuses more projects than poster slots', () => {
    const extra = Array.from({ length: POSTER_SLOTS.length + 1 }, (_, i) => ({
      ...portfolio.propaganda[0]!,
      id: `p${i}`,
    }));
    expect(portfolioSchema.safeParse({ ...portfolio, propaganda: extra }).success).toBe(false);
  });

  it.each([1, 2, 8, 20])('a timeline of %i charges stays within the star map', (n) => {
    for (let i = 0; i < n; i++) {
      const [x, y] = timelineLocal(i, n);
      expect(Math.abs(x)).toBeLessThanOrEqual(TIMELINE.width / 2 + 1e-9);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.07);
    }
  });
});
