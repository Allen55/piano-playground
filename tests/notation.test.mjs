import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePitch, midiOf, pitchName, staffStep, isLine, onStaff, ledgerSteps, describeStep, keyAccidental, keyChoices, keySigGlyphs,
  eligibleNotes, explainNoNotes, DEFAULT_NOTE_FILTERS, drawNext, seededRng, enharmonicSpellings, midiLabel, RANGE_PITCHES,
} from "../src/lib/notation.ts";

const F = (over) => ({ ...DEFAULT_NOTE_FILTERS, ...over });
const names = (notes) => notes.map(n => pitchName(n.pitch));

test("middle C is MIDI 60 in both clefs, one ledger line below treble and one above bass", () => {
  const c4 = parsePitch("C4");
  assert.equal(midiOf(c4), 60);
  assert.equal(staffStep(c4, "treble"), -2);
  assert.equal(staffStep(c4, "bass"), 10);
  assert.deepEqual(ledgerSteps(-2), [-2]);
  assert.deepEqual(ledgerSteps(10), [10]);
  assert.match(describeStep(-2), /1st ledger line below/);
  assert.match(describeStep(10), /1st ledger line above/);
});

test("clef anchors: E4 and F5 frame the treble staff, G2 and A3 the bass staff, F3 is the bass 4th line", () => {
  assert.equal(staffStep(parsePitch("E4"), "treble"), 0);
  assert.equal(staffStep(parsePitch("F5"), "treble"), 8);
  assert.equal(staffStep(parsePitch("G2"), "bass"), 0);
  assert.equal(staffStep(parsePitch("A3"), "bass"), 8);
  assert.equal(staffStep(parsePitch("F3"), "bass"), 6);
  assert.match(describeStep(6), /4th line/);
  assert.match(describeStep(0), /1st \(bottom\) line/);
});

test("the 88 keys run from A0 (21) to C8 (108)", () => {
  assert.equal(midiOf(parsePitch("A0")), 21);
  assert.equal(midiOf(parsePitch("C8")), 108);
  assert.equal(RANGE_PITCHES[0], "A0");
  assert.equal(RANGE_PITCHES.at(-1), "C8");
  assert.equal(midiLabel(61), "C♯4");
});

test("written octave follows the letter: B♯3 sounds as C4, C♭4 as B3", () => {
  assert.equal(midiOf(parsePitch("B#3")), 60);
  assert.equal(midiOf(parsePitch("Cb4")), 59);
  assert.deepEqual(enharmonicSpellings(60).map(pitchName), ["B♯3", "C4", "D𝄫4"]);
});

test("ledger lines stack outward from the staff", () => {
  assert.deepEqual(ledgerSteps(-5), [-2, -4]);
  assert.deepEqual(ledgerSteps(13), [10, 12]);
  assert.deepEqual(ledgerSteps(-1), []);
  assert.deepEqual(ledgerSteps(4), []);
});

test("E4 cutoff: at or above E4 keeps E4 and drops D4; F3 cutoff: at or below F3 keeps F3 and drops G3", () => {
  const up = names(eligibleNotes(F({ range: "atLeast", low: "E4", outside: "include" })));
  assert.ok(up.includes("E4") && !up.includes("D4"));
  const down = names(eligibleNotes(F({ range: "atMost", high: "F3", outside: "include" })));
  assert.ok(down.includes("F3") && !down.includes("G3"));
  const between = eligibleNotes(F({ range: "between", low: "F3", high: "E4", outside: "include" }));
  assert.ok(between.every(n => midiOf(n.pitch) >= 53 && midiOf(n.pitch) <= 64));
  // Middle C appears in both clefs.
  assert.deepEqual(between.filter(n => pitchName(n.pitch) === "C4").map(n => n.clef).sort(), ["bass", "treble"]);
});

test("lines and spaces filter independently of the outside-the-staff toggle", () => {
  const lines = eligibleNotes(F({ position: "lines", treble: true, bass: false }));
  assert.deepEqual(names(lines), ["E4", "G4", "B4", "D5", "F5"]);
  const spaces = eligibleNotes(F({ position: "spaces", treble: true, bass: false }));
  assert.deepEqual(names(spaces), ["F4", "A4", "C5", "E5"]);
  const ledgerLines = eligibleNotes(F({ position: "lines", outside: "only", treble: true, bass: false }));
  assert.ok(ledgerLines.every(n => isLine(n.step) && !onStaff(n.step)));
  assert.deepEqual(names(ledgerLines), ["F3", "A3", "C4", "A5", "C6", "E6"]);
  const bassOutside = names(eligibleNotes(F({ outside: "only", treble: false, bass: true })));
  assert.ok(bassOutside.includes("C4") && bassOutside.includes("E2") && bassOutside.includes("B3"));
});

test("G major spells F as F♯ in choices, notes and the key signature", () => {
  assert.equal(keyAccidental(1, 3), 1);
  assert.deepEqual(keyChoices(1).map(p => p.letter === 3 ? p.acc : 0).filter(Boolean), [1]);
  const notes = eligibleNotes(F({ key: "g", treble: true, bass: false }));
  assert.ok(names(notes).includes("F♯4") && names(notes).includes("F♯5"));
  assert.ok(!names(notes).includes("F4"));
  assert.deepEqual(keySigGlyphs(1, "treble"), [{ step: 8, acc: 1 }]);
  assert.deepEqual(keySigGlyphs(1, "bass"), [{ step: 6, acc: 1 }]);
  assert.deepEqual(keySigGlyphs(-2, "treble").map(g => g.step), [4, 7]);
});

test("range compares sounding pitch: E♭4 is below an E4 cutoff", () => {
  const notes = names(eligibleNotes(F({ key: "e-flat", range: "atLeast", low: "E4", treble: true, bass: false })));
  assert.ok(!notes.includes("E♭4") && notes.includes("F4"));
});

test("conflicting filters are explained, and none are reported when notes exist", () => {
  assert.deepEqual(explainNoNotes(DEFAULT_NOTE_FILTERS), []);
  const clash = explainNoNotes(F({ treble: true, bass: false, range: "atMost", high: "F3" }));
  assert.ok(clash.length >= 2);
  assert.match(clash.join(" "), /Clef: treble/);
  assert.match(clash.join(" "), /at or below F3/);
  assert.match(clash.join(" "), /turning on both clefs gives/);
  assert.match(explainNoNotes(F({ treble: false, bass: false })).join(" "), /No clef/);
  assert.match(explainNoNotes(F({ range: "between", low: "C5", high: "C4" })).join(" "), /above the high note/);
});

test("draws never repeat back to back and cover the pool before repeating", () => {
  const pool = ["a", "b", "c", "d"].map(id => ({ id }));
  const rng = seededRng(7);
  let bag = [], last;
  const seen = [];
  for (let i = 0; i < 40; i++) {
    const r = drawNext(bag, pool, last, rng);
    assert.notEqual(r.item.id, last);
    seen.push(r.item.id);
    last = r.item.id; bag = r.bag;
  }
  assert.deepEqual(new Set(seen.slice(0, 4)).size, 4);
  const single = drawNext([], [{ id: "x" }], "x", rng);
  assert.equal(single.item.id, "x");
  assert.equal(drawNext([], [], undefined, rng), null);
});
