/**
 * A full-screen blackout, used to fade between still frames in the
 * reduced-motion version of the intro.
 */
import { create } from 'zustand';

interface CinemaState {
  blackout: boolean;
  setBlackout: (on: boolean) => void;
}

export const useCinema = create<CinemaState>((set) => ({
  blackout: false,
  setBlackout: (blackout) => set({ blackout }),
}));
