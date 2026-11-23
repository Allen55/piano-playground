import { test } from "node:test";
import assert from "node:assert/strict";
import { pitchClass } from "../src/lib/music.ts";
import { midiOf } from "../src/lib/notation.ts";
import {
  SCALES, alternateTonic, canonicalTonic, shownAccidentals, modesOf, parentScale, parseScaleSlug, scaleById, scaleChords, scaleHref,
  scalePages, scalePitches, scaleSlug, scaleSpelling, stepPattern,
} from "../src/lib/scales.ts";

const s = id => scaleById(id);

test("formulas spell the expected notes", () => {
  assert.deepEqual(scaleSpelling("C", s("major")), ["C", "D", "E", "F", "G", "A", "B"]);
  assert.deepEqual(scaleSpelling("D", s("dorian")), ["D", "E", "F", "G", "A", "B", "C"]);
  assert.deepEqual(scaleSpelling("C", s("blues")), ["C", "E♭", "F", "G♭", "G", "B♭"]);
  assert.deepEqual(scaleSpelling("A", s("blues")), ["A", "C", "D", "E♭", "E", "G"]);
  assert.deepEqual(scaleSpelling("C", s("major-blues")), ["C", "D", "E♭", "E", "G", "A"]);
  assert.deepEqual(scaleSpelling("G", s("altered")), ["G", "A♭", "B♭", "B", "D♭", "E♭", "F"]);
  assert.deepEqual(scaleSpelling("B♭", s("blues")), ["B♭", "D♭", "E♭", "E", "F", "A♭"]);
  assert.deepEqual(scaleSpelling("D", s("diminished-half-whole")), ["D", "E♭", "F", "F♯", "G♯", "A", "B", "C"]);
  assert.deepEqual(scaleSpelling("F♯", s("major")), ["F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯"]);
  assert.deepEqual(scaleSpelling("C", s("bebop-dominant")), ["C", "D", "E", "F", "G", "A", "B♭", "B"]);
  assert.deepEqual(scaleSpelling("E", s("phrygian-dominant")), ["E", "F", "G♯", "A", "B", "C", "D"]);
  assert.deepEqual(scaleSpelling("B", s("altered")), ["B", "C", "D", "D♯", "F", "G", "A"]);
  assert.deepEqual(scaleSpelling("C", s("whole-tone")), ["C", "D", "E", "F♯", "G♯", "B♭"]);
});

test("every formula climbs and fits in an octave", () => {
  for (const scale of SCALES) {
    const semis = scale.steps.map(x => x.semitones);
    assert.equal(semis[0], 0, scale.id);
    assert.ok(semis.every((v, i) => i === 0 || v > semis[i - 1]), scale.id);
    assert.ok(semis.at(-1) < 12, scale.id);
    assert.ok(scale.steps.every((x, i) => i === 0 || x.degree >= scale.steps[i - 1].degree), scale.id);
  }
  assert.equal(stepPattern(s("major")).join(" "), "W W H W W W H");
  assert.equal(stepPattern(s("harmonic-minor")).join(" "), "W H W W H W+H H");
});

test("canonical tonics avoid awkward spellings", () => {
  assert.equal(canonicalTonic(1, s("major")), "D♭");
  assert.equal(canonicalTonic(1, s("natural-minor")), "C♯");
  assert.equal(canonicalTonic(6, s("major")), "F♯");
  assert.equal(canonicalTonic(10, s("dorian")), "B♭");
  assert.equal(canonicalTonic(8, s("minor-pentatonic")), "G♯");
  assert.equal(alternateTonic("F♯", s("major")), "G♭");
  assert.equal(alternateTonic("C♯", s("natural-minor")), undefined); // D♭ minor needs B𝄫
  for (const page of scalePages()) {
    const doubles = scaleSpelling(page.tonic, page.scale).filter(n => [...n.slice(1)].length > 1);
    assert.deepEqual(doubles, [], scaleSlug(page));
  }
});

test("pages have unique slugs that round-trip", () => {
  const pages = scalePages();
  assert.equal(pages.length, SCALES.length * 12);
  assert.equal(new Set(pages.map(scaleSlug)).size, pages.length);
  for (const page of pages) assert.deepEqual(parseScaleSlug(scaleSlug(page)), page);
  assert.equal(scaleHref(parseScaleSlug("f-sharp-blues")), "/scales/f-sharp-blues/");
  assert.ok(parseScaleSlug("c-sharp-dorian") && parseScaleSlug("b-flat-major") && !parseScaleSlug("a-sharp-major"));
});

test("staff pitches ascend one octave and match the spelled notes", () => {
  for (const page of scalePages()) {
    const pitches = scalePitches(page.tonic, page.scale);
    const midi = pitches.map(midiOf);
    assert.equal(midi.at(-1) - midi[0], 12, scaleSlug(page));
    assert.ok(midi.every((m, i) => i === 0 || m > midi[i - 1]), scaleSlug(page));
    const names = scaleSpelling(page.tonic, page.scale);
    names.forEach((n, i) => assert.equal(midi[i] % 12, pitchClass(n), scaleSlug(page)));
    assert.ok(midi[0] >= 53 && midi.at(-1) <= 84, scaleSlug(page)); // around the treble staff
  }
  assert.deepEqual(scalePitches("C", s("major")).map(midiOf), [60, 62, 64, 65, 67, 69, 71, 72]);
});

test("chords from seven-note scales", () => {
  const c = scaleChords("C", s("major"));
  assert.deepEqual(c.map(x => x.numeral), ["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  assert.deepEqual(c.map(x => x.seventh.symbol), ["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7♭5"]);
  const h = scaleChords("A", s("harmonic-minor"));
  assert.deepEqual(h.map(x => x.numeral), ["i", "ii°", "♭III+", "iv", "V", "♭VI", "vii°"]);
  assert.equal(h[0].seventh.symbol, "Am(maj7)");
  assert.deepEqual(scaleChords("C", s("blues")), []);
});

test("modes know their parent scale", () => {
  const parent = parentScale({ tonic: "D", scale: s("dorian") });
  assert.equal(parent.tonic, "C");
  assert.equal(parent.scale.id, "major");
  assert.equal(parentScale({ tonic: "B", scale: s("altered") }).tonic, "C");
  assert.equal(parentScale({ tonic: "C", scale: s("blues") }), undefined);
  assert.deepEqual(modesOf({ tonic: "C", scale: s("major") }).map(scaleSlug),
    ["c-major", "d-dorian", "e-phrygian", "f-lydian", "g-mixolydian", "a-aeolian", "b-locrian"]);
});

test("staff accidentals: shown once per letter and octave, naturals when they change back", () => {
  const blues = scalePitches("C", s("blues")); // C E♭ F G♭ G B♭ C
  assert.deepEqual(shownAccidentals(blues), [null, -1, null, -1, 0, -1, null]);
  const bebop = scalePitches("C", s("bebop-dominant")); // … B♭ B C
  assert.deepEqual(shownAccidentals(bebop).slice(-3), [-1, 0, null]);
  const fs = scalePitches("F♯", s("major")); // F♯3 … F♯4: the top F♯ is a new octave, so it shows its sharp
  assert.equal(shownAccidentals(fs).at(-1), 1);
});
