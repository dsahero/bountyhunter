/**
 * The main computer's UI state: which page it shows and which item has
 * keyboard focus (drawn as a ring on the in-world screen).
 */
import { create } from 'zustand';

export type ConsoleMode = 'menu' | 'contacts';

interface ConsoleUiState {
  mode: ConsoleMode;
  focus: string | null;
  /** Which page of files the menu shows (it flips when there are more than fit). */
  page: number;
  set: (patch: Partial<Omit<ConsoleUiState, 'set'>>) => void;
}

export const useConsoleUi = create<ConsoleUiState>((set) => ({
  mode: 'menu',
  focus: null,
  page: 0,
  set: (patch) => set(patch),
}));
