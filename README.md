# Bounty Hunter Cockpit

A cinematic, first-person, Star Wars-inspired portfolio. You play a bounty hunter, and the target on the dossier is me, [Lihi Ancikovsky](https://www.linkedin.com/in/lihi-ancikovsky).

My background is told as in-universe lore:

| Real          | In-universe                                    |
| ------------- | ---------------------------------------------- |
| Virginia Tech | Homeworld planet; courses are moons  |
| Internships   | Charges on the warrant, one planet per city    |
| Leadership    | "Inciting organized rebellion"                 |
| Projects      | Rebel propaganda                               |
| Skills        | Known associates (e.g. Clone Trooper "Python") |

**In a hurry?** `/dossier` is a plain, fast, text-only version of everything.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
```

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm test`        | Unit tests (Vitest)                                 |
| `npm run e2e`     | Browser tests, desktop + mobile (Playwright)        |
| `npm run build`   | Production build, including the prerendered dossier |
| `npm run preview` | Serve the production build                          |

Add `?tier=none` to the URL to see the no-WebGL fallback, or `?shot=18` to freeze the intro at 18 seconds.

## Controls

Drag to look around; scroll, pinch, or `+`/`-` to zoom. Arrow keys and Enter drive the main computer and panels (after a drag, the first arrow press re-centers the view). Backspace goes back one step; Esc returns to the computer. Anything clickable gets an outline on hover.

## Edit the content

Everything on the site, including the crawl, labels, captions, contacts, and minigame text, lives in [`src/content/portfolio.ts`](src/content/portfolio.ts) (site copy is under `site`). Add or remove experiences, projects (up to 10 poster slots), and skills freely; the layouts adapt. Optional music files go in `site.audio` (empty uses the built-in synth). The resume PDF is [`public/resume.pdf`](public/resume.pdf). Run `npm test` after editing: it checks the content against the schema.

## Edit the hunter in Blender

`npm run export:hunter` writes `exports/hunter.glb` (File > Import > glTF 2.0 in Blender). Every piece is a separate object named by body part, material, and shape (e.g. `Head_hair_capsule_1`), grouped under the rig pivots (`Spine`, `Neck`, `Head`, `UpperArm_L`, ...). The helmet is exported beside the hunter.

To bring your edits back: export from Blender as `exports/hunter.obj` (Y up, with materials) and run `npm run import:hunter`. It re-attaches every piece to its rig pivot by name and writes `public/models/hunter.glb`, which the site uses in place of the procedural hunter, so the animation still drives it. New pieces just need a pivot prefix (e.g. `Head_bangs`).

## How it works

- **Stack:** Vite, React, TypeScript, React Three Fiber, GSAP, Zustand.
- **One state machine** ([`experience.ts`](src/state/experience.ts)): `gate → title → crawl → arrival → hub`. Skip jumps straight to `hub`.
- **One uncut intro shot** ([`Arrival.tsx`](src/three/scenes/Arrival/Arrival.tsx)): the ship flies overhead, and the camera follows it in through a vent and into the pilot's eyes. The swap from the ship to the cockpit set happens while the vent's black opening fills the frame.
- **In-world screens are canvas textures** on the 3D meshes, so they never drift. Hidden real buttons mirror them for keyboard and screen readers.
- **Easter egg** ([`attack.ts`](src/hub/attack.ts)): pick up the guitar in the cargo hold and the ship comes under attack. The console becomes a terminal with three minigames ([`src/hub/games/`](src/hub/games/)); beating them unlocks the last poster.
- **All 3D is procedural:** the ship, cockpit, hunter, and helmet are built from primitives, and textures are painted on canvases at runtime. No model files are downloaded, and every design is original.
- **Synthesized audio** ([`engine.ts`](src/audio/engine.ts)): every sound is generated live with the Web Audio API, and meaningful sounds are captioned.
- **Post-processing** (high tier only): bloom, scanlines, chromatic aberration, film grain, and vignette.
- **Lazy 3D:** three.js loads in the background during the intro. The first page load is about 66 KB gzipped.
- **The plain dossier is prerendered** to static HTML at build time, so it works without JavaScript and search engines can index it.
- **Quality tiers** ([`quality.ts`](src/lib/quality.ts)) lower the effects on phones and fall back to a 2D cockpit when WebGL is unavailable.

## Accessibility

- Skip intro is visible from the first frame, and the plain dossier is always one click away.
- Everything is reachable by keyboard: arrow keys look around the cockpit.
- Reduced motion swaps camera moves for cuts and removes sway.
- Sound stays off until you choose it.

## Roadmap

- [x] M1: Content, plain dossier, intro, skip
- [x] M2: Exterior ship shot, boarding, first-person cockpit
- [x] M3: Dossier stations (star map, charges, associates, propaganda, comms)
- [x] M4: Post-processing, audio, ambient life
- [x] M5: Guitar attack sequence, terminal minigames, comms, weapons
- [ ] M6: Mobile, accessibility, and performance pass; deploy

---

Unofficial fan project, not affiliated with Lucasfilm or Disney. All art, models, and sound effects are original (the music tracks are supplied recordings); see [CREDITS.md](CREDITS.md).
