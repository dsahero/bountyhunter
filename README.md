# Bounty Hunter Cockpit

A cinematic, first-person, Star Wars-inspired portfolio. You play a bounty hunter, and the target on the dossier is me, [Lihi Ancikovsky](https://www.linkedin.com/in/lihi-ancikovsky).

My background is told as in-universe lore:

| Real          | In-universe                                    |
| ------------- | ---------------------------------------------- |
| Virginia Tech | Homeworld planet; courses are moons            |
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

| Command                                   | What it does                                                   |
| ----------------------------------------- | -------------------------------------------------------------- |
| `npm test`                                | Unit tests (Vitest)                                            |
| `npm run e2e`                             | Browser tests, desktop + mobile (Playwright)                   |
| `npm run build`                           | Production build, including the prerendered dossier            |
| `npm run preview`                         | Serve the production build                                     |
| `npm run sync:github`                     | Pull your public repos (new ones become posters)               |
| `npm run capture:media -- id=url`         | Record a looping clip + still of a live project for its poster |
| `npm run og:image`                        | Re-render the link-preview image from your content             |
| `npm run export:hunter` / `import:hunter` | Round-trip the hunter model through Blender                    |

Add `?tier=none` to the URL to see the no-WebGL fallback, or `?shot=18` to freeze the intro at 18 seconds.

## Recruiter briefing

[`/recruiter`](src/recruiter/RecruiterBriefing.tsx) is a fast, no-intro page built for a 60-second scan, prerendered like `/dossier` (works without JavaScript, prints cleanly):

- Status, availability, location, and clearance up top, with one-tap **Email**, **Resume**, **Copy email**, **Save contact** (vCard), **Book a call** (if `recruiter.scheduleUrl` is set), LinkedIn, and GitHub.
- **At a glance:** headline numbers, each backed by a resume line.
- **Tailor this briefing:** pick a role (Full-stack, ML / AI, Data, Systems & DevOps). Experience, projects, and skills reorder by relevance with matches highlighted, and the link updates (`/recruiter?focus=ml`) so a recruiter can forward the tailored page.
- **Copy candidate summary:** a plain-text summary for an ATS or notes, tailored to the chosen role.

Reach it from the start screen ("Recruiter? Skip to the briefing"), the HUD, or by adding `?recruiter` to any link (handy on a resume). Its wording and numbers live in `recruiter` in `portfolio.ts`.

## Share links (no intro)

`/` plays the full intro. Every view also has its own address, which opens straight to it:

| Link                                                         | Opens                               |
| ------------------------------------------------------------ | ----------------------------------- |
| `/cockpit`                                                   | The main computer                   |
| `/projects/dietre`                                           | A project's poster and transmission |
| `/experience/nswc`                                           | A charge on the star map            |
| `/skills/python`                                             | An associate                        |
| `/about`, `/education`, `/leadership`, `/resume`, `/contact` | That station                        |
| `/achievements`, `/guestbook`                                | The console apps                    |

The address bar follows what's on screen, and every panel has a **Share link** button (the phone share sheet on mobile).

## Controls

Drag to look around; scroll, pinch, or `+`/`-` to zoom. Arrow keys and Enter drive the main computer and panels (after a drag, the first arrow press re-centers the view). Backspace goes back one step; Esc returns to the computer. Anything clickable gets an outline on hover.

## Edit the content

Everything on the site, including the crawl, labels, captions, contacts, and minigame text, lives in [`src/content/portfolio.ts`](src/content/portfolio.ts) (site copy is under `site`). Add or remove experiences, projects (up to 12 poster slots), and skills freely; the layouts adapt. Each poster mixes a layout (`posterStyle`), a palette (`posterPalette`), a border, and a stamp; give a project `media` (an image or a short `.mp4`) and it plays on the poster and in its panel. Music files go in `site.audio`. `site.siteUrl` is your deployed address (for link previews). The resume PDF is [`public/resume.pdf`](public/resume.pdf). Run `npm test` after editing: it checks the content against the schema.

## Edit the hunter in Blender

`npm run export:hunter` writes `exports/hunter.glb` (File > Import > glTF 2.0 in Blender). Every piece is a separate object named by body part, material, and shape (e.g. `Head_hair_capsule_1`), grouped under the rig pivots (`Spine`, `Neck`, `Head`, `UpperArm_L`, ...). The helmet is exported beside the hunter.

To bring your edits back: export from Blender as `exports/hunter.obj` (Y up, with materials) and run `npm run import:hunter`. It re-attaches every piece to its rig pivot by name and writes `public/models/hunter.glb`, which the site uses in place of the procedural hunter, so the animation still drives it. New pieces just need a pivot prefix (e.g. `Head_bangs`).

## Guestbook and analytics (one-time setup on Vercel)

- **Guestbook** ("Hunter's log", page 2 of the menu): an Edge Function at [`api/guestbook.ts`](api/guestbook.ts) stores entries in Upstash Redis. In Vercel, add the **Upstash for Redis** integration (free tier) to the project; it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Without it the log shows "offline". Entries are length-limited, link-free, filtered for slurs, rate-limited per visitor, and bot-trapped; delete any entry in the Upstash console (key `guestbook`). Locally, `npm run dev` and `npm run preview` use an in-memory stand-in.
- **Analytics:** cookie-free Vercel Web Analytics (page views plus a few events: stations opened, achievements, shares, deep links). Enable it under Project > Analytics. Nothing is sent from local builds.

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

## Performance

- **Fewer draw calls:** [`StaticBatch`](src/three/perf/StaticBatch.tsx) merges parts that never move (the cockpit shell, canopy, consoles, cargo hold, each hologram bust, the door) into one mesh per material after they mount. Clickable and animated pieces keep their own meshes, so nothing behaves differently. That roughly halves the draw calls.
- **Only what you look at:** [`ViewCull`](src/three/perf/ViewCull.tsx) hides whole regions (the wanted, homeworld, and associates holograms, the poster wall) while they're out of view, and their animations pause (`useInView`). Lights are never culled, so the lighting doesn't change as you turn.
- **Adaptive resolution:** rendering starts at up to 1.5x pixel density and steps between 1x and 2x with the frame rate.
- **Small things:** blinking console lights upload only when one flips; the hunter's hair is checked only when it changes.
- **Measure it:** add `?perf` to any URL for a live readout (fps, draw calls, triangles, lights), or run `npm run perf` for a report across several views.

Why not convert everything to model files? A .glb of the same shapes draws exactly the same way (and adds a download); what costs time is the number of separate meshes, lights, and pixels, which is what the above reduces. Your Blender hunter does load as a model (`public/models/hunter.glb`).

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
- [x] M6: Share links, mobile touch controls, achievements, guestbook, analytics, link previews

---

Unofficial fan project, not affiliated with Lucasfilm or Disney. All art, models, and sound effects are original (the music tracks are supplied recordings); see [CREDITS.md](CREDITS.md).
