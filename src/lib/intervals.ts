// Interval naming, spelling and question generation for the interval trainer. Pure data: no React, no DOM, no audio.
import { diatonicOf, enharmonicSpellings, HIGHEST_MIDI, LETTERS, LOWEST_MIDI, midiOf, naturalAt, pitchName, spell, staffStep, type Clef, type Pitch, type Rng } from "./notation.ts";

export type Quality = "P" | "M" | "m" | "A" | "d";
export type IntervalSpec = { number: number; quality: Quality };
export type Direction = "up" | "down" | "together";

export const QUALITY_NAME: Record<Quality, string> = { P: "perfect", M: "major", m: "minor", A: "augmented", d: "diminished" };
export const QUALITIES: Quality[] = ["P", "M", "m", "A", "d"];
const MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11];

const simpleOf = (n: number) => ((n - 1) % 7) + 1;
export const isPerfectClass = (n: number) => [1, 4, 5].includes(simpleOf(n));

export function numberName(n: number): string {
  if (n === 1) return "unison";
  if (n === 8) return "octave";
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

export const intervalName = (s: IntervalSpec) => `${QUALITY_NAME[s.quality]} ${numberName(s.number)}`;
/** "a major 3rd", "an augmented 4th", "an octave", "an 11th". */
export const withArticle = (text: string) => (/^(a|e|i|o|8|11|18)/i.test(text) ? "an " : "a ") + text;
export const intervalShort = (s: IntervalSpec) => `${s.quality}${s.number}`;
export const sameSpec = (a: IntervalSpec, b: IntervalSpec) => a.number === b.number && a.quality === b.quality;

/** Semitones in the major or perfect interval of this number (C up to that letter). */
const baseSemis = (n: number) => MAJOR_SEMIS[simpleOf(n) - 1] + 12 * Math.floor((n - 1) / 7);

function qualityOffset(n: number, q: Quality): number | null {
  if (isPerfectClass(n)) return ({ d: -1, P: 0, A: 1 } as Record<Quality, number>)[q] ?? null;
  return ({ d: -2, m: -1, M: 0, A: 1 } as Record<Quality, number>)[q] ?? null;
}

export function specSemitones(s: IntervalSpec): number {
  const off = qualityOffset(s.number, s.quality);
  if (off === null) throw new Error(`No ${s.quality}${s.number}`);
  return baseSemis(s.number) + off;
}

export type Measured = IntervalSpec & { semitones: number; direction: "up" | "down" | "same" };

/** The written interval from a to b. Numbers come from letter names, quality from semitones. Null for qualities beyond doubly augmented/diminished. */
export function intervalBetween(a: Pitch, b: Pitch): Measured | null {
  let steps = diatonicOf(b) - diatonicOf(a);
  let semis = midiOf(b) - midiOf(a);
  const direction = steps > 0 ? "up" : steps < 0 ? "down" : semis === 0 ? "same" : semis > 0 ? "up" : "down";
  if (steps < 0 || (steps === 0 && semis < 0)) { steps = -steps; semis = -semis; }
  const number = steps + 1;
  const diff = semis - baseSemis(number);
  let quality: Quality | undefined;
  if (isPerfectClass(number)) quality = diff === 0 ? "P" : diff === 1 ? "A" : diff === -1 ? "d" : undefined;
  else quality = diff === 0 ? "M" : diff === -1 ? "m" : diff === 1 ? "A" : diff === -2 ? "d" : undefined;
  if (!quality) return null;
  return { number, quality, semitones: semis, direction };
}

/** Spell the note an interval above or below `p`. Null if it would need more than a double sharp or flat. */
export function transpose(p: Pitch, s: IntervalSpec, dir: "up" | "down"): Pitch | null {
  const sign = dir === "up" ? 1 : -1;
  const nat = naturalAt(diatonicOf(p) + sign * (s.number - 1));
  const acc = midiOf(p) + sign * specSemitones(s) - midiOf(nat);
  if (Math.abs(acc) > 2) return null;
  return { ...nat, acc };
}

/** Intervals the trainer asks about. Every simple interval with common augmented and diminished spellings, then compounds to the 15th. */
export const INTERVALS: IntervalSpec[] = ([
  "P1", "m2", "M2", "A2", "m3", "M3", "d4", "P4", "A4", "d5", "P5", "A5", "m6", "M6", "A6", "d7", "m7", "M7", "P8",
  "m9", "M9", "A9", "m10", "M10", "P11", "A11", "d12", "P12", "m13", "M13", "m14", "M14", "P15",
] as const).map(t => ({ quality: t[0] as Quality, number: Number(t.slice(1)) }));

// ---- Ear training: one answer per distance ----

const EAR_NAMES = ["Unison", "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave"];
const EAR_COMPOUND = ["Minor 9th", "Major 9th", "Minor 10th", "Major 10th", "Perfect 11th", "Compound tritone", "Perfect 12th", "Minor 13th", "Major 13th", "Minor 14th", "Major 14th", "Two octaves (15th)"];
export const earName = (semis: number) => (semis <= 12 ? EAR_NAMES[semis] : EAR_COMPOUND[semis - 13]);

/** The spellings an audio-only question may use for a distance. Only the tritones have two. */
export function earSpellings(semis: number): IntervalSpec[] {
  if (semis === 6) return [{ number: 4, quality: "A" }, { number: 5, quality: "d" }];
  if (semis === 18) return [{ number: 11, quality: "A" }, { number: 12, quality: "d" }];
  return INTERVALS.filter(s => specSemitones(s) === semis && (s.quality !== "A" && s.quality !== "d"));
}

// ---- Explanations ----

/** Letter steps and semitone count, in a sentence or two, e.g. for E♭4 up to G4. */
export function explainInterval(a: Pitch, b: Pitch): string {
  const m = intervalBetween(a, b);
  if (!m) return `${pitchName(a)} to ${pitchName(b)}.`;
  const step = diatonicOf(b) >= diatonicOf(a) ? 1 : -1;
  const letters: string[] = [];
  for (let d = diatonicOf(a); ; d += step) { letters.push(LETTERS[((d % 7) + 7) % 7]); if (d === diatonicOf(b)) break; }
  const seq = letters.length <= 9 ? letters.join("–") : `${letters.slice(0, 3).join("–")}–…–${letters.slice(-2).join("–")}`;
  const dirWord = m.direction === "down" ? "down" : m.direction === "up" ? "up" : "to";
    const countText = m.number === 1 ? `Both notes use the letter ${LETTERS[a.letter]}, so it is a unison.` : `Counting letter names ${dirWord} from ${spell(a)} to ${spell(b)} (${seq}) gives ${m.number}, so it is ${withArticle(numberName(m.number))}.`;
  const base = baseSemis(m.number);
  const reference = isPerfectClass(m.number) ? `A perfect ${numberName(m.number)}` : `A major ${numberName(m.number)}`;
  const diff = m.semitones - base;
  const why = diff === 0 ? "" : diff === -1 && !isPerfectClass(m.number) ? " One fewer makes it minor." : diff < 0 ? ` ${-diff === 1 ? "One" : "Two"} fewer makes it diminished.` : " One more makes it augmented.";
  const semiText = `${reference} spans ${base} semitone${base === 1 ? "" : "s"}; this one spans ${m.semitones}.${why}`;
  const compound = m.number > 8 ? ` It is a compound interval: an octave plus a ${QUALITY_NAME[m.quality]} ${numberName(m.number - 7)}.` : "";
  return `${countText} ${semiText}${compound}`;
}

// ---- Filters and questions ----

export type Exercise = "identify" | "build" | "ear";
export type IntervalFilters = {
  exercise: Exercise;
  treble: boolean;
  bass: boolean;
  up: boolean;
  down: boolean;
  together: boolean;
  sizes: number[];
  qualities: Quality[];
  /** Identify: answer with the number only, or the full name with quality. */
  answer: "number" | "full";
  /** Build: after the right key, also pick the written spelling. */
  spelling: boolean;
};

export const INTERVAL_PRESETS: { id: string; label: string; sizes: number[]; qualities: Quality[] }[] = [
  { id: "beginner", label: "Beginner", sizes: [1, 2, 3, 4, 5, 8], qualities: ["P", "M", "m"] },
  { id: "simple", label: "All simple", sizes: [1, 2, 3, 4, 5, 6, 7, 8], qualities: ["P", "M", "m", "A", "d"] },
  { id: "compound", label: "Compound to 15th", sizes: Array.from({ length: 15 }, (_, i) => i + 1), qualities: ["P", "M", "m", "A", "d"] },
];

export const DEFAULT_INTERVAL_FILTERS: IntervalFilters = {
  exercise: "identify", treble: true, bass: true, up: true, down: true, together: true,
  sizes: INTERVAL_PRESETS[0].sizes, qualities: INTERVAL_PRESETS[0].qualities, answer: "number", spelling: true,
};

export const eligibleIntervals = (f: IntervalFilters) => INTERVALS.filter(s => f.sizes.includes(s.number) && f.qualities.includes(s.quality));

/** The answer buttons for a question type. */
export function earDistances(f: IntervalFilters): number[] {
  return [...new Set(eligibleIntervals(f).map(specSemitones))].sort((a, b) => a - b);
}

export function enabledDirections(f: IntervalFilters): Direction[] {
  return (["up", "down", "together"] as Direction[]).filter(d => f[d]);
}

export function explainNoIntervals(f: IntervalFilters): string[] {
  const out: string[] = [];
  if (f.sizes.length === 0) out.push("No interval sizes are selected.");
  if (f.qualities.length === 0) out.push("No qualities are selected.");
  if (f.sizes.length && f.qualities.length && eligibleIntervals(f).length === 0) {
    const sizes = f.sizes.map(numberName).join(", ");
    const quals = f.qualities.map(q => QUALITY_NAME[q]).join(", ");
    out.push(`None of the selected sizes (${sizes}) come in the selected qualities (${quals}). Unisons, 4ths, 5ths and octaves are perfect; 2nds, 3rds, 6ths and 7ths are major or minor.`);
  }
  if (enabledDirections(f).length === 0) out.push("No direction is selected. Turn on ascending, descending or together.");
  if (f.exercise === "build" && !f.up && !f.down) out.push("Build needs ascending or descending; together has no direction to build in.");
  if (f.exercise !== "ear" && !f.treble && !f.bass) out.push("Written exercises need a clef. Turn on treble, bass or both.");
  return out;
}

export type IntervalQuestion = {
  id: string;
  exercise: Exercise;
  clef: Clef;
  /** First note shown or played; for `together`, the lower note. */
  a: Pitch;
  b: Pitch;
  spec: IntervalSpec;
  direction: Direction;
};

// Written intervals stay within three ledger lines of the staff.
const WRITTEN_STEPS = { min: -6, max: 14 };
const pick = <T,>(items: T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

/** Make a question that fits the filters, or null if they allow none. Avoids repeating `lastId` when it can. */
export function makeIntervalQuestion(f: IntervalFilters, rng: Rng, lastId?: string): IntervalQuestion | null {
  if (explainNoIntervals(f).length) return null;
  const directions = enabledDirections(f).filter(d => f.exercise !== "build" || d !== "together");
  const clefs = (["treble", "bass"] as Clef[]).filter(c => f[c]);
  const specs = f.exercise === "ear" ? earDistances(f).map(semis => earSpellings(semis)) : eligibleIntervals(f).map(s => [s]);
  for (let attempt = 0; attempt < 400; attempt++) {
    const spec = pick(pick(specs, rng), rng);
    const direction = pick(directions, rng);
    const written = direction === "down" ? "down" : "up";
    let clef: Clef, a: Pitch | null = null;
    if (f.exercise === "ear") {
      // Low note between C3 and C5 keeps the sound in a comfortable register.
      const start = 48 + Math.floor(rng() * 24) + (written === "down" ? specSemitones(spec) : 0);
      a = pick(enharmonicSpellings(start).filter(p => Math.abs(p.acc) <= 1), rng);
      const mid = written === "down" ? start - specSemitones(spec) / 2 : start + specSemitones(spec) / 2;
      clef = mid >= 60 ? "treble" : "bass";
    } else {
      clef = pick(clefs, rng);
      const step = WRITTEN_STEPS.min + Math.floor(rng() * (WRITTEN_STEPS.max - WRITTEN_STEPS.min + 1));
      const nat = naturalAt(step + (clef === "treble" ? 30 : 18));
      const r = rng();
      a = { ...nat, acc: r < 0.7 ? 0 : r < 0.85 ? 1 : -1 };
    }
    const b = transpose(a, spec, written);
    if (!b || Math.abs(a.acc) > 1 || Math.abs(b.acc) > 1) continue;
    const midis = [midiOf(a), midiOf(b)];
    if (Math.min(...midis) < LOWEST_MIDI || Math.max(...midis) > HIGHEST_MIDI) continue;
    if (f.exercise !== "ear") {
      const steps = [staffStep(a, clef), staffStep(b, clef)];
      if (Math.min(...steps) < WRITTEN_STEPS.min || Math.max(...steps) > WRITTEN_STEPS.max) continue;
    }
    const id = `${f.exercise}:${direction}:${pitchName(a)}:${pitchName(b)}`;
    if (id === lastId && attempt < 399) continue;
    return { id, exercise: f.exercise, clef, a, b, spec, direction };
  }
  return null;
}

/** Spellings to choose from once the right key is found in Build, lowest letter first. Always includes the answer. */
export const spellingChoices = (p: Pitch) => enharmonicSpellings(midiOf(p));
