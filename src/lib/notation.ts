// Written pitch and staff geometry for the sight-reading trainer. Pure data: no React, no DOM, no audio.
// A Pitch is a written note (letter + accidental + octave), so F♯4 and G♭4 are different pitches on the same key.

export type Clef = "treble" | "bass";
export type Pitch = { letter: number; acc: number; octave: number };

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_SEMIS = [0, 2, 4, 5, 7, 9, 11];
export const ACC_SIGN: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "", 1: "♯", 2: "𝄪" };
export const ACC_WORD: Record<number, string> = { [-2]: "double flat", [-1]: "flat", 0: "natural", 1: "sharp", 2: "double sharp" };

/** The 88 keys: A0 (MIDI 21) to C8 (MIDI 108). */
export const LOWEST_MIDI = 21;
export const HIGHEST_MIDI = 108;
export const MIDDLE_C = 60;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Parse "F#4", "F♯4", "Bb3", "B♭3", "Cx5", "Ebb2" or "C8". */
export function parsePitch(text: string): Pitch {
  const m = /^([A-Ga-g])(bb|𝄫|##|x|𝄪|b|♭|#|♯)?(-?\d+)$/.exec(text.trim());
  if (!m) throw new Error(`Not a pitch: ${text}`);
  const letter = LETTERS.indexOf(m[1].toUpperCase());
  const accText = m[2] ?? "";
  const acc = { "": 0, b: -1, "♭": -1, bb: -2, "𝄫": -2, "#": 1, "♯": 1, "##": 2, x: 2, "𝄪": 2 }[accText] ?? 0;
  return { letter, acc, octave: Number(m[3]) };
}

export const midiOf = (p: Pitch) => 12 * (p.octave + 1) + NATURAL_SEMIS[p.letter] + p.acc;
/** Counts letter names: C0 = 0, D0 = 1 … C4 = 28. Staff position depends only on this. */
export const diatonicOf = (p: Pitch) => p.octave * 7 + p.letter;
export const naturalAt = (diatonic: number): Pitch => ({ letter: mod(diatonic, 7), acc: 0, octave: Math.floor(diatonic / 7) });
/** "F♯" */
export const spell = (p: Pitch) => LETTERS[p.letter] + ACC_SIGN[p.acc];
/** "F♯4" */
export const pitchName = (p: Pitch) => spell(p) + p.octave;
export const samePitch = (a: Pitch, b: Pitch) => a.letter === b.letter && a.acc === b.acc && a.octave === b.octave;

/** Plain name for a key on the piano, sharps for black keys: 61 → "C♯4". */
export function midiLabel(midi: number): string {
  const names = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  return names[mod(midi, 12)] + (Math.floor(midi / 12) - 1);
}

/** Every written spelling of one piano key using at most double accidentals, lowest letter first. */
export function enharmonicSpellings(midi: number): Pitch[] {
  const out: Pitch[] = [];
  for (let d = Math.floor(midi / 12) * 7 - 14; d <= Math.floor(midi / 12) * 7 + 7; d++) {
    const nat = naturalAt(d);
    const acc = midi - midiOf(nat);
    if (acc >= -2 && acc <= 2) out.push({ ...nat, acc });
  }
  return out;
}

// ---- Staff ----

/** Diatonic index of each clef's bottom line: E4 for treble, G2 for bass. */
export const CLEF_BOTTOM: Record<Clef, number> = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };
export const CLEF_NAME: Record<Clef, string> = { treble: "Treble", bass: "Bass" };

/** Half-steps of staff above the bottom line: 0 = bottom line, 1 = first space, 8 = top line. */
export const staffStep = (p: Pitch, clef: Clef) => diatonicOf(p) - CLEF_BOTTOM[clef];
export const isLine = (step: number) => mod(step, 2) === 0;
export const onStaff = (step: number) => step >= 0 && step <= 8;

/** Notes the reader shows: from the space below the third ledger line under the staff to the space above the third one over it. */
export const STEP_RANGE = { min: -7, max: 15 };

/** Ledger lines needed for a note at `step` (as staff steps). Empty on the staff. */
export function ledgerSteps(step: number): number[] {
  const out: number[] = [];
  for (let s = -2; s >= step; s -= 2) out.push(s);
  for (let s = 10; s <= step; s += 2) out.push(s);
  return out;
}

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

/** Plain-English staff position, e.g. "the 5th (top) line", "the 2nd ledger line below the staff". */
export function describeStep(step: number): string {
  if (onStaff(step)) {
    if (isLine(step)) {
      const n = step / 2 + 1;
      return `the ${ORDINAL[n]}${n === 1 ? " (bottom)" : n === 5 ? " (top)" : ""} line`;
    }
    return `the ${ORDINAL[(step - 1) / 2 + 1]} space`;
  }
  if (step < 0) {
    if (isLine(step)) return `the ${ORDINAL[-step / 2]} ledger line below the staff`;
    if (step === -1) return "the space just below the staff";
    return `the space below the ${ORDINAL[(-step - 1) / 2]} ledger line under the staff`;
  }
  if (isLine(step)) return `the ${ORDINAL[(step - 8) / 2]} ledger line above the staff`;
  if (step === 9) return "the space just above the staff";
  return `the space above the ${ORDINAL[(step - 9) / 2]} ledger line over the staff`;
}

// ---- Key signatures ----

export type KeySig = { id: string; count: number; major: string; minor: string };
/** `count` is the number of sharps (positive) or flats (negative). */
export const KEY_SIGS: KeySig[] = [
  { id: "c", count: 0, major: "C", minor: "A" },
  { id: "g", count: 1, major: "G", minor: "E" },
  { id: "d", count: 2, major: "D", minor: "B" },
  { id: "a", count: 3, major: "A", minor: "F♯" },
  { id: "e", count: 4, major: "E", minor: "C♯" },
  { id: "b", count: 5, major: "B", minor: "G♯" },
  { id: "f-sharp", count: 6, major: "F♯", minor: "D♯" },
  { id: "c-sharp", count: 7, major: "C♯", minor: "A♯" },
  { id: "f", count: -1, major: "F", minor: "D" },
  { id: "b-flat", count: -2, major: "B♭", minor: "G" },
  { id: "e-flat", count: -3, major: "E♭", minor: "C" },
  { id: "a-flat", count: -4, major: "A♭", minor: "F" },
  { id: "d-flat", count: -5, major: "D♭", minor: "B♭" },
  { id: "g-flat", count: -6, major: "G♭", minor: "E♭" },
  { id: "c-flat", count: -7, major: "C♭", minor: "A♭" },
];
export const keySig = (id: string) => KEY_SIGS.find(k => k.id === id) ?? KEY_SIGS[0];
export function keySigLabel(k: KeySig): string {
  if (k.count === 0) return "Natural notes (C major / A minor)";
  const n = Math.abs(k.count);
  return `${k.major} major / ${k.minor} minor (${n} ${k.count > 0 ? "sharp" : "flat"}${n > 1 ? "s" : ""})`;
}

const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F
// Treble staff steps for each accidental in the signature; the bass clef sits two steps lower.
const SHARP_STEPS = [8, 5, 9, 6, 3, 7, 4];
const FLAT_STEPS = [4, 7, 3, 6, 2, 5, 1];

/** The accidental the key signature gives a letter. */
export function keyAccidental(count: number, letter: number): number {
  if (count > 0) return SHARP_ORDER.slice(0, count).includes(letter) ? 1 : 0;
  if (count < 0) return FLAT_ORDER.slice(0, -count).includes(letter) ? -1 : 0;
  return 0;
}

/** Where to draw each accidental of the key signature on a clef. */
export function keySigGlyphs(count: number, clef: Clef): { step: number; acc: number }[] {
  const shift = clef === "bass" ? -2 : 0;
  if (count > 0) return SHARP_STEPS.slice(0, count).map(s => ({ step: s + shift, acc: 1 }));
  return FLAT_STEPS.slice(0, -count).map(s => ({ step: s + shift, acc: -1 }));
}

/** The seven answer choices for a key, A to G, each spelled with the key's accidental. */
export function keyChoices(count: number): Pitch[] {
  return [5, 6, 0, 1, 2, 3, 4].map(letter => ({ letter, acc: keyAccidental(count, letter), octave: 0 }));
}

// ---- Note-reading filters ----

export type RangeMode = "full" | "atLeast" | "atMost" | "between";
export type NoteFilters = {
  treble: boolean;
  bass: boolean;
  position: "both" | "lines" | "spaces";
  /** Notes outside the five lines (ledger-line notes and the spaces around them). */
  outside: "off" | "include" | "only";
  range: RangeMode;
  /** Natural pitch names such as "E4". `low` is used by atLeast and between, `high` by atMost and between. */
  low: string;
  high: string;
  key: string;
};

export const DEFAULT_NOTE_FILTERS: NoteFilters = { treble: true, bass: true, position: "both", outside: "off", range: "full", low: "E4", high: "F3", key: "c" };

export const RANGE_PRESETS: { id: string; label: string; set: Partial<NoteFilters> }[] = [
  { id: "full", label: "Full range", set: { range: "full" } },
  { id: "e4-up", label: "E4 and up (treble bottom line)", set: { range: "atLeast", low: "E4" } },
  { id: "f3-down", label: "F3 and down (bass 4th line)", set: { range: "atMost", high: "F3" } },
  { id: "f3-e4", label: "F3 to E4", set: { range: "between", low: "F3", high: "E4" } },
];

/** Natural notes A0 to C8, for the range pickers. */
export const RANGE_PITCHES: string[] = (() => {
  const out: string[] = [];
  for (let d = diatonicOf(parsePitch("A0")); d <= diatonicOf(parsePitch("C8")); d++) out.push(pitchName(naturalAt(d)));
  return out;
})();

export type NotePrompt = { id: string; clef: Clef; pitch: Pitch; step: number };

function rangeOk(p: Pitch, f: NoteFilters): boolean {
  const midi = midiOf(p);
  const low = midiOf(parsePitch(f.low)), high = midiOf(parsePitch(f.high));
  if (f.range === "atLeast") return midi >= low;
  if (f.range === "atMost") return midi <= high;
  if (f.range === "between") return midi >= low && midi <= high;
  return true;
}

/** Every note the filters allow, spelled with the key signature. */
export function eligibleNotes(f: NoteFilters): NotePrompt[] {
  const count = keySig(f.key).count;
  const out: NotePrompt[] = [];
  for (const clef of (["treble", "bass"] as Clef[]).filter(c => f[c])) {
    for (let step = STEP_RANGE.min; step <= STEP_RANGE.max; step++) {
      if (f.position === "lines" && !isLine(step)) continue;
      if (f.position === "spaces" && isLine(step)) continue;
      if (f.outside === "off" && !onStaff(step)) continue;
      if (f.outside === "only" && onStaff(step)) continue;
      const nat = naturalAt(CLEF_BOTTOM[clef] + step);
      const pitch = { ...nat, acc: keyAccidental(count, nat.letter) };
      const midi = midiOf(pitch);
      if (midi < LOWEST_MIDI || midi > HIGHEST_MIDI || !rangeOk(pitch, f)) continue;
      out.push({ id: `${clef}:${pitchName(pitch)}`, clef, pitch, step });
    }
  }
  return out;
}

export function rangeLabel(f: Pick<NoteFilters, "range" | "low" | "high">): string {
  if (f.range === "atLeast") return `At or above ${f.low}`;
  if (f.range === "atMost") return `At or below ${f.high}`;
  if (f.range === "between") return `Between ${f.low} and ${f.high}`;
  return "Full range (A0–C8)";
}

/** Why the filters give no notes, naming the filters that clash and what loosening each would give. Empty when notes exist. */
export function explainNoNotes(f: NoteFilters): string[] {
  if (eligibleNotes(f).length > 0) return [];
  if (!f.treble && !f.bass) return ["No clef is selected. Turn on treble, bass or both."];
  const out: string[] = [];
  if (f.range === "between" && midiOf(parsePitch(f.low)) > midiOf(parsePitch(f.high))) {
    out.push(`The range is empty: the low note ${f.low} is above the high note ${f.high}. Swap them or pick new notes.`);
  }
  const clefs = (["treble", "bass"] as Clef[]).filter(c => f[c]).map(c => CLEF_NAME[c].toLowerCase()).join(" and ");
  const parts: { label: string; loosen: Partial<NoteFilters>; fix: string; active: boolean }[] = [
    { label: `Clef: ${clefs} only`, loosen: { treble: true, bass: true }, fix: "turning on both clefs", active: !(f.treble && f.bass) },
    { label: `Staff position: ${f.position} only`, loosen: { position: "both" }, fix: "allowing lines and spaces", active: f.position !== "both" },
    { label: f.outside === "off" ? "Notes outside the staff: off" : "Notes outside the staff: only", loosen: { outside: "include" }, fix: "including notes on and off the staff", active: f.outside !== "include" },
    { label: `Pitch range: ${rangeLabel(f).replace(/^./, c => c.toLowerCase())}`, loosen: { range: "full" }, fix: "using the full range", active: f.range !== "full" },
  ];
  const active = parts.filter(p => p.active);
  out.push(`No notes match all of these together: ${active.map(p => p.label).join("; ")}.`);
  const fixes = active
    .map(p => ({ p, n: eligibleNotes({ ...f, ...p.loosen }).length }))
    .filter(x => x.n > 0)
    .map(x => `${x.p.fix} gives ${x.n} note${x.n > 1 ? "s" : ""}`);
  if (fixes.length) out.push(`Change one filter: ${fixes.join("; ")}.`);
  else out.push("Loosen more than one of these filters.");
  return out;
}

// ---- Shuffled draws ----

export type Rng = () => number;

/** A seeded generator, so the first question can render the same on the server and in the browser. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw the next prompt from a shuffled bag. Every eligible prompt comes up once before any repeats, and the same
 * prompt never comes up twice in a row when there is another to choose. Returns the item and the rest of the bag.
 */
export function drawNext<T extends { id: string }>(bag: T[], pool: T[], lastId: string | undefined, rng: Rng): { item: T; bag: T[] } | null {
  if (pool.length === 0) return null;
  const ids = new Set(pool.map(p => p.id));
  let queue = bag.filter(b => ids.has(b.id));
  if (queue.length === 0) queue = shuffle(pool, rng);
  if (queue[0].id === lastId && pool.length > 1) {
    const swap = queue.findIndex(q => q.id !== lastId);
    if (swap > 0) [queue[0], queue[swap]] = [queue[swap], queue[0]];
    else {
      // Only the last prompt is left in the bag: start a fresh bag that doesn't begin with it.
      queue = shuffle(pool, rng);
      const i = queue.findIndex(q => q.id !== lastId);
      [queue[0], queue[i]] = [queue[i], queue[0]];
    }
  }
  return { item: queue[0], bag: queue.slice(1) };
}
