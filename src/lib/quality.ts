/**
 * Picks a rendering quality tier from what the device tells us.
 *
 *   high: desktop-class GPU: full effects, antialiasing, up to 2x DPR
 *   low:  phones and weak laptops: fewer particles, no volumetrics, DPR <= 1.5
 *   none: no WebGL at all: the 2D cockpit fallback is used instead
 *
 * drei's <PerformanceMonitor> can still lower resolution at runtime if FPS drops.
 */
export type Tier = 'high' | 'low' | 'none';

interface DeviceHints {
  webgl: boolean;
  mobile: boolean;
  cores?: number;
  /** GB, from navigator.deviceMemory (Chromium only). */
  memory?: number;
}

export function chooseTier({ webgl, mobile, cores, memory }: DeviceHints): Tier {
  if (!webgl) return 'none';
  if (mobile || (cores !== undefined && cores <= 4) || (memory !== undefined && memory <= 4)) {
    return 'low';
  }
  return 'high';
}

function readDeviceHints(): DeviceHints {
  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    webgl = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    webgl,
    mobile: matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820,
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
  };
}

let cached: Tier | undefined;

/** Detected once per page load. `?tier=none|low|high` in the URL overrides it (handy for testing). */
export function getTier(): Tier {
  if (cached) return cached;
  const forced = new URLSearchParams(location.search).get('tier');
  cached =
    forced === 'none' || forced === 'low' || forced === 'high'
      ? forced
      : chooseTier(readDeviceHints());
  return cached;
}
