// Roman-numeral progressions as data. Chords, keys and voice leading are computed from the music engine.
import { MAJOR_KEYS, MINOR_KEYS, diatonicChords, keyInfo, makeChord, pitchClass, type Chord, type Mode, type Quality } from "./music.ts";
import { inversions, keySlug, parseKeySlug, seventhNumeral, smoothInversions, voiceMoves, type Inversion } from "./reference.ts";

export type Style = "pop" | "jazz" | "blues";
export const STYLES: { id: Style; label: string; blurb: string }[] = [
  { id: "pop", label: "Pop and rock", blurb: "The four-chord loops behind most pop, rock and folk songs." },
  { id: "jazz", label: "Jazz", blurb: "Seventh-chord progressions built on the ii–V–I." },
  { id: "blues", label: "Blues", blurb: "12-bar forms built on dominant seventh chords." },
];

export type Progression = {
  slug: string;
  name: string;
  mode: Mode;
  style: Style;
  /** Scale degree of each chord's root, 1 to 7. */
  degrees: number[];
  /** Chord quality of each step. */
  qualities: Quality[];
  numerals: string[];
  /** Beats each chord lasts when played back: 2 for loops, 4 for one chord per bar. */
  beats: number;
  /** Shown as rows of this many chords (4 for 12-bar forms). */
  barsPerRow?: number;
  about?: string;
};
export type InversionMode = "root" | "first" | "second" | "smooth";
export type StripStep = { chord: Chord; inversion: Inversion; midi: number[] };

/** A step is a scale degree, optionally with its own quality and numeral (for chords outside the key). */
type StepDef = number | [degree: number, quality: Quality, numeral: string];
type Definition = { mode: Mode; style: Style; steps: StepDef[]; sevenths?: boolean; slug?: string; name?: string; beats?: number; barsPerRow?: number; about?: string };

const BLUES_ABOUT = "Every chord is a dominant seventh, so the flat seventh of each chord (the blue note) sits outside the major scale. That clash is the sound of the blues.";
const DEFINITIONS: Definition[] = [
  { mode: "major", style: "pop", steps: [1, 5, 6, 4] },
  { mode: "major", style: "pop", steps: [1, 6, 4, 5] },
  { mode: "major", style: "jazz", steps: [2, 5, 1], sevenths: true, name: "ii-V-I", slug: "ii-v-i", about: "The most common progression in jazz. The seventh of each chord moves down a half step into the next chord, which pulls the ear toward the I chord." },
  { mode: "major", style: "pop", steps: [1, 4, 5] },
  { mode: "major", style: "pop", steps: [6, 4, 1, 5] },
  { mode: "minor", style: "pop", steps: [1, 6, 3, 7] },
  { mode: "minor", style: "jazz", slug: "minor-ii-v-i", name: "Minor ii-V-i", steps: [[2, "halfDim7", "iiø7"], [5, "dom7", "V7"], [1, "min7", "i7"]], about: "The minor-key ii–V–i. The V7 takes its major third from the harmonic minor scale, a half step below the tonic, so it resolves strongly to i." },
  { mode: "major", style: "jazz", steps: [1, 6, 2, 5], sevenths: true, name: "I-vi-ii-V", slug: "i-vi-ii-v", about: "The classic turnaround. It cycles back to I, so it loops at the end of a section or behind a whole tune." },
  { mode: "major", style: "jazz", steps: [3, 6, 2, 5], sevenths: true, name: "iii-vi-ii-V", slug: "iii-vi-ii-v", about: "A longer turnaround: each root falls a fifth to the next, iii to vi to ii to V, before resolving to I." },
  { mode: "major", style: "blues", slug: "12-bar-blues", name: "12-bar blues", beats: 4, barsPerRow: 4, about: BLUES_ABOUT,
    steps: [[1, "dom7", "I7"], [1, "dom7", "I7"], [1, "dom7", "I7"], [1, "dom7", "I7"], [4, "dom7", "IV7"], [4, "dom7", "IV7"], [1, "dom7", "I7"], [1, "dom7", "I7"], [5, "dom7", "V7"], [4, "dom7", "IV7"], [1, "dom7", "I7"], [5, "dom7", "V7"]] },
  { mode: "major", style: "blues", slug: "quick-change-blues", name: "Quick-change blues", beats: 4, barsPerRow: 4, about: `The 12-bar blues with the IV7 moved into bar 2, so the change comes sooner. ${BLUES_ABOUT}`,
    steps: [[1, "dom7", "I7"], [4, "dom7", "IV7"], [1, "dom7", "I7"], [1, "dom7", "I7"], [4, "dom7", "IV7"], [4, "dom7", "IV7"], [1, "dom7", "I7"], [1, "dom7", "I7"], [5, "dom7", "V7"], [4, "dom7", "IV7"], [1, "dom7", "I7"], [5, "dom7", "V7"]] },
  { mode: "minor", style: "blues", slug: "minor-blues", name: "Minor blues", beats: 4, barsPerRow: 4, about: "A 12-bar blues on minor seventh chords. In bar 9 the VI7 falls a half step to the V7, whose major third comes from the harmonic minor scale.",
    steps: [[1, "min7", "i7"], [1, "min7", "i7"], [1, "min7", "i7"], [1, "min7", "i7"], [4, "min7", "iv7"], [4, "min7", "iv7"], [1, "min7", "i7"], [1, "min7", "i7"], [6, "dom7", "VI7"], [5, "dom7", "V7"], [1, "min7", "i7"], [5, "dom7", "V7"]] },
];

export const defaultTonic = (mode: Mode): string => (mode === "major" ? "C" : "A");
export const keysFor = (progression: Progression): string[] => (progression.mode === "major" ? MAJOR_KEYS : MINOR_KEYS);

export const PROGRESSIONS: Progression[] = DEFINITIONS.map(def => {
  const diatonic = diatonicChords(defaultTonic(def.mode), def.mode, def.sevenths ?? false);
  const steps = def.steps.map(step => {
    if (typeof step !== "number") return { degree: step[0], quality: step[1], numeral: step[2] };
    const { numeral, chord } = diatonic[step - 1];
    return { degree: step, quality: chord.quality, numeral: def.sevenths ? seventhNumeral(numeral, chord.quality) : numeral };
  });
  const triadName = def.steps.map(s => diatonicChords("C", def.mode)[(typeof s === "number" ? s : s[0]) - 1].numeral).join("-");
  const name = def.name ?? triadName;
  return {
    slug: def.slug ?? name.toLowerCase(), name, mode: def.mode, style: def.style,
    degrees: steps.map(s => s.degree), qualities: steps.map(s => s.quality), numerals: steps.map(s => s.numeral),
    beats: def.beats ?? 2, barsPerRow: def.barsPerRow, about: def.about,
  };
});

export function getProgression(slug: string): Progression | undefined { return PROGRESSIONS.find(p => p.slug === slug); }

/** The progression as actual chords in a key. */
export function progressionChords(progression: Progression, tonic: string): Chord[] {
  const scale = keyInfo(tonic, progression.mode).notes;
  return progression.degrees.map((d, i) => makeChord(scale[d - 1], progression.qualities[i]));
}

/** Link to a progression page, opened in a given key (?key=g-major). The canonical URL stays the bare page. */
export function progressionHref(progression: Progression, tonic?: string): string {
  const base = `/progressions/${progression.slug}/`;
  return tonic && tonic !== defaultTonic(progression.mode) ? `${base}?key=${keySlug({ tonic, mode: progression.mode })}` : base;
}

/** The key a progression page should open in, from its ?key= parameter, if it is one of the progression's keys. */
export function tonicFromQuery(progression: Progression, search: string): string | undefined {
  const key = parseKeySlug(new URLSearchParams(search).get("key") ?? "");
  return key && key.mode === progression.mode && keysFor(progression).includes(key.tonic) ? key.tonic : undefined;
}

export type ProgressionUse = { progression: Progression; uses: { tonic: string; numeral: string }[] };

/** Every progression that contains this chord (same sound and type), with each key it appears in and its numeral there. */
export function progressionsWithChord(chord: Chord): ProgressionUse[] {
  const pitch = pitchClass(chord.root);
  return PROGRESSIONS.flatMap(progression => {
    const uses = keysFor(progression).flatMap(tonic => {
      const at = progressionChords(progression, tonic).findIndex(c => c.quality === chord.quality && pitchClass(c.root) === pitch);
      return at < 0 ? [] : [{ tonic, numeral: progression.numerals[at] }];
    });
    return uses.length ? [{ progression, uses }] : [];
  });
}

/** Each distinct numeral once, in order of first appearance, with its index in the progression. */
export function distinctSteps(progression: Progression): { numeral: string; index: number }[] {
  const seen = new Set<string>();
  return progression.numerals.flatMap((numeral, index) => (seen.has(numeral) ? [] : (seen.add(numeral), [{ numeral, index }])));
}

/** Chord tones that are not in the key's major or natural minor scale, e.g. B♭ in C7 in C major. */
export function outsideNotes(chord: Chord, tonic: string, mode: Mode): string[] {
  const scale = new Set(keyInfo(tonic, mode).notes.map(pitchClass));
  return chord.notes.filter(n => !scale.has(pitchClass(n)));
}

/** True when every chord is the key's own triad, or every chord its own seventh chord, so the builder can reproduce it. */
export function builderChordType(progression: Progression): "triads" | "sevenths" | undefined {
  for (const sevenths of [false, true]) {
    const diatonic = diatonicChords(defaultTonic(progression.mode), progression.mode, sevenths);
    if (progression.degrees.every((d, i) => diatonic[d - 1].chord.quality === progression.qualities[i])) return sevenths ? "sevenths" : "triads";
  }
  return undefined;
}

/** Pick an inversion for every chord: fixed position for all, or the smoothest path through the progression. */
export function stripSteps(chords: Chord[], mode: InversionMode): StripStep[] {
  if (mode === "smooth") return smoothInversions(chords);
  const index = { root: 0, first: 1, second: 2 }[mode];
  return chords.map(chord => {
    const all = inversions(chord);
    const inversion = all[Math.min(index, all.length - 1)];
    return { chord, inversion, midi: inversion.midi };
  });
}

/** Which notes stay and which move between two steps, e.g. "C moves down 1 semitone to B; E moves down 2 semitones to D; G stays". */
export function voiceLeadingText(from: StripStep, to: StripStep): string {
  const { moves, added, dropped } = voiceMoves(from.midi, to.midi);
  if (!added.length && !dropped.length && moves.every(m => m.semitones === 0)) return "same chord, nothing moves";
  const text = moves.map((move, i) => {
    if (move.semitones === 0) return `${to.inversion.names[i]} stays`;
    const amount = Math.abs(move.semitones);
    return `${from.inversion.names[i]} moves ${move.semitones < 0 ? "down" : "up"} ${amount} semitone${amount === 1 ? "" : "s"} to ${to.inversion.names[i]}`;
  });
  if (added.length) text.push(`add ${to.inversion.names.slice(moves.length).join(", ")}`);
  if (dropped.length) text.push(`drop ${from.inversion.names.slice(moves.length).join(", ")}`);
  return text.join("; ");
}
