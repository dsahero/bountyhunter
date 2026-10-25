/**
 * Your photo for the wanted poster, loaded live so it follows your profile:
 * `identity.portrait` first (e.g. your LinkedIn photo via unavatar.io), then
 * `identity.portraitFallback` (e.g. your GitHub avatar). If neither loads,
 * everything shows the silhouette instead.
 *
 * The image is requested with CORS so it can be drawn onto the in-world
 * (canvas) screens as well as shown in the page.
 */
import { useEffect, useState } from 'react';
import { portfolio } from '../content/portfolio';

const sources = () =>
  [portfolio.identity.portrait, portfolio.identity.portraitFallback].filter(
    (s): s is string => !!s,
  );

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let photo: Promise<HTMLImageElement | null> | null = null;

/** The first source that loads (shared by everything that shows the photo). */
export function loadPortrait() {
  photo ??= (async () => {
    for (const src of sources()) {
      try {
        return await loadImage(src);
      } catch {
        /* try the next one */
      }
    }
    return null;
  })();
  return photo;
}

/** The loaded photo, or null until (unless) one loads. */
export function usePortrait() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let alive = true;
    void loadPortrait().then((i) => alive && setImg(i));
    return () => {
      alive = false;
    };
  }, []);
  return img;
}
