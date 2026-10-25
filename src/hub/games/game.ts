/**
 * The defense-terminal minigames share this shape: pure TypeScript logic
 * (testable without a browser) plus a draw call into the console canvas.
 */
import type { Region } from '../../three/ui/canvasKit';

export interface Game {
  /** Advance by dt seconds. */
  update(dt: number): void;
  /** A key press (KeyboardEvent.key; `repeat` for OS auto-repeat). Returns true if the game used it. */
  key(key: string, repeat?: boolean): boolean;
  /** A key release (for games with held keys). */
  keyUp?(key: string): void;
  /** A click on one of the regions this game drew. */
  click?(id: string): void;
  /** Draw inside the box; return clickable regions. */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): Region[];
  /** One-line progress, e.g. "3 / 5". */
  progress(): string;
  done: boolean;
}

/** Deterministic-enough randomness that tests can seed. */
export type Rand = () => number;

export const pick = <T>(rand: Rand, list: readonly T[]): T =>
  list[Math.floor(rand() * list.length)]!;
