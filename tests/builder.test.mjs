import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BUILDER, builderChords, builderNumeral, builderQuery, builderSteps, inversionIndexes, parseBuilderQuery, parseDegrees } from "../src/lib/builder.ts";

test("typed progressions accept numbers and Roman numerals", () => {
  assert.deepEqual(parseDegrees("1-5-6-4"), [1, 5, 6, 4]);
  assert.deepEqual(parseDegrees(" 1 5, 6 4 "), [1, 5, 6, 4]);
  assert.deepEqual(parseDegrees("I-V-vi-IV"), [1, 5, 6, 4]);
  assert.deepEqual(parseDegrees("ii7 V7 Imaj7"), [2, 5, 1]);
  assert.deepEqual(parseDegrees("i VI III VII"), [1, 6, 3, 7]);
  assert.deepEqual(parseDegrees("vii° iiø7"), [7, 2]);
  assert.equal(parseDegrees("1-8"), undefined);
  assert.equal(parseDegrees("1-x"), undefined);
  assert.equal(parseDegrees(""), undefined);
  assert.equal(parseDegrees(Array(17).fill("1").join("-")), undefined);
});

test("chords and numerals follow the key and chord type", () => {
  const g = { key: { tonic: "G", mode: "major" }, degrees: [1, 5, 6, 4], sevenths: false, inversion: "smooth" };
  assert.deepEqual(builderChords(g).map(c => c.symbol), ["G", "D", "Em", "C"]);
  assert.deepEqual(builderChords({ ...g, sevenths: true }).map(c => c.quality), ["maj7", "dom7", "min7", "maj7"]);
  const c = { tonic: "C", mode: "major" };
  assert.deepEqual([1, 2, 5, 7].map(d => builderNumeral(c, d, true)), ["Imaj7", "ii7", "V7", "viiø7"]);
  assert.deepEqual([1, 2, 3].map(d => builderNumeral({ tonic: "A", mode: "minor" }, d, true)), ["i7", "iiø7", "IIImaj7"]);
  assert.equal(builderNumeral(c, 7, false), "vii°");
});

test("per-chord inversions are applied and clamped", () => {
  const state = { ...DEFAULT_BUILDER, inversion: [0, 2, 1, 3] };
  const steps = builderSteps(state);
  assert.deepEqual(steps.map(s => s.inversion.index), [0, 2, 1, 2]);
  assert.equal(steps[1].inversion.bass, "D");
  const sevenths = builderSteps({ ...state, sevenths: true });
  assert.equal(sevenths[3].inversion.index, 3);
  assert.equal(inversionIndexes(DEFAULT_BUILDER).length, 4);
});

test("URL state round-trips and rejects bad input", () => {
  const state = parseBuilderQuery("?key=g-major&p=1-5-6-4&inv=smooth");
  assert.deepEqual(state, { key: { tonic: "G", mode: "major" }, degrees: [1, 5, 6, 4], sevenths: false, inversion: "smooth" });
  assert.equal(builderQuery(state), "?key=g-major&p=1-5-6-4&inv=smooth");
  const custom = { key: { tonic: "B♭", mode: "minor" }, degrees: [2, 5, 1], sevenths: true, inversion: [1, 0, 2] };
  assert.equal(builderQuery(custom), "?key=b-flat-minor&p=2-5-1&chords=sevenths&inv=1-0-2");
  assert.deepEqual(parseBuilderQuery(builderQuery(custom)), custom);
  assert.deepEqual(parseBuilderQuery("?p=1-4-5&inv=second").inversion, [2, 2, 2]);
  assert.deepEqual(parseBuilderQuery("?p=1-4-5&inv=1").inversion, [1, 0, 0]);
  assert.deepEqual(parseBuilderQuery("?key=h-major&p=9&inv=bogus"), DEFAULT_BUILDER);
});

test("Studio links carry per-chord qualities", async () => {
  const { studioHref, parseQualities } = await import("../src/lib/builder.ts");
  const state = { key: { tonic: "C", mode: "major" }, degrees: [1, 4, 5], sevenths: false, inversion: "smooth" };
  const href = studioHref(state, ["dom7", "dom7", "dom7"]);
  assert.equal(href, "/studio/?key=c-major&p=1-4-5&inv=smooth&q=dom7-dom7-dom7");
  const params = new URLSearchParams(href.split("?")[1]);
  assert.deepEqual(parseQualities(params, 3), ["dom7", "dom7", "dom7"]);
  assert.equal(parseQualities(params, 4), undefined);
  assert.equal(parseQualities(new URLSearchParams("q=dom7-bogus-dom7"), 3), undefined);
  assert.equal(studioHref(state), "/studio/?key=c-major&p=1-4-5&inv=smooth");
});
