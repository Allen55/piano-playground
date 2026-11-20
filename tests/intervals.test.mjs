import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePitch, pitchName, midiOf, seededRng } from "../src/lib/notation.ts";
import {
  intervalBetween, transpose, intervalName, specSemitones, explainInterval, earName, earDistances, earSpellings,
  makeIntervalQuestion, explainNoIntervals, DEFAULT_INTERVAL_FILTERS, INTERVAL_PRESETS, eligibleIntervals, spellingChoices, INTERVALS,
} from "../src/lib/intervals.ts";

const P = parsePitch;
const short = (m) => `${m.quality}${m.number}`;

test("ascending and descending intervals get the same name", () => {
  assert.equal(short(intervalBetween(P("C4"), P("E4"))), "M3");
  const down = intervalBetween(P("E4"), P("C4"));
  assert.equal(short(down), "M3");
  assert.equal(down.direction, "down");
  assert.equal(down.semitones, 4);
  assert.equal(short(intervalBetween(P("G4"), P("B3"))), "m6");
});

test("unisons and octaves", () => {
  assert.equal(short(intervalBetween(P("C4"), P("C4"))), "P1");
  assert.equal(short(intervalBetween(P("C4"), P("C5"))), "P8");
  assert.equal(short(intervalBetween(P("C5"), P("C4"))), "P8");
  assert.equal(short(intervalBetween(P("F#3"), P("F#4"))), "P8");
  assert.equal(short(intervalBetween(P("C4"), P("C#4"))), "A1");
});

test("compound intervals through the 15th", () => {
  assert.equal(short(intervalBetween(P("C4"), P("D5"))), "M9");
  assert.equal(short(intervalBetween(P("C4"), P("Eb5"))), "m10");
  assert.equal(short(intervalBetween(P("C4"), P("F#5"))), "A11");
  assert.equal(short(intervalBetween(P("C4"), P("C6"))), "P15");
  assert.equal(short(intervalBetween(P("A5"), P("G4"))), "M9");
  assert.equal(specSemitones({ number: 15, quality: "P" }), 24);
  assert.equal(specSemitones({ number: 13, quality: "M" }), 21);
});

test("enharmonic spellings are different intervals: A4 versus d5, A2 versus m3", () => {
  const aug4 = intervalBetween(P("C4"), P("F#4"));
  const dim5 = intervalBetween(P("C4"), P("Gb4"));
  assert.equal(aug4.semitones, dim5.semitones);
  assert.equal(intervalName(aug4), "augmented 4th");
  assert.equal(intervalName(dim5), "diminished 5th");
  assert.equal(short(intervalBetween(P("C4"), P("D#4"))), "A2");
  assert.equal(short(intervalBetween(P("C4"), P("Eb4"))), "m3");
  assert.equal(short(intervalBetween(P("B#3"), P("C4"))), "d2");
});

test("transpose spells the target by letter, in both directions", () => {
  assert.equal(pitchName(transpose(P("Eb4"), { number: 3, quality: "M" }, "up")), "G4");
  assert.equal(pitchName(transpose(P("C4"), { number: 4, quality: "A" }, "up")), "F♯4");
  assert.equal(pitchName(transpose(P("C4"), { number: 5, quality: "d" }, "up")), "G♭4");
  assert.equal(pitchName(transpose(P("C4"), { number: 3, quality: "m" }, "down")), "A3");
  assert.equal(pitchName(transpose(P("D4"), { number: 10, quality: "M" }, "down")), "B♭2");
  assert.equal(transpose(P("Cb4"), { number: 2, quality: "A" }, "down"), null);
});

test("every catalogued interval round-trips through transpose and intervalBetween", () => {
  for (const spec of INTERVALS) {
    for (const dir of ["up", "down"]) {
      const b = transpose(P("D4"), spec, dir);
      const m = intervalBetween(P("D4"), b);
      assert.equal(`${m.quality}${m.number}`, `${spec.quality}${spec.number}`);
      assert.equal(m.semitones, specSemitones(spec));
    }
  }
});

test("explanations name letter steps and semitones", () => {
  const text = explainInterval(P("Eb4"), P("G4"));
  assert.match(text, /E–F–G/);
  assert.match(text, /3rd/);
  assert.match(text, /4 semitones/);
  assert.match(text, /so it is a 3rd/);
  assert.match(explainInterval(P("C4"), P("F#4")), /One more makes it augmented/);
  assert.match(explainInterval(P("D5"), P("C4")), /down from D to C/);
  assert.match(explainInterval(P("C4"), P("Gb4")), /One fewer makes it diminished/);
  assert.match(explainInterval(P("C4"), P("D5")), /compound interval: an octave plus a major 2nd/);
});

test("ear training has one answer per distance", () => {
  assert.equal(earName(6), "Tritone");
  assert.equal(earName(12), "Octave");
  assert.equal(earName(24), "Two octaves (15th)");
  const simple = { ...DEFAULT_INTERVAL_FILTERS, sizes: INTERVAL_PRESETS[1].sizes, qualities: INTERVAL_PRESETS[1].qualities };
  const d = earDistances(simple);
  assert.deepEqual(d, [...new Set(d)]);
  assert.deepEqual(d, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(earSpellings(3).map(s => `${s.quality}${s.number}`), ["m3"]);
});

test("beginner preset covers unisons, 2nds, 3rds, 4ths, 5ths and octaves only", () => {
  const f = DEFAULT_INTERVAL_FILTERS;
  assert.deepEqual([...new Set(eligibleIntervals(f).map(s => s.number))], [1, 2, 3, 4, 5, 8]);
  assert.ok(eligibleIntervals(f).every(s => ["P", "M", "m"].includes(s.quality)));
});

test("generated questions match their filters", () => {
  const rng = seededRng(3);
  for (const exercise of ["identify", "build", "ear"]) {
    const f = { ...DEFAULT_INTERVAL_FILTERS, exercise, sizes: INTERVAL_PRESETS[2].sizes, qualities: INTERVAL_PRESETS[2].qualities, bass: false };
    let last;
    for (let i = 0; i < 60; i++) {
      const q = makeIntervalQuestion(f, rng, last);
      assert.ok(q, exercise);
      assert.notEqual(q.id, last);
      last = q.id;
      const m = intervalBetween(q.a, q.b);
      assert.equal(`${m.quality}${m.number}`, `${q.spec.quality}${q.spec.number}`);
      if (exercise !== "ear") assert.equal(q.clef, "treble");
      if (exercise === "build") assert.notEqual(q.direction, "together");
      if (q.direction === "down") assert.ok(midiOf(q.b) <= midiOf(q.a));
    }
  }
});

test("empty interval filters explain themselves", () => {
  assert.deepEqual(explainNoIntervals(DEFAULT_INTERVAL_FILTERS), []);
  assert.match(explainNoIntervals({ ...DEFAULT_INTERVAL_FILTERS, sizes: [4], qualities: ["M"] }).join(" "), /perfect/);
  assert.match(explainNoIntervals({ ...DEFAULT_INTERVAL_FILTERS, exercise: "build", up: false, down: false }).join(" "), /Build needs/);
  assert.equal(makeIntervalQuestion({ ...DEFAULT_INTERVAL_FILTERS, sizes: [] }, Math.random), null);
});

test("spelling choices share one key and include the answer", () => {
  const choices = spellingChoices(P("F#4"));
  assert.ok(choices.every(p => midiOf(p) === 66));
  assert.deepEqual(choices.map(pitchName), ["E𝄪4", "F♯4", "G♭4"]);
});

test("articles read naturally", async () => {
  const { withArticle } = await import("../src/lib/intervals.ts");
  assert.equal(withArticle("augmented 4th"), "an augmented 4th");
  assert.equal(withArticle("unison"), "a unison");
  assert.equal(withArticle("octave"), "an octave");
  assert.equal(withArticle("11th"), "an 11th");
  assert.equal(withArticle("major 3rd"), "a major 3rd");
});
