import { useEffect, useRef } from 'react';

/**
 * A cheap static starfield painted once into a 2D canvas (repainted on resize).
 * Used behind the crawl. The 3D scenes get their own GPU starfield later.
 */
export function Starfield({ density = 0.00025 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Seeded PRNG so stars don't jump around on every resize.
    let seed = 1337;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const paint = () => {
      seed = 1337;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const count = Math.floor(canvas.width * canvas.height * density);
      for (let i = 0; i < count; i++) {
        const r = rand() ** 3 * 1.4 * dpr + 0.3;
        ctx.globalAlpha = 0.35 + rand() * 0.65;
        // Mostly white, a few warm and cool stars for depth.
        const tint = rand();
        ctx.fillStyle = tint > 0.93 ? '#ffd7a8' : tint > 0.86 ? '#bfe6ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(rand() * canvas.width, rand() * canvas.height, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    paint();
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
  }, [density]);

  return <canvas ref={ref} className="starfield" aria-hidden="true" />;
}
