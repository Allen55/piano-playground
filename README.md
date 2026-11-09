# Keyframe Piano Playground

An interactive piano and harmony workspace built with Next.js, TypeScript, Tailwind CSS, shadcn-style UI primitives, and Tone.js.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Browser audio starts after your first click or key press.

## What you can do

- Explore all 12 paired major and relative minor keys, plus pentatonic, blues, harmonic and melodic minor, and three modes.
- Hear individual notes or chords from the SVG piano or the A–; computer keyboard keys.
- Choose dreamy, jazz, soulful, pop, and nostalgic progressions. Switch between G major and E minor to hear their relationships.
- Compare chord inversions and playable voicings with left and right hand notes and optional fingering guidance.
- Turn on **Compare chords** above the piano to see every chord layout in the current progression at once. Each layout has its own play and select controls.
- Build and save progressions, adjust beats and tempo, loop or arpeggiate playback, and optimize voice leading.
- Turn on practice feedback or connect a Web MIDI input where the browser supports it.

The music engine lives in `src/lib/music.ts`. UI highlights, hand guidance, and sound playback all use the selected voicing. Preferences and saved progressions stay in local storage.

## Verify

```bash
npm test
npm run build
```

For the browser interaction check, run the app locally and then run `node scripts/browser-check.mjs` on Windows with Chrome installed. The script checks desktop and mobile flows and saves temporary screenshots to the system temp directory.

This is the functional playground and progression studio slice. Guided lessons, backing drums, and deeper jazz scale recommendations are future extensions.
