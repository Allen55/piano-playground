import { test } from "node:test";
import assert from "node:assert/strict";
import { makeChord, pitchClass } from "../src/lib/music.ts";
import { LAUNCH_QUALITIES, chordPages, chordSlug, harmonicMinorHome, isLaunchChord, keyboardName, keysContaining, keysWithAllNotes, parseChordSlug, relatedChords, symbolAliases } from "../src/lib/reference.ts";

const symbols = chords => chords.map(c => c.symbol);

test("every launch chord page is unique, round-trips and has the right pitches", () => {
  const pages = chordPages(LAUNCH_QUALITIES);
  assert.equal(pages.length, 72);
  assert.equal(new Set(pages.map(chordSlug)).size, 72);
  for (const chord of pages) {
    assert.equal(parseChordSlug(chordSlug(chord)).symbol, chord.symbol);
    assert.deepEqual(chord.notes.map(pitchClass), chord.intervals.map(i => (pitchClass(chord.root) + i) % 12), chord.symbol);
    assert.ok(isLaunchChord(chord));
  }
  assert.ok(!isLaunchChord(makeChord("C", "maj7")));
});

test("diminished, augmented and sus chords are spelled correctly", () => {
  const notes = (root, q) => makeChord(root, q).notes.join(" ");
  assert.equal(notes("B", "diminished"), "B D F");
  assert.equal(notes("C♯", "diminished"), "C♯ E G");
  assert.equal(notes("E♭", "diminished"), "E♭ G♭ B♭♭");
  assert.equal(notes("C", "augmented"), "C E G♯");
  assert.equal(notes("B", "augmented"), "B D♯ F♯♯");
  assert.equal(notes("C", "sus2"), "C D G");
  assert.equal(notes("F♯", "sus4"), "F♯ B C♯");
  assert.equal(chordSlug(makeChord("C♯", "diminished")), "c-sharp-diminished");
  assert.equal(chordSlug(makeChord("A♭", "augmented")), "a-flat-augmented");
  const dimRoots = chordPages(["diminished"]).map(c => c.root);
  assert.ok(dimRoots.includes("C♯") && dimRoots.includes("G♯"));
  const augRoots = chordPages(["augmented"]).map(c => c.root);
  assert.ok(augRoots.includes("D♭") && augRoots.includes("A♭"));
});

test("theory spellings get plain key names", () => {
  assert.equal(keyboardName("B♭♭"), "A");
  assert.equal(keyboardName("F♯♯"), "G");
  assert.equal(keyboardName("E♯"), "F");
  assert.equal(keyboardName("C♭"), "B");
  assert.equal(keyboardName("D♯"), undefined);
  assert.equal(keyboardName("C"), undefined);
});

test("aliases and related chords", () => {
  assert.deepEqual(symbolAliases(makeChord("C", "major")), ["C", "CM", "Cmaj"]);
  assert.deepEqual(symbolAliases(makeChord("C", "diminished")), ["Cdim", "C°", "Cm♭5"]);
  const same = chord => relatedChords(chord).filter(r => r.relation === "Same notes").map(r => r.chord.symbol);
  assert.deepEqual(same(makeChord("C", "sus2")), ["Gsus4"]);
  assert.deepEqual(same(makeChord("C", "sus4")), ["Fsus2"]);
  assert.deepEqual(same(makeChord("C", "augmented")), ["E+", "A♭+"]);
  const dim = relatedChords(makeChord("B", "diminished"));
  assert.equal(dim.find(r => r.relation === "Dominant seventh containing it").chord.symbol, "G7");
});

test("keys for diminished, sus and augmented chords", () => {
  const bdim = keysContaining(makeChord("B", "diminished")).filter(k => !k.sevenths).map(k => `${k.tonic} ${k.mode} ${k.numeral}`);
  assert.deepEqual(bdim, ["C major vii°", "A minor ii°"]);
  const csus4 = keysWithAllNotes(makeChord("C", "sus4")).map(k => `${k.tonic} ${k.mode} ${k.numeral}`);
  assert.ok(csus4.includes("C major Isus4") && csus4.includes("F major Vsus4") && csus4.includes("B♭ major IIsus4"));
  assert.ok(!csus4.some(k => k.startsWith("G major")));
  assert.equal(keysContaining(makeChord("C", "augmented")).length, 0);
  assert.equal(harmonicMinorHome(makeChord("C", "augmented")), "A");
  assert.equal(harmonicMinorHome(makeChord("D♭", "augmented")), "B♭");
});
