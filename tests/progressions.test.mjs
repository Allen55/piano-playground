import { test } from "node:test";
import assert from "node:assert/strict";
import { PROGRESSIONS, getProgression, keysFor, progressionChords, stripSteps, voiceLeadingText } from "../src/lib/progressions.ts";

test("launch progressions have stable names and slugs", () => {
  assert.deepEqual(PROGRESSIONS.map(p => p.name), ["I-V-vi-IV", "I-vi-IV-V", "ii-V-I", "I-IV-V", "vi-IV-I-V", "i-VI-III-VII"]);
  assert.deepEqual(PROGRESSIONS.map(p => p.slug), ["i-v-vi-iv", "i-vi-iv-v", "ii-v-i", "i-iv-v", "vi-iv-i-v", "i-vi-iii-vii"]);
  assert.equal(new Set(PROGRESSIONS.map(p => p.slug)).size, 6);
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
