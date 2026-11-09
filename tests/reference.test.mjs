import { test } from "node:test";
import assert from "node:assert/strict";
import { makeChord, midiName } from "../src/lib/music.ts";
import { QUALITY_SLUGS, allKeys, canonicalRoot, chordPages, chordSlug, inversions, keySlug, keysContaining, movement, noteSlug, parseChordSlug, parseKeySlug, relatedChords, smoothInversions, totalMovement, voiceMoves } from "../src/lib/reference.ts";

test("slugs avoid accidental symbols and round-trip", () => {
  assert.equal(noteSlug("F♯"), "f-sharp");
  assert.equal(noteSlug("B♭"), "b-flat");
  assert.equal(chordSlug(makeChord("B♭", "min7")), "b-flat-minor-7");
  assert.equal(chordSlug(makeChord("C", "major")), "c-major");
  assert.equal(parseChordSlug("b-flat-minor-7").symbol, "B♭m7");
  assert.equal(parseChordSlug("not-a-chord"), undefined);
  assert.equal(keySlug({ tonic: "F♯", mode: "major" }), "f-sharp-major");
  assert.deepEqual(parseKeySlug("e-minor"), { tonic: "E", mode: "minor" });
  assert.equal(allKeys().length, 24);
});

test("every quality has a unique slug and every page slug is unique", () => {
  const slugs = Object.values(QUALITY_SLUGS);
  assert.equal(new Set(slugs).size, slugs.length);
  const pages = chordPages(Object.keys(QUALITY_SLUGS));
  assert.equal(new Set(pages.map(chordSlug)).size, pages.length);
  assert.equal(pages.length, 12 * slugs.length);
});

test("canonical roots follow common spelling", () => {
  assert.equal(canonicalRoot(1, "major"), "D♭");
  assert.equal(canonicalRoot(1, "minor"), "C♯");
  assert.equal(canonicalRoot(8, "major"), "A♭");
  assert.equal(canonicalRoot(8, "minor"), "G♯");
  assert.equal(canonicalRoot(10, "minor"), "B♭");
});

test("triad inversions put each chord tone in the bass", () => {
  const result = inversions(makeChord("C", "major"));
  assert.deepEqual(result.map(i => i.names), [["C", "E", "G"], ["E", "G", "C"], ["G", "C", "E"]]);
  assert.deepEqual(result.map(i => i.bass), ["C", "E", "G"]);
  assert.deepEqual(result.map(i => i.label), ["Root position", "1st inversion", "2nd inversion"]);
  assert.deepEqual(result[0].midi, [60, 64, 67]);
  assert.deepEqual(result[1].midi, [64, 67, 72]);
  assert.deepEqual(result[2].midi, [67, 72, 76]);
  for (const inversion of result) assert.deepEqual(inversion.midi, [...inversion.midi].sort((a, b) => a - b));
});

test("seventh chords get a third inversion and keep correct spelling", () => {
  const result = inversions(makeChord("G", "maj7"));
  assert.equal(result.length, 4);
  assert.deepEqual(result[3].names, ["F♯", "G", "B", "D"]);
  assert.equal(midiName(result[3].midi[0], result[3].names[0]), "F♯4");
});

test("keysContaining finds every key where C major is diatonic", () => {
  const found = keysContaining(makeChord("C", "major")).filter(k => !k.sevenths).map(k => `${k.tonic} ${k.mode} ${k.numeral}`).sort();
  assert.deepEqual(found, ["A minor III", "C major I", "D minor VII", "E minor VI", "F major V", "G major IV"]);
  const sevenths = keysContaining(makeChord("G", "dom7")).filter(k => k.sevenths).map(k => `${k.tonic} ${k.mode}`).sort();
  assert.deepEqual(sevenths, ["A minor", "C major"]);
});

test("related chords include relative and parallel keys", () => {
  const related = Object.fromEntries(relatedChords(makeChord("C", "major")).map(r => [r.relation, r.chord.symbol]));
  assert.equal(related["Parallel minor"], "Cm");
  assert.equal(related["Relative minor"], "Am");
  assert.equal(related["Major seventh"], "Cmaj7");
  assert.equal(related["Dominant seventh"], "C7");
  const minor = Object.fromEntries(relatedChords(makeChord("A", "minor")).map(r => [r.relation, r.chord.symbol]));
  assert.equal(minor["Relative major"], "C");
  assert.equal(Object.fromEntries(relatedChords(makeChord("B♭", "major")).map(r => [r.relation, r.chord.symbol]))["Relative minor"], "Gm");
});

test("voice moves report notes that stay and notes that move", () => {
  const { moves, staying } = voiceMoves([60, 64, 67], [59, 62, 67]);
  assert.deepEqual(moves.map(m => m.semitones), [-1, -2, 0]);
  assert.deepEqual(staying, [67]);
});

test("smooth inversions keep the hand close", () => {
  const chords = [makeChord("C", "major"), makeChord("G", "major"), makeChord("A", "minor"), makeChord("F", "major")];
  const smooth = smoothInversions(chords);
  assert.equal(smooth.length, 4);
  assert.equal(smooth[0].inversion.index, 0);
  assert.deepEqual(smooth[1].midi, [59, 62, 67]); // G chord in 1st inversion, G stays, C to B, E to D
  assert.equal(movement(smooth[0].midi, smooth[1].midi), 3);
  const rootOnly = chords.map(chord => ({ midi: inversions(chord)[0].midi }));
  assert.ok(totalMovement(smooth) < totalMovement(rootOnly));
  for (const step of smooth) assert.ok(Math.min(...step.midi) >= 48 && Math.max(...step.midi) <= 83);
});
