// Reference-site layer on top of the music engine in music.ts.
// Everything here is pure (no React, no audio) so it can run at build time
// to generate static chord pages, key hubs and print sheets.
import { CHORDS, MAJOR_KEYS, MINOR_KEYS, diatonicChords, makeChord, pitchClass, spell, type Chord, type Mode, type Quality, type ToneRole } from "./music.ts";

const byNumber = (a: number, b: number) => a - b;

// ---------------------------------------------------------------- slugs

export const QUALITY_SLUGS: Record<Quality, string> = {
  major: "major", minor: "minor", diminished: "diminished", augmented: "augmented", sus2: "sus2", sus4: "sus4", power: "power",
  maj7: "major-7", dom7: "dominant-7", min7: "minor-7", minMaj7: "minor-major-7", halfDim7: "half-diminished-7", dim7: "diminished-7",
  maj9: "major-9", min9: "minor-9", dom9: "dominant-9", maj11: "major-11", min11: "minor-11", dom11: "dominant-11",
  maj13: "major-13", min13: "minor-13", dom13: "dominant-13",
  dom7b9: "dominant-7-flat-9", dom7s9: "dominant-7-sharp-9", dom7s11: "dominant-7-sharp-11", dom7b13: "dominant-7-flat-13",
  dom7sus4: "7sus4", dom9sus4: "9sus4", six: "major-6", min6: "minor-6", six9: "six-nine", add9: "add-9",
};

/** "F♯" -> "f-sharp", "B♭" -> "b-flat", "C" -> "c". No accidental symbols in URLs. */
export function noteSlug(note: string): string {
  const accidentals = [...note.slice(1)];
  const sharps = accidentals.filter(c => c === "♯" || c === "#").length;
  const flats = accidentals.filter(c => c === "♭" || c === "b").length;
  return note[0].toLowerCase() + "-sharp".repeat(sharps) + "-flat".repeat(flats);
}

// One canonical spelling per pitch class. Minor-type chords use the sharp names people search for (C♯m, G♯m),
// everything else uses the flat names (D♭, A♭).
const MAJOR_FAMILY_ROOTS = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const MINOR_FAMILY_ROOTS = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"];

export function canonicalRoot(pitch: number, quality: Quality): string {
  return (CHORDS[quality].intervals[1] === 3 ? MINOR_FAMILY_ROOTS : MAJOR_FAMILY_ROOTS)[((pitch % 12) + 12) % 12];
}

export function chordSlug(chord: Chord): string {
  return `${noteSlug(chord.root)}-${QUALITY_SLUGS[chord.quality]}`;
}

/** Every chord page for the given qualities: 12 roots each, canonically spelled. */
export function chordPages(qualities: Quality[]): Chord[] {
  return qualities.flatMap(q => Array.from({ length: 12 }, (_, pc) => makeChord(canonicalRoot(pc, q), q)));
}

let chordLookup: Map<string, Chord> | undefined;
export function parseChordSlug(slug: string): Chord | undefined {
  if (!chordLookup) {
    chordLookup = new Map();
    for (const chord of chordPages(Object.keys(CHORDS) as Quality[])) chordLookup.set(chordSlug(chord), chord);
  }
  return chordLookup.get(slug);
}

export type KeyRef = { tonic: string; mode: Mode };
export function keySlug(key: KeyRef): string { return `${noteSlug(key.tonic)}-${key.mode}`; }
export function allKeys(): KeyRef[] {
  return [...MAJOR_KEYS.map(tonic => ({ tonic, mode: "major" as Mode })), ...MINOR_KEYS.map(tonic => ({ tonic, mode: "minor" as Mode }))];
}
export function parseKeySlug(slug: string): KeyRef | undefined { return allKeys().find(k => keySlug(k) === slug); }

// ----------------------------------------------------------- inversions

export type Inversion = { index: number; label: string; bass: string; names: string[]; roles: ToneRole[]; midi: number[] };
const INVERSION_LABELS = ["Root position", "1st inversion", "2nd inversion", "3rd inversion"];

/**
 * Pure inversions of a chord: the bass note is the chord tone being inverted, with no root doubled below it.
 * Chords of up to four tones get every inversion; larger chords rotate their first four tones and keep the
 * extensions on top. MIDI numbers ascend from the bass, starting in the given octave.
 */
export function inversions(chord: Chord, baseOctave = 4): Inversion[] {
  const count = Math.min(chord.notes.length, 4);
  return Array.from({ length: count }, (_, index) => {
    const rotate = <T,>(items: T[]) => [...items.slice(index, count), ...items.slice(0, index), ...items.slice(count)];
    const names = rotate(chord.notes);
    const roles = rotate(chord.roles);
    const midi: number[] = [];
    names.forEach((name, i) => {
      if (i === 0) { midi.push(12 * (baseOctave + 1) + pitchClass(name)); return; }
      let next = midi[i - 1] + 1;
      while (next % 12 !== pitchClass(name)) next++;
      midi.push(next);
    });
    return { index, label: INVERSION_LABELS[index], bass: names[0], names, roles, midi };
  });
}

// ------------------------------------------------- keys and related chords

export type KeyMembership = { tonic: string; mode: Mode; numeral: string; sevenths: boolean };

/** Every major and natural-minor key in which this chord is diatonic, with its Roman numeral. */
export function keysContaining(chord: Chord): KeyMembership[] {
  const found: KeyMembership[] = [];
  const pitch = pitchClass(chord.root);
  for (const key of allKeys()) {
    for (const sevenths of [false, true]) {
      for (const degree of diatonicChords(key.tonic, key.mode, sevenths)) {
        if (degree.chord.quality === chord.quality && pitchClass(degree.chord.root) === pitch) found.push({ ...key, numeral: degree.numeral, sevenths });
      }
    }
  }
  return found;
}

export type RelatedChord = { relation: string; chord: Chord };

export function relatedChords(chord: Chord): RelatedChord[] {
  const related: RelatedChord[] = [];
  const add = (relation: string, root: string, quality: Quality) => related.push({ relation, chord: makeChord(root, quality) });
  switch (chord.quality) {
    case "major":
      add("Parallel minor", chord.root, "minor");
      add("Relative minor", spell(chord.root, 6, 9), "minor");
      add("Major seventh", chord.root, "maj7");
      add("Dominant seventh", chord.root, "dom7");
      add("Suspended second", chord.root, "sus2");
      add("Suspended fourth", chord.root, "sus4");
      break;
    case "minor":
      add("Parallel major", chord.root, "major");
      add("Relative major", spell(chord.root, 3, 3), "major");
      add("Minor seventh", chord.root, "min7");
      add("Suspended second", chord.root, "sus2");
      add("Suspended fourth", chord.root, "sus4");
      break;
    case "diminished":
      add("Minor triad", chord.root, "minor");
      add("Diminished seventh", chord.root, "dim7");
      add("Half-diminished seventh", chord.root, "halfDim7");
      add("Dominant seventh containing it", spell(chord.root, 6, 8), "dom7");
      break;
    case "augmented":
      add("Major triad", chord.root, "major");
      add("Same notes", canonicalRoot(pitchClass(chord.root) + 4, "augmented"), "augmented");
      add("Same notes", canonicalRoot(pitchClass(chord.root) + 8, "augmented"), "augmented");
      break;
    case "sus2":
      add("Major triad", chord.root, "major");
      add("Minor triad", chord.root, "minor");
      add("Suspended fourth", chord.root, "sus4");
      add("Same notes", spell(chord.root, 5, 7), "sus4");
      break;
    case "sus4":
      add("Major triad", chord.root, "major");
      add("Minor triad", chord.root, "minor");
      add("Suspended second", chord.root, "sus2");
      add("Dominant seventh suspended fourth", chord.root, "dom7sus4");
      add("Same notes", spell(chord.root, 4, 5), "sus2");
      break;
    case "maj7":
      add("Major triad", chord.root, "major");
      add("Dominant seventh", chord.root, "dom7");
      add("Minor seventh", chord.root, "min7");
      break;
    case "dom7":
      add("Major triad", chord.root, "major");
      add("Major seventh", chord.root, "maj7");
      add("Minor seventh", chord.root, "min7");
      break;
    case "min7":
      add("Minor triad", chord.root, "minor");
      add("Dominant seventh", chord.root, "dom7");
      add("Major seventh", chord.root, "maj7");
      break;
  }
  return related;
}

// ------------------------------------------------------- voice leading

export type VoiceMove = { from: number; to: number; semitones: number };

/** Which notes stay and which move between two voicings, pairing voices low to high. */
export function voiceMoves(previous: number[], next: number[]) {
  const a = [...previous].sort(byNumber);
  const b = [...next].sort(byNumber);
  const length = Math.min(a.length, b.length);
  const moves: VoiceMove[] = Array.from({ length }, (_, i) => ({ from: a[i], to: b[i], semitones: b[i] - a[i] }));
  return { moves, staying: moves.filter(m => m.semitones === 0).map(m => m.to), added: b.slice(length), dropped: a.slice(length) };
}

export function movement(previous: number[], next: number[]): number {
  const { moves, added, dropped } = voiceMoves(previous, next);
  return moves.reduce((sum, m) => sum + Math.abs(m.semitones), 0) + 4 * (added.length + dropped.length);
}

export type SmoothStep = { chord: Chord; inversion: Inversion; midi: number[] };

/**
 * Picks an inversion (and octave) for each chord so the hand moves as little as possible.
 * The first chord stays in root position. Candidates stay between C3 and B5 (MIDI 48 to 83).
 */
export function smoothInversions(chords: Chord[]): SmoothStep[] {
  if (!chords.length) return [];
  const options: SmoothStep[][] = chords.map((chord, i) => {
    const all = inversions(chord);
    if (i === 0) return [{ chord, inversion: all[0], midi: all[0].midi }];
    const candidates: SmoothStep[] = [];
    for (const inversion of all) {
      for (const shift of [-12, 0, 12]) {
        const midi = inversion.midi.map(m => m + shift);
        if (Math.min(...midi) >= 48 && Math.max(...midi) <= 83) candidates.push({ chord, inversion, midi });
      }
    }
    return candidates.length ? candidates : all.map(inversion => ({ chord, inversion, midi: inversion.midi }));
  });
  const cost: number[][] = [options[0].map(() => 0)];
  const back: number[][] = [options[0].map(() => -1)];
  for (let i = 1; i < options.length; i++) {
    cost[i] = []; back[i] = [];
    options[i].forEach((option, j) => {
      let best = Infinity; let which = 0;
      options[i - 1].forEach((previous, k) => {
        const total = cost[i - 1][k] + movement(previous.midi, option.midi);
        if (total < best) { best = total; which = k; }
      });
      cost[i][j] = best; back[i][j] = which;
    });
  }
  let pick = cost[cost.length - 1].indexOf(Math.min(...cost[cost.length - 1]));
  const chosen: SmoothStep[] = new Array(options.length);
  for (let i = options.length - 1; i >= 0; i--) { chosen[i] = options[i][pick]; pick = back[i][pick]; }
  return chosen;
}

export function totalMovement(steps: { midi: number[] }[]): number {
  return steps.slice(1).reduce((sum, step, i) => sum + movement(steps[i].midi, step.midi), 0);
}

// ------------------------------------------------------------ page helpers

/** Qualities that get a chord page at launch. Everything else stays unpublished until it has unique content. */
export const LAUNCH_QUALITIES: Quality[] = ["major", "minor", "diminished", "augmented", "sus2", "sus4"];
export function isLaunchChord(chord: Chord): boolean { return LAUNCH_QUALITIES.includes(chord.quality); }

/** The canonically spelled chord that owns the page for this chord (A♯ major -> B♭ major). */
export function pageChordFor(chord: Chord): Chord {
  return makeChord(canonicalRoot(pitchClass(chord.root), chord.quality), chord.quality);
}

const ALIAS_ROOTS: Record<string, string> = { "D♭": "C♯", "C♯": "D♭", "E♭": "D♯", "F♯": "G♭", "A♭": "G♯", "G♯": "A♭", "B♭": "A♯" };
/** Other common name for the same chord, e.g. D♭ major -> "C♯ major". Undefined for natural roots. */
export function enharmonicAlias(chord: Chord): string | undefined {
  const alt = ALIAS_ROOTS[chord.root];
  return alt ? `${alt}${CHORDS[chord.quality].suffix}` : undefined;
}

/** Plain-text description of a chord voicing for alt text and screen readers. */
export function chordAltText(chord: Chord, inversion: Inversion): string {
  return `${chord.fullName}, ${inversion.label.toLowerCase()}: ${inversion.names.join(", ")} (lowest note ${inversion.bass}) on a piano keyboard`;
}

/** Other ways the chord symbol is written, e.g. C, CM, Cmaj. The first entry is the site's own symbol. */
const SYMBOL_SUFFIXES: Partial<Record<Quality, string[]>> = {
  major: ["", "M", "maj"], minor: ["m", "min", "−"], diminished: ["dim", "°", "m♭5"], augmented: ["+", "aug", "(♯5)"],
  sus2: ["sus2", "2"], sus4: ["sus4", "sus"],
};
export function symbolAliases(chord: Chord): string[] {
  return (SYMBOL_SUFFIXES[chord.quality] ?? [CHORDS[chord.quality].suffix]).map(s => chord.root + s);
}

/** The interval between two stacked chord tones, by size in semitones. */
export const STEP_NAMES: Record<number, string> = { 1: "minor second", 2: "major second", 3: "minor third", 4: "major third", 5: "perfect fourth", 6: "tritone", 7: "perfect fifth" };

/** Plain key name for theory spellings that land on another key: B♭♭ -> A, E♯ -> F, F♯♯ -> G. Undefined when the name is already plain. */
export function keyboardName(note: string): string | undefined {
  const plain = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"][pitchClass(note)];
  const alt = { "C♯": "D♭", "E♭": "D♯", "F♯": "G♭", "A♭": "G♯", "B♭": "A♯" }[plain];
  return note === plain || note === alt ? undefined : plain;
}

export type ScaleFit = { tonic: string; mode: Mode; numeral: string };
const DEGREE_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/**
 * Keys whose scale contains every note of the chord, with the chord named from the scale degree of its root
 * (Csus4 is IVsus4 in G major). Used for chords that are not one of a key's seven standard triads.
 */
export function keysWithAllNotes(chord: Chord): ScaleFit[] {
  const pitches = chord.notes.map(pitchClass);
  return allKeys().flatMap(key => {
    const scale = diatonicChords(key.tonic, key.mode).map(d => pitchClass(d.chord.root));
    if (!pitches.every(p => scale.includes(p))) return [];
    return [{ ...key, numeral: DEGREE_NUMERALS[scale.indexOf(pitches[0])] + CHORDS[chord.quality].suffix }];
  });
}

/** The harmonic minor key in which an augmented triad is the III+ chord (C+ is III+ in A harmonic minor). */
export function harmonicMinorHome(chord: Chord): string {
  return MINOR_KEYS.find(k => pitchClass(k) === (pitchClass(chord.root) + 9) % 12)!;
}
