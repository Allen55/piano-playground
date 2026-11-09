// Roman-numeral progressions as data. Chords, keys and voice leading are computed from the music engine.
import { MAJOR_KEYS, MINOR_KEYS, diatonicChords, type Chord, type Mode } from "./music.ts";
import { inversions, smoothInversions, voiceMoves, type Inversion } from "./reference.ts";

export type Progression = { slug: string; name: string; mode: Mode; degrees: number[]; numerals: string[] };
export type InversionMode = "root" | "first" | "second" | "smooth";
export type StripStep = { chord: Chord; inversion: Inversion; midi: number[] };

const DEFINITIONS: [Mode, number[]][] = [
  ["major", [1, 5, 6, 4]], ["major", [1, 6, 4, 5]], ["major", [2, 5, 1]], ["major", [1, 4, 5]], ["major", [6, 4, 1, 5]], ["minor", [1, 6, 3, 7]],
];

export const defaultTonic = (mode: Mode): string => (mode === "major" ? "C" : "A");
export const keysFor = (progression: Progression): string[] => (progression.mode === "major" ? MAJOR_KEYS : MINOR_KEYS);

export const PROGRESSIONS: Progression[] = DEFINITIONS.map(([mode, degrees]) => {
  const numerals = degrees.map(d => diatonicChords(defaultTonic(mode), mode, false)[d - 1].numeral);
  const name = numerals.join("-");
  return { slug: name.toLowerCase(), name, mode, degrees, numerals };
});

export function getProgression(slug: string): Progression | undefined { return PROGRESSIONS.find(p => p.slug === slug); }

/** The progression as actual chords in a key. */
export function progressionChords(progression: Progression, tonic: string): Chord[] {
  const chords = diatonicChords(tonic, progression.mode, false);
  return progression.degrees.map(d => chords[d - 1].chord);
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
  const { moves } = voiceMoves(from.midi, to.midi);
  return moves.map((move, i) => {
    if (move.semitones === 0) return `${to.inversion.names[i]} stays`;
    const amount = Math.abs(move.semitones);
    return `${from.inversion.names[i]} moves ${move.semitones < 0 ? "down" : "up"} ${amount} semitone${amount === 1 ? "" : "s"} to ${to.inversion.names[i]}`;
  }).join("; ");
}
