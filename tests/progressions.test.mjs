import { test } from "node:test";
import assert from "node:assert/strict";
import { PROGRESSIONS, builderChordType, distinctSteps, getProgression, keysFor, outsideNotes, progressionChords, stripSteps, voiceLeadingText } from "../src/lib/progressions.ts";

test("launch progressions have stable names and slugs", () => {
  assert.deepEqual(PROGRESSIONS.slice(0, 6).map(p => p.name), ["I-V-vi-IV", "I-vi-IV-V", "ii-V-I", "I-IV-V", "vi-IV-I-V", "i-VI-III-VII"]);
  assert.deepEqual(PROGRESSIONS.map(p => p.slug), ["i-v-vi-iv", "i-vi-iv-v", "ii-v-i", "i-iv-v", "vi-iv-i-v", "i-vi-iii-vii", "minor-ii-v-i", "i-vi-ii-v", "iii-vi-ii-v", "12-bar-blues", "quick-change-blues", "minor-blues"]);
  assert.equal(new Set(PROGRESSIONS.map(p => p.slug)).size, PROGRESSIONS.length);
  assert.ok(PROGRESSIONS.every(p => /^[a-z0-9-]+$/.test(p.slug)));
  assert.ok(PROGRESSIONS.every(p => p.sound.length > 10));
  assert.equal(getProgression("i-v-vi-iv").numerals.join(" "), "I V vi IV");
});

test("progressions transpose into every key", () => {
  const p = getProgression("i-v-vi-iv");
  assert.deepEqual(progressionChords(p, "C").map(c => c.symbol), ["C", "G", "Am", "F"]);
  assert.deepEqual(progressionChords(p, "G").map(c => c.symbol), ["G", "D", "Em", "C"]);
  assert.deepEqual(progressionChords(p, "D♭").map(c => c.symbol), ["D♭", "A♭", "B♭m", "G♭"]);
  assert.equal(keysFor(p).length, 12);
  const minor = PROGRESSIONS.find(x => x.mode === "minor");
  assert.deepEqual(progressionChords(minor, "A").map(c => c.symbol), ["Am", "F", "C", "G"]);
  assert.equal(keysFor(minor).length, 12);
});

test("voice leading text names the notes that stay and move", () => {
  const p = getProgression("i-v-vi-iv");
  const smooth = stripSteps(progressionChords(p, "C"), "smooth");
  assert.equal(voiceLeadingText(smooth[0], smooth[1]), "C moves down 1 semitone to B; E moves down 2 semitones to D; G stays");
  const root = stripSteps(progressionChords(p, "C"), "root");
  assert.ok(root.every(s => s.inversion.index === 0));
  assert.ok(stripSteps(progressionChords(p, "C"), "second").every(s => s.inversion.index === 2));
});

test("jazz progressions use seventh chords", () => {
  const symbols = (slug, tonic) => progressionChords(getProgression(slug), tonic).map(c => c.symbol);
  assert.deepEqual(symbols("ii-v-i", "C"), ["Dm7", "G7", "Cmaj7"]);
  assert.deepEqual(getProgression("ii-v-i").numerals, ["ii7", "V7", "Imaj7"]);
  assert.deepEqual(symbols("ii-v-i", "B♭"), ["Cm7", "F7", "B♭maj7"]);
  assert.deepEqual(symbols("minor-ii-v-i", "A"), ["Bm7♭5", "E7", "Am7"]);
  assert.deepEqual(symbols("i-vi-ii-v", "C"), ["Cmaj7", "Am7", "Dm7", "G7"]);
  assert.deepEqual(symbols("iii-vi-ii-v", "F"), ["Am7", "Dm7", "Gm7", "C7"]);
  assert.equal(builderChordType(getProgression("ii-v-i")), "sevenths");
  assert.equal(builderChordType(getProgression("i-v-vi-iv")), "triads");
  assert.equal(builderChordType(getProgression("minor-ii-v-i")), undefined);
  const smooth = stripSteps(progressionChords(getProgression("ii-v-i"), "C"), "smooth");
  assert.equal(voiceLeadingText(smooth[0], smooth[1]), "D stays; F stays; A moves down 2 semitones to G; C moves down 1 semitone to B");
});

test("blues progressions are 12 bars of dominant sevenths", () => {
  const blues = getProgression("12-bar-blues");
  assert.equal(blues.degrees.length, 12);
  assert.equal(blues.beats, 4);
  assert.deepEqual(progressionChords(blues, "C").map(c => c.symbol), ["C7", "C7", "C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7", "C7", "G7"]);
  assert.deepEqual(progressionChords(getProgression("quick-change-blues"), "G").slice(0, 2).map(c => c.symbol), ["G7", "C7"]);
  assert.deepEqual(distinctSteps(blues).map(s => s.numeral), ["I7", "IV7", "V7"]);
  assert.deepEqual(progressionChords(getProgression("minor-blues"), "A").map(c => c.symbol).slice(8), ["F7", "E7", "Am7", "E7"]);
  assert.deepEqual(outsideNotes(progressionChords(blues, "C")[0], "C", "major"), ["B♭"]);
  assert.deepEqual(outsideNotes(progressionChords(blues, "C")[1 + 3], "C", "major"), ["E♭"]);
  assert.equal(keysFor(blues).length, 12);
  const steps = stripSteps(progressionChords(blues, "C"), "smooth");
  assert.equal(voiceLeadingText(steps[0], steps[1]), "same chord, nothing moves");
});

test("progressions containing a chord, and links that open in a key", async () => {
  const { progressionsWithChord, progressionHref, tonicFromQuery } = await import("../src/lib/progressions.ts");
  const { makeChord } = await import("../src/lib/music.ts");
  const c = progressionsWithChord(makeChord("C", "major"));
  const first = c.find(u => u.progression.slug === "i-v-vi-iv");
  assert.deepEqual(first.uses.map(u => `${u.tonic} ${u.numeral}`), ["C I", "G IV", "F V"]);
  assert.ok(!c.some(u => u.progression.style === "blues"));
  const c7 = progressionsWithChord(makeChord("C", "dom7"));
  assert.deepEqual(c7.find(u => u.progression.slug === "12-bar-blues").uses.map(u => `${u.tonic} ${u.numeral}`), ["C I7", "G IV7", "F V7"]);
  const csharp = progressionsWithChord(makeChord("C♯", "minor"));
  assert.ok(csharp.some(u => u.uses.some(x => x.tonic === "A" || x.tonic === "C♯")));
  const p = getProgression("i-v-vi-iv");
  assert.equal(progressionHref(p, "G"), "/progressions/i-v-vi-iv/?key=g-major");
  assert.equal(progressionHref(p, "C"), "/progressions/i-v-vi-iv/");
  assert.equal(tonicFromQuery(p, "?key=g-major"), "G");
  assert.equal(tonicFromQuery(p, "?key=e-minor"), undefined);
  assert.equal(tonicFromQuery(getProgression("minor-blues"), "?key=f-sharp-minor"), "F♯");
});
