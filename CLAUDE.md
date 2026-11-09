# Piano Playground

An ad-monetized piano reference site (chords, scales, keys, progressions) built on a Next.js 15 playground, plus an interactive Studio.

## Layout

- `src/app/(site)/` — the public reference site (keys, chords, progressions, about/privacy/contact). Server-rendered pages.
- `src/app/studio/` — the interactive Studio (client component). Keep it separate from the public site: site pages must not import Studio code.
- `src/lib/` — the pure music engine. No React, no DOM, no audio here.
  - `music.ts` — notes, chords, qualities, voicings, scales, diatonic chords.
  - `reference.ts` — slugs, canonical spellings, inversions, voice leading, `LAUNCH_QUALITIES` (which chord pages exist).
  - `keys.ts` — key hub data.
  - `progressions.ts` — Roman-numeral progressions as data, tagged pop/jazz/blues. A step is a scale degree, or `[degree, quality, numeral]` for chords outside the key (blues I7, minor V7); chords are computed from the engine.
  - `builder.ts` — progression builder state: typed-progression parsing and the shareable URL (`?key=g-major&p=1-5-6-4&chords=sevenths&inv=smooth`). The Studio reads the same query to import a progression.
  - `site-paths.ts` — every indexable path; feeds `sitemap.ts`. Add new public routes here.
  - `audio.ts`, `samples.ts` — Tone.js playback and the Salamander piano samples (CC BY 3.0, credited on About).
- `src/components/` — shared UI. `keyboard-svg.tsx` draws diagrams (pages with hundreds of diagrams, like the chart, render `<KeyboardDefs />` once and pass `shared` so each diagram draws only its pressed keys); `instrument-toggle.tsx` is the Synth/Piano switch.
- `tests/*.test.mjs` — `node:test` suites that import the engine `.ts` files directly.

## Conventions

- Keep piano diagrams and chord/scale content server-rendered (SVG in HTML), so pages are indexable and work without JS. Only playback controls and toggles are client components.
- Public URLs use trailing slashes (`trailingSlash: true`) and ASCII slugs (`f-sharp`, `b-flat-minor-7`).
- Put music logic in `src/lib` with tests, not in page components.
- Ads only render behind the consent banner (`ad-slot.tsx`, `consent.ts`).

## Workflow

- Run `npm test` before every commit. Run `npm run build` for changes that touch routes or rendering.
- Leave deployment and hosting config alone for now.
- Browser check: `npm run dev`, then `node scripts/browser-check.mjs` (Windows + Chrome).

## Roadmap

- Printable cheat sheets in Letter and A4
- FAQ and theory sections
