// Reference-site layer on top of the music engine in music.ts.
// Everything here is pure (no React, no audio) so it can run at build time
// to generate static chord pages, key hubs and print sheets.
import { CHORDS, MAJOR_KEYS, MINOR_KEYS, diatonicChords, makeChord, pitchClass, spell, type Chord, type Mode, type Quality } from "./music.ts";

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

export type Inversion = { index: number; label: string; bass: string; names: string[]; midi: number[] };
const INVERSION_LABELS = ["Root position", "1st inversion", "2nd inversion", "3rd inversion"];

/**
 * Pure inversions of a chord: the bass note is the chord tone being inverted, with no root doubled below it.
 * Chords of up to four tones get every inversion; larger chords rotate their first four tones and keep the
 * extensions on top. MIDI numbers ascend from the bass, starting in the given octave.
 */
export function inversions(chord: Chord, baseOctave = 4): Inversion[] {
  const count = Math.min(chord.notes.length, 4);
  return Array.from({ length: count }, (_, index) => {
    const names = [...chord.notes.slice(index, count), ...chord.notes.slice(0, index), ...chord.notes.slice(count)];
    const midi: number[] = [];
    names.forEach((name, i) => {
      if (i === 0) { midi.push(12 * (baseOctave + 1) + pitchClass(name)); return; }
      let next = midi[i - 1] + 1;
      while (next % 12 !== pitchClass(name)) next++;
      midi.push(next);
    });
    return { index, label: INVERSION_LABELS[index], bass: names[0], names, midi };
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
