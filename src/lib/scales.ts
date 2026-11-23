// Scale and mode catalog for the /scales/ reference pages. Pure data and spelling: no React, no DOM, no audio.
// Each scale is defined by its formula ("1 2 ♭3 4 5 6 ♭7"): the number picks the letter, the accidental is relative
// to the major scale. Spelling therefore follows the formula, so C blues is C E♭ F G♭ G B♭ and a letter may repeat.
import { makeChord, pitchClass, spell, type Chord, type Quality } from "./music.ts";
import { noteSlug } from "./reference.ts";
import type { Pitch } from "./notation.ts";

export type ScaleFamily = "modes" | "minor" | "pentatonic" | "jazz" | "harmonic" | "symmetric" | "world";

export const FAMILIES: { id: ScaleFamily; name: string; blurb: string }[] = [
  { id: "modes", name: "Major scale and its modes", blurb: "The seven modes of the major scale. Each starts on a different note of the same scale, so each has its own mood." },
  { id: "minor", name: "Minor scales", blurb: "The three minor scales every pianist learns: natural, harmonic and melodic." },
  { id: "pentatonic", name: "Pentatonic and blues", blurb: "Five- and six-note scales behind blues, rock, pop, folk and gospel improvising." },
  { id: "jazz", name: "Jazz scales", blurb: "Modes of the melodic minor and the bebop scales: the sounds of jazz improvisation over seventh chords." },
  { id: "harmonic", name: "Harmonic minor and major modes", blurb: "Modes with an augmented second, from Spanish flamenco to film-score tension." },
  { id: "symmetric", name: "Symmetric scales", blurb: "Scales built from a repeating pattern, so they repeat in several keys at once." },
  { id: "world", name: "World and exotic scales", blurb: "Scales from Hungarian, Middle Eastern, Japanese and Romani music, and other distinctive colors." },
];

type ScaleDef = {
  id: string;
  name: string;
  family: ScaleFamily;
  formula: string;
  aka?: string[];
  /** One or two sentences: what it sounds like and where it is used. */
  about: string;
  /** For modes: which scale and degree it comes from, e.g. ["major", 2] for Dorian. */
  modeOf?: [string, number];
};

const DEFS: ScaleDef[] = [
  // Major modes
  { id: "major", name: "Major", family: "modes", formula: "1 2 3 4 5 6 7", aka: ["Ionian"], modeOf: ["major", 1], about: "The bright, settled scale most Western music is built on. Every key signature is written from it." },
  { id: "dorian", name: "Dorian", family: "modes", formula: "1 2 ♭3 4 5 6 ♭7", modeOf: ["major", 2], about: "A minor scale with a raised sixth, warmer and less gloomy than natural minor. Common in jazz, funk, folk and rock (“So What”, “Oye Como Va”)." },
  { id: "phrygian", name: "Phrygian", family: "modes", formula: "1 ♭2 ♭3 4 5 ♭6 ♭7", modeOf: ["major", 3], about: "A dark minor scale whose flat second gives a Spanish, metal or film-score edge." },
  { id: "lydian", name: "Lydian", family: "modes", formula: "1 2 3 ♯4 5 6 7", modeOf: ["major", 4], about: "A major scale with a raised fourth. Dreamy and floating, a favorite of film composers and jazz players over maj7♯11 chords." },
  { id: "mixolydian", name: "Mixolydian", family: "modes", formula: "1 2 3 4 5 6 ♭7", modeOf: ["major", 5], about: "A major scale with a flat seventh: the sound of the dominant seventh chord, rock riffs, blues and Celtic tunes." },
  { id: "aeolian", name: "Aeolian", family: "modes", formula: "1 2 ♭3 4 5 ♭6 ♭7", aka: ["Natural minor"], modeOf: ["major", 6], about: "The sixth mode of the major scale, the same notes as the natural minor scale. Sad and serious." },
  { id: "locrian", name: "Locrian", family: "modes", formula: "1 ♭2 ♭3 4 ♭5 ♭6 ♭7", modeOf: ["major", 7], about: "The darkest mode, with a diminished fifth above the root. Used over half-diminished (m7♭5) chords." },
  // Minor
  { id: "natural-minor", name: "Natural minor", family: "minor", formula: "1 2 ♭3 4 5 ♭6 ♭7", aka: ["Aeolian"], modeOf: ["major", 6], about: "The minor scale that shares its key signature with the relative major. The basis of every minor key." },
  { id: "harmonic-minor", name: "Harmonic minor", family: "minor", formula: "1 2 ♭3 4 5 ♭6 7", about: "Natural minor with a raised seventh, which gives a strong leading tone and a major V chord. The gap between ♭6 and 7 gives its exotic sound." },
  { id: "melodic-minor", name: "Melodic minor", family: "minor", formula: "1 2 ♭3 4 5 6 7", aka: ["Jazz minor"], about: "Minor with a raised sixth and seventh. Classical music uses it going up and natural minor coming down; jazz uses it both ways." },
  // Pentatonic and blues
  { id: "major-pentatonic", name: "Major pentatonic", family: "pentatonic", formula: "1 2 3 5 6", about: "Five notes with no half steps, so nothing clashes. Heard in folk songs, country, gospel and pop melodies." },
  { id: "minor-pentatonic", name: "Minor pentatonic", family: "pentatonic", formula: "1 ♭3 4 5 ♭7", about: "The first scale most rock and blues players improvise with. Same notes as the relative major pentatonic." },
  { id: "blues", name: "Blues", family: "pentatonic", formula: "1 ♭3 4 ♭5 5 ♭7", aka: ["Minor blues"], about: "Minor pentatonic plus the ♭5 “blue note”. Slide through the ♭5 between 4 and 5 for the classic blues sound." },
  { id: "major-blues", name: "Major blues", family: "pentatonic", formula: "1 2 ♭3 3 5 6", about: "Major pentatonic plus a ♭3 that bends up to the major third. Sweet and bluesy, common in country, gospel and boogie-woogie." },
  { id: "egyptian", name: "Egyptian pentatonic", family: "pentatonic", formula: "1 2 4 5 ♭7", aka: ["Suspended pentatonic"], about: "A pentatonic scale with no third, so it is neither major nor minor. Open and modal." },
  // Jazz
  { id: "dorian-flat-2", name: "Dorian ♭2", family: "jazz", formula: "1 ♭2 ♭3 4 5 6 ♭7", aka: ["Phrygian ♮6"], modeOf: ["melodic-minor", 2], about: "The second mode of melodic minor. Used over sus♭9 chords." },
  { id: "lydian-augmented", name: "Lydian augmented", family: "jazz", formula: "1 2 3 ♯4 ♯5 6 7", modeOf: ["melodic-minor", 3], about: "The third mode of melodic minor: Lydian with a raised fifth, for maj7♯5 chords." },
  { id: "lydian-dominant", name: "Lydian dominant", family: "jazz", formula: "1 2 3 ♯4 5 6 ♭7", aka: ["Overtone scale", "Acoustic scale"], modeOf: ["melodic-minor", 4], about: "Mixolydian with a raised fourth, the scale for 7♯11 chords. Sounds bright with a twist; think of The Simpsons theme." },
  { id: "mixolydian-flat-6", name: "Mixolydian ♭6", family: "jazz", formula: "1 2 3 4 5 ♭6 ♭7", aka: ["Aeolian dominant", "Hindu scale"], modeOf: ["melodic-minor", 5], about: "The fifth mode of melodic minor: a major third with minor-key sixth and seventh. Bittersweet." },
  { id: "locrian-natural-2", name: "Locrian ♮2", family: "jazz", formula: "1 2 ♭3 4 ♭5 ♭6 ♭7", aka: ["Half-diminished scale"], modeOf: ["melodic-minor", 6], about: "Locrian with a natural second. The usual jazz choice over m7♭5 chords." },
  { id: "altered", name: "Altered", family: "jazz", formula: "1 ♭2 ♭3 3 ♭5 ♭6 ♭7", aka: ["Super Locrian", "Diminished whole tone"], modeOf: ["melodic-minor", 7], about: "The seventh mode of melodic minor. Every tension a dominant chord can take (♭9, ♯9 written here as ♭3, ♯11 as ♭5, and ♭13), for V7alt chords resolving to I." },
  { id: "bebop-dominant", name: "Bebop dominant", family: "jazz", formula: "1 2 3 4 5 6 ♭7 7", about: "Mixolydian with an added major seventh as a passing note, so eighth-note lines land chord tones on the beat." },
  { id: "bebop-major", name: "Bebop major", family: "jazz", formula: "1 2 3 4 5 ♯5 6 7", about: "The major scale with an added ♯5 passing note. Lines starting on a chord tone keep chord tones on the downbeats." },
  { id: "bebop-dorian", name: "Bebop Dorian", family: "jazz", formula: "1 2 ♭3 3 4 5 6 ♭7", aka: ["Bebop minor"], about: "Dorian with an added major third as a passing note, for minor seventh chords." },
  // Harmonic minor and major modes
  { id: "phrygian-dominant", name: "Phrygian dominant", family: "harmonic", formula: "1 ♭2 3 4 5 ♭6 ♭7", aka: ["Spanish Phrygian", "Freygish"], modeOf: ["harmonic-minor", 5], about: "The fifth mode of harmonic minor. Flamenco, klezmer and Middle Eastern music, and the V7 chord in a minor key." },
  { id: "dorian-sharp-4", name: "Dorian ♯4", family: "harmonic", formula: "1 2 ♭3 ♯4 5 6 ♭7", aka: ["Ukrainian Dorian", "Romanian minor"], modeOf: ["harmonic-minor", 4], about: "Dorian with a raised fourth. Heard in Eastern European folk and klezmer music." },
  { id: "lydian-sharp-2", name: "Lydian ♯2", family: "harmonic", formula: "1 ♯2 3 ♯4 5 6 7", modeOf: ["harmonic-minor", 6], about: "The sixth mode of harmonic minor. Bright but strange, with an augmented second at the bottom." },
  { id: "harmonic-major", name: "Harmonic major", family: "harmonic", formula: "1 2 3 4 5 ♭6 7", about: "The major scale with a flat sixth. Lets a major key borrow the minor iv chord." },
  // Symmetric
  { id: "whole-tone", name: "Whole tone", family: "symmetric", formula: "1 2 3 ♯4 ♯5 ♭7", about: "Six notes, all a whole step apart. No pull toward any note, so it sounds dreamlike. There are only two different whole-tone scales." },
  { id: "diminished-half-whole", name: "Half-whole diminished", family: "symmetric", formula: "1 ♭2 ♭3 3 ♯4 5 6 ♭7", aka: ["Dominant diminished", "Octatonic"], about: "Alternating half and whole steps, starting with a half step. Used over 7♭9 chords. It repeats every minor third." },
  { id: "diminished-whole-half", name: "Whole-half diminished", family: "symmetric", formula: "1 2 ♭3 4 ♭5 ♭6 6 7", aka: ["Diminished", "Octatonic"], about: "Alternating whole and half steps, starting with a whole step. Used over diminished seventh chords." },
  { id: "augmented", name: "Augmented", family: "symmetric", formula: "1 ♯2 3 5 ♯5 7", about: "Alternating minor thirds and half steps: two augmented triads a minor third apart." },
  { id: "chromatic", name: "Chromatic", family: "symmetric", formula: "1 ♯1 2 ♯2 3 4 ♯4 5 ♯5 6 ♯6 7", about: "All twelve notes, each a half step apart. Practise it with the standard fingering: 3 on black keys, 1 on white keys, 2 on the E–F and B–C pairs." },
  // World and exotic
  { id: "hungarian-minor", name: "Hungarian minor", family: "world", formula: "1 2 ♭3 ♯4 5 ♭6 7", aka: ["Gypsy minor", "Double harmonic minor"], about: "Harmonic minor with a raised fourth: two augmented seconds give a dramatic, Romani sound." },
  { id: "double-harmonic", name: "Double harmonic major", family: "world", formula: "1 ♭2 3 4 5 ♭6 7", aka: ["Byzantine", "Arabic"], about: "Two augmented seconds, one on each side of the scale. The classic “Middle Eastern” sound in Western music." },
  { id: "neapolitan-minor", name: "Neapolitan minor", family: "world", formula: "1 ♭2 ♭3 4 5 ♭6 7", about: "Harmonic minor with a flat second. Dark and operatic." },
  { id: "neapolitan-major", name: "Neapolitan major", family: "world", formula: "1 ♭2 ♭3 4 5 6 7", about: "Melodic minor with a flat second. Bright at the top, dark at the bottom." },
  { id: "persian", name: "Persian", family: "world", formula: "1 ♭2 3 4 ♭5 ♭6 7", about: "Double harmonic with a flat fifth: very tense and colorful." },
  { id: "enigmatic", name: "Enigmatic", family: "world", formula: "1 ♭2 3 ♯4 ♯5 ♯6 7", about: "An unusual scale written by Verdi, with whole steps rising toward the leading tone." },
  { id: "hirajoshi", name: "Hirajōshi", family: "world", formula: "1 2 ♭3 5 ♭6", about: "A Japanese pentatonic scale tuned for the koto. Delicate and melancholy." },
  { id: "in-sen", name: "In sen", family: "world", formula: "1 ♭2 4 5 ♭7", about: "A Japanese pentatonic scale with a flat second, spare and haunting." },
  { id: "iwato", name: "Iwato", family: "world", formula: "1 ♭2 4 ♭5 ♭7", about: "A Japanese pentatonic scale with a flat second and flat fifth, the darkest of the three." },
];

export type ScaleStep = { degree: number; acc: number; label: string; semitones: number };
export type ScaleInfo = ScaleDef & { steps: ScaleStep[] };

const MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11];

function parseFormula(formula: string): ScaleStep[] {
  return formula.split(" ").map(label => {
    const acc = [...label].reduce((v, c) => v + (c === "♯" ? 1 : c === "♭" ? -1 : 0), 0);
    const degree = Number(label.replace(/[♯♭]/g, ""));
    return { degree, acc, label, semitones: MAJOR_SEMIS[degree - 1] + acc };
  });
}

export const SCALES: ScaleInfo[] = DEFS.map(d => ({ ...d, steps: parseFormula(d.formula) }));
export const scaleById = (id: string) => SCALES.find(s => s.id === id);

/** Notes spelled strictly from the formula, double accidentals included. */
function formulaSpelling(tonic: string, scale: ScaleInfo): string[] {
  return scale.steps.map(s => spell(tonic, s.degree, s.semitones));
}

const accidentalCount = (note: string) => [...note.slice(1)].length;
const ODD_NAMES = ["E♯", "B♯", "C♭", "F♭"];

/**
 * Notes of the scale from `tonic`, one octave (no repeated top note), spelled from the formula. A double accidental
 * the tonic choice could not avoid is written as the plain key instead (B altered: B C D D♯ E♯ G A, not C𝄪 and F𝄪).
 */
export function scaleSpelling(tonic: string, scale: ScaleInfo): string[] {
  // Seven-note scales keep one letter per note (F♯ major has E♯). Others already repeat or skip letters,
  // so E♯, B♯, C♭ and F♭ are written as the plain key too (B♭ blues: B♭ D♭ E♭ E F A♭).
  const plain = scale.steps.length !== 7;
  return formulaSpelling(tonic, scale).map((n, i) => {
    if (i === 0 || (accidentalCount(n) < 2 && !(plain && ODD_NAMES.includes(n)))) return n;
    return (n.includes("♯") ? SHARP_NAMES : FLAT_NAMES)[pitchClass(n)];
  });
}

/** How awkward a spelling is: accidentals count once, double accidentals and E♯/B♯/C♭/F♭ count extra. */
export function spellingCost(notes: string[]): number {
  return notes.reduce((sum, n) => {
    const count = accidentalCount(n);
    const odd = ODD_NAMES.includes(n) ? 0.5 : 0;
    return sum + count + (count > 1 ? 4 : 0) + odd;
  }, 0);
}

const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
/** Tie-break order for black-key tonics: the names used for the site's keys. */
const PREFERRED = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

/** The tonic spelling that gives the cleanest scale on this pitch class (C♯ for minor, D♭ for major). */
export function canonicalTonic(pitch: number, scale: ScaleInfo): string {
  const pc = ((pitch % 12) + 12) % 12;
  const options = [...new Set([SHARP_NAMES[pc], FLAT_NAMES[pc]])];
  if (options.length === 1) return options[0];
  const cost = (t: string) => spellingCost(formulaSpelling(t, scale)) + (t === PREFERRED[pc] ? 0 : 0.25);
  return options.reduce((best, t) => (cost(t) < cost(best) ? t : best));
}

/** The other spelling of a black-key tonic, if its scale is reasonable to read (no double accidentals). */
export function alternateTonic(tonic: string, scale: ScaleInfo): string | undefined {
  const pc = pitchClass(tonic);
  const other = [SHARP_NAMES[pc], FLAT_NAMES[pc]].find(t => t !== tonic);
  if (!other) return undefined;
  return formulaSpelling(other, scale).every(n => accidentalCount(n) <= 1) ? other : undefined;
}

// ------------------------------------------------------------------ pages

export type ScalePage = { tonic: string; scale: ScaleInfo };
export const scaleSlug = (p: ScalePage) => `${noteSlug(p.tonic)}-${p.scale.id}`;
export const scaleTitle = (p: ScalePage) => `${p.tonic} ${p.scale.name}`;
export const scaleHref = (p: ScalePage) => `/scales/${scaleSlug(p)}/`;

/** "Natural minor" is the same as Aeolian; its page is kept, but Aeolian pages point to it as the canonical URL. */
export const CANONICAL_ALIAS: Record<string, string> = { aeolian: "natural-minor" };

/** Every scale page: each scale on all 12 tonics, canonically spelled. */
export function scalePages(): ScalePage[] {
  return SCALES.flatMap(scale => Array.from({ length: 12 }, (_, pc) => ({ tonic: canonicalTonic(pc, scale), scale })));
}

let lookup: Map<string, ScalePage> | undefined;
export function parseScaleSlug(slug: string): ScalePage | undefined {
  if (!lookup) lookup = new Map(scalePages().map(p => [scaleSlug(p), p]));
  return lookup.get(slug);
}

/** The page for this scale on any spelling of a tonic (A♯ major -> B♭ major). */
export function scalePageFor(tonic: string, scaleId: string): ScalePage {
  const scale = scaleById(scaleId)!;
  return { tonic: canonicalTonic(pitchClass(tonic), scale), scale };
}

// ----------------------------------------------------------- staff and keys

const LETTER_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

export function notePitch(name: string, octave: number): Pitch {
  const acc = [...name.slice(1)].reduce((v, c) => v + (c === "♯" ? 1 : c === "♭" ? -1 : 0), 0);
  return { letter: LETTER_INDEX[name[0]], acc, octave };
}

/** Lowest-octave start for the staff: tonics C–F begin in octave 4, G–B in octave 3 when that keeps the top lower. */
export function scaleOctave(tonic: string): number { return LETTER_INDEX[tonic[0]] >= 4 ? 3 : 4; }

/**
 * Written pitches for one ascending octave, tonic to tonic. Each note goes on the first line or space at or above the
 * previous note that carries its letter; octave numbers follow the letter (B♯3 is the key above B3).
 */
export function scalePitches(tonic: string, scale: ScaleInfo, startOctave = scaleOctave(tonic)): Pitch[] {
  let diatonic = startOctave * 7 + LETTER_INDEX[tonic[0]];
  const names = scaleSpelling(tonic, scale);
  const pitches = names.map((name, i) => {
    if (i > 0) while (diatonic % 7 !== LETTER_INDEX[name[0]]) diatonic++;
    return notePitch(name, Math.floor(diatonic / 7));
  });
  const top = startOctave * 7 + LETTER_INDEX[tonic[0]] + 7;
  return [...pitches, notePitch(tonic, Math.floor(top / 7))];
}

/**
 * Which notes need a written accidental. There is no key signature, so a note shows its accidental unless the same
 * letter in the same octave already has it earlier in the bar; going back to a plain letter shows a natural.
 */
export function shownAccidentals(pitches: Pitch[]): (number | null)[] {
  const current = new Map<string, number>();
  return pitches.map(p => {
    const id = `${p.letter}:${p.octave}`;
    const before = current.get(id) ?? 0;
    current.set(id, p.acc);
    return p.acc === before ? null : p.acc;
  });
}

// ---------------------------------------------------------------- content

const STEP_WORD: Record<number, string> = { 1: "H", 2: "W", 3: "W+H", 4: "2W" };
/** Step pattern between neighbouring notes, top tonic included: W W H W W W H. */
export function stepPattern(scale: ScaleInfo): string[] {
  const semis = [...scale.steps.map(s => s.semitones), 12];
  return semis.slice(1).map((s, i) => STEP_WORD[s - semis[i]] ?? `${s - semis[i]}`);
}

const INTERVAL_NAMES: Record<string, string> = {
  "1": "root", "♭2": "minor second", "2": "major second", "♯2": "augmented second", "♭3": "minor third", "3": "major third",
  "4": "perfect fourth", "♯4": "augmented fourth", "♭5": "diminished fifth", "5": "perfect fifth", "♯5": "augmented fifth",
  "♭6": "minor sixth", "6": "major sixth", "♯6": "augmented sixth", "♭7": "minor seventh", "7": "major seventh", "♯1": "augmented unison",
};
export const intervalFromRoot = (label: string) => INTERVAL_NAMES[label] ?? label;

const TRIADS: [number[], Quality][] = [[[4, 7], "major"], [[3, 7], "minor"], [[3, 6], "diminished"], [[4, 8], "augmented"]];
const SEVENTHS: [number[], Quality][] = [[[4, 7, 11], "maj7"], [[4, 7, 10], "dom7"], [[3, 7, 10], "min7"], [[3, 6, 10], "halfDim7"], [[3, 6, 9], "dim7"], [[3, 7, 11], "minMaj7"]];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export type ScaleChord = { numeral: string; triad?: Chord; seventh?: Chord };

/**
 * Chords built by stacking thirds on each degree, for seven-note scales only (that is where "every other note"
 * is well defined). Degrees whose stack is not a standard triad or seventh are left out.
 */
export function scaleChords(tonic: string, scale: ScaleInfo): ScaleChord[] {
  if (scale.steps.length !== 7) return [];
  const notes = scaleSpelling(tonic, scale);
  const semis = scale.steps.map(s => s.semitones);
  const above = (i: number, k: number) => ((semis[(i + k) % 7] - semis[i]) % 12 + 12) % 12;
  return notes.map((root, i) => {
    const third = [above(i, 2), above(i, 4)], seventh = [...third, above(i, 6)];
    const tq = TRIADS.find(([iv]) => iv.join() === third.join())?.[1];
    const sq = SEVENTHS.find(([iv]) => iv.join() === seventh.join())?.[1];
    const base = ROMAN[i];
    const numeral = tq === "major" ? base : tq === "minor" ? base.toLowerCase() : tq === "diminished" ? `${base.toLowerCase()}°` : tq === "augmented" ? `${base}+` : base;
    const accidental = scale.steps[i].label.replace(/\d/g, "");
    return { numeral: accidental + numeral, triad: tq ? makeChord(root, tq) : undefined, seventh: sq ? makeChord(root, sq) : undefined };
  });
}

/** For a mode: the parent scale and its tonic, e.g. D Dorian -> C major. */
export function parentScale(page: ScalePage): ScalePage | undefined {
  if (!page.scale.modeOf) return undefined;
  const [parentId, degree] = page.scale.modeOf;
  if (degree === 1) return undefined;
  const parent = scaleById(parentId)!;
  const offset = parent.steps[degree - 1].semitones;
  return scalePageFor(FLAT_NAMES[(pitchClass(page.tonic) - offset + 12) % 12], parentId);
}

/** The modes of a parent scale (major, melodic minor, harmonic minor) that start on each of its degrees. */
export function modesOf(parent: ScalePage): ScalePage[] {
  const notes = scaleSpelling(parent.tonic, parent.scale);
  return SCALES.filter(s => s.modeOf?.[0] === parent.scale.id && s.id !== "natural-minor")
    .sort((a, b) => a.modeOf![1] - b.modeOf![1])
    .map(s => scalePageFor(notes[s.modeOf![1] - 1], s.id));
}

/** Scales on the same tonic, grouped by family, for "other scales on C". */
export function scalesOnTonic(tonic: string): ScalePage[] {
  return SCALES.map(s => scalePageFor(tonic, s.id));
}
