// Key-level helpers for the key hub pages (relative/parallel keys, scale on the keyboard).
import { keyInfo, pitchClass, type Mode } from "./music.ts";
import { allKeys, keySlug, type KeyRef } from "./reference.ts";

export function keyName(key: KeyRef): string { return `${key.tonic} ${key.mode}`; }
const otherMode = (mode: Mode): Mode => (mode === "major" ? "minor" : "major");

/** The key that shares this key's signature (C major <-> A minor). */
export function relativeKey(key: KeyRef): KeyRef { return { tonic: keyInfo(key.tonic, key.mode).relative, mode: otherMode(key.mode) }; }

/** Same tonic, other mode, or undefined when that key is not one of the 24 hubs (D♭ minor). */
export function parallelKey(key: KeyRef): KeyRef | undefined {
  const target = { tonic: key.tonic, mode: otherMode(key.mode) };
  return allKeys().find(k => keySlug(k) === keySlug(target));
}

/** Ascending MIDI numbers for scale notes starting at the tonic in the given octave, ending on the octave above. */
export function scaleMidi(notes: string[], baseOctave = 4): number[] {
  const midi = [12 * (baseOctave + 1) + pitchClass(notes[0])];
  for (const name of notes.slice(1)) { let next = midi[midi.length - 1] + 1; while (next % 12 !== pitchClass(name)) next++; midi.push(next); }
  midi.push(midi[0] + 12);
  return midi;
}
