import { nextPhase, PHASE_ORDER_3D, useExperience } from '../src/state/experience';
import { useSettings } from '../src/state/settings';

describe('experience state machine', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettings.getState().set({ skipIntro: false });
    useExperience.setState({ phase: 'gate' });
    useExperience.getState().configure({ webgl: true });
  });

  const walk = () => {
    const seen = [useExperience.getState().phase];
    for (let i = 0; i < 10 && useExperience.getState().phase !== 'hub'; i++) {
      useExperience.getState().advance();
      seen.push(useExperience.getState().phase);
    }
    return seen;
  };

  it('walks the full 3D intro in order and ends at the hub', () => {
    expect(walk()).toEqual(['gate', 'title', 'crawl', 'arrival', 'hub']);
  });

  it('routes around the 3D scenes on devices without WebGL', () => {
    useExperience.getState().configure({ webgl: false });
    expect(walk()).toEqual(['gate', 'title', 'crawl', 'hub']);
  });

  it('stays at the hub once reached', () => {
    expect(nextPhase('hub', PHASE_ORDER_3D)).toBe('hub');
  });

  it('skip jumps straight to the hub and remembers it', () => {
    useExperience.getState().skip();
    expect(useExperience.getState().phase).toBe('hub');
    expect(useSettings.getState().skipIntro).toBe(true);
    expect(JSON.parse(localStorage.getItem('bh.settings')!).skipIntro).toBe(true);
  });

  it('finishing the intro naturally also remembers to skip next time', () => {
    useExperience.setState({ phase: 'arrival' });
    useExperience.getState().advance();
    expect(useSettings.getState().skipIntro).toBe(true);
  });

  it('replay returns to the gate and stops auto-skipping', () => {
    useExperience.getState().skip();
    useExperience.getState().replay();
    expect(useExperience.getState().phase).toBe('gate');
    expect(useSettings.getState().skipIntro).toBe(false);
  });
});
