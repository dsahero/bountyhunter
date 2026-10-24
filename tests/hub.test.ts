import { ANCHORS, EYE, lookAtPoint } from '../src/hub/layout';
import { consoleLook, useHub } from '../src/state/hub';
import { useLook } from '../src/state/look';

describe('station look math', () => {
  it('looks straight ahead at a point directly in front', () => {
    const { yaw, pitch } = lookAtPoint([EYE[0], EYE[1], EYE[2] - 1]);
    expect(yaw).toBeCloseTo(0);
    expect(pitch).toBeCloseTo(0);
  });

  it('turns left (positive yaw) for points on the left, and up for points above', () => {
    expect(lookAtPoint([EYE[0] - 1, EYE[1], EYE[2]]).yaw).toBeCloseTo(Math.PI / 2);
    expect(lookAtPoint([EYE[0], EYE[1] + 1, EYE[2] - 1]).pitch).toBeCloseTo(Math.PI / 4);
  });

  it('places stations where the cockpit layout says they are', () => {
    expect(lookAtPoint(ANCHORS.education).yaw).toBeGreaterThan(0); // left console
    expect(lookAtPoint(ANCHORS.skills).yaw).toBeLessThan(0); // right
    expect(lookAtPoint(ANCHORS.experience).pitch).toBeGreaterThan(0.3); // overhead star map
    expect(Math.abs(lookAtPoint(ANCHORS.projects).yaw)).toBeGreaterThan(3); // behind
    expect(consoleLook().pitch).toBeLessThan(-0.2); // the computer is below eye level
  });
});

describe('hub state', () => {
  it('opening a station turns the head toward it; closing returns to the computer', () => {
    useHub.getState().open('skills');
    expect(useHub.getState().station).toBe('skills');
    expect(useLook.getState().yaw).toBeLessThan(0);

    useHub.getState().close();
    expect(useHub.getState().station).toBeNull();
    expect(useLook.getState().yaw).toBeCloseTo(consoleLook().yaw);
    expect(useLook.getState().pitch).toBeCloseTo(consoleLook().pitch);
  });
});

describe('holo off', () => {
  it('toggles every hologram off and on, and opening a hologram station powers them back up', () => {
    const hub = useHub.getState();
    hub.holoShutdown();
    expect(useHub.getState().holosOff).toBe(true);
    hub.holoShutdown();
    expect(useHub.getState().holosOff).toBe(false);
    hub.holoShutdown();
    useHub.getState().open('education');
    expect(useHub.getState().holosOff).toBe(false);
    useHub.getState().close();
  });

  it('arrow-key recenter brings a dragged view back onto the console', () => {
    useHub.getState().close();
    useLook.getState().nudge(1, 0.3);
    expect(useHub.getState().recenter()).toBe(true);
    const want = consoleLook();
    expect(useLook.getState().yaw).toBeCloseTo(want.yaw);
    expect(useHub.getState().recenter()).toBe(false);
  });
});

describe('overhead hologram', () => {
  it('stays up after closing, until another replaces it or Holo off', () => {
    const hub = useHub.getState();
    hub.open('experience');
    hub.close();
    expect(useHub.getState().overhead).toBe('experience');
    useHub.getState().open('skills'); // not an overhead hologram: no change
    expect(useHub.getState().overhead).toBe('experience');
    useHub.getState().open('leadership');
    expect(useHub.getState().overhead).toBe('leadership');
    useHub.getState().close();
    useHub.getState().holoShutdown(); // off
    expect(useHub.getState().holosOff).toBe(true);
    useHub.getState().holoShutdown(); // pressing it again turns them back on
    expect(useHub.getState().holosOff).toBe(false);
    expect(useHub.getState().overhead).toBe('leadership');
  });
});
