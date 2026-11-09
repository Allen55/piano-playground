import { SALAMANDER_URLS, SAMPLE_BASE_URL } from "./samples";

export type Instrument = "synth" | "piano";
const STORAGE_KEY = "instrument";

let synth: import("tone").PolySynth<import("tone").Synth> | null = null;
let sampler: import("tone").Sampler | null = null;
let samplerLoading: Promise<import("tone").Sampler | null> | null = null;
let toneModule: typeof import("tone") | null = null;
let instrument: Instrument = "synth";

async function getSynth() {
  if (!toneModule) toneModule = await import("tone");
  await toneModule.start();
  if (!synth) synth = new toneModule.PolySynth(toneModule.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.012, decay: 0.22, sustain: 0.28, release: 1.05 } }).toDestination();
  synth.volume.value = -11;
  return { synth, tone: toneModule };
}

/** Loads the piano samples once. Resolves to null if they fail to load, so callers can fall back to the synth. */
function getSampler(tone: typeof import("tone")): Promise<import("tone").Sampler | null> {
  if (sampler) return Promise.resolve(sampler);
  if (!samplerLoading) {
    samplerLoading = new Promise(resolve => {
      const timeout = setTimeout(() => { samplerLoading = null; resolve(null); }, 8000);
      const instance = new tone.Sampler({
        urls: SALAMANDER_URLS, baseUrl: SAMPLE_BASE_URL, release: 1, volume: -4,
        onload: () => { clearTimeout(timeout); sampler = instance; resolve(instance); },
        onerror: () => { clearTimeout(timeout); instance.dispose(); samplerLoading = null; resolve(null); },
      }).toDestination();
    });
  }
  return samplerLoading;
}

export function getInstrument(): Instrument { return instrument; }

/** Reads the remembered choice (browser only) and applies it. Call once from a client effect. */
export function loadInstrument(): Instrument {
  try { if (window.localStorage.getItem(STORAGE_KEY) === "piano") instrument = "piano"; } catch { /* storage blocked */ }
  return instrument;
}

export function setInstrument(next: Instrument): void {
  instrument = next;
  try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* storage blocked */ }
  if (next === "piano") void preloadPiano();
}

/** Start downloading the samples ahead of the first note. */
export async function preloadPiano(): Promise<boolean> {
  if (!toneModule) toneModule = await import("tone");
  return (await getSampler(toneModule)) !== null;
}

type Voice = { tone: typeof import("tone"); play: (midi: number, length: number, time?: number, velocity?: number) => void };
async function getVoice(): Promise<Voice> {
  const { synth, tone } = await getSynth();
  if (instrument === "piano") {
    const piano = await getSampler(tone);
    if (piano) return { tone, play: (midi, length, time, velocity) => piano.triggerAttackRelease(tone.Frequency(midi, "midi").toNote(), length, time, velocity) };
  }
  return { tone, play: (midi, length, time, velocity) => synth.triggerAttackRelease(tone.Frequency(midi, "midi").toFrequency(), length, time, velocity) };
}

export async function playMidi(midi: number, length = 0.65) { const voice = await getVoice(); voice.play(midi, length); }
export async function playNotes(midis: number[], arpeggiate = false, length = 1.5) {
  const voice = await getVoice();
  const now = voice.tone.now();
  [...new Set(midis)].sort((a, b) => a - b).forEach((midi, i) => voice.play(midi, length, now + (arpeggiate ? i * 0.115 : 0), 0.68));
}
