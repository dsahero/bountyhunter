import { chooseTier } from '../src/lib/quality';

describe('quality tier', () => {
  it('falls back to 2D without WebGL', () => {
    expect(chooseTier({ webgl: false, mobile: false, cores: 16 })).toBe('none');
  });

  it('uses the low tier on phones and weak machines', () => {
    expect(chooseTier({ webgl: true, mobile: true })).toBe('low');
    expect(chooseTier({ webgl: true, mobile: false, cores: 4 })).toBe('low');
    expect(chooseTier({ webgl: true, mobile: false, cores: 8, memory: 4 })).toBe('low');
  });

  it('uses the high tier on capable desktops, including when hints are missing', () => {
    expect(chooseTier({ webgl: true, mobile: false, cores: 8, memory: 8 })).toBe('high');
    expect(chooseTier({ webgl: true, mobile: false })).toBe('high');
  });
});
