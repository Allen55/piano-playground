import { test } from "node:test";
import assert from "node:assert/strict";
import { keyboardLayout, isBlackKey } from "../src/lib/keyboard-layout.ts";

test("two octaves C4-B5 have 14 white keys and 10 black keys", () => {
  const layout = keyboardLayout(60, 83, 24, 110);
  assert.equal(layout.whiteCount, 14);
  assert.equal(layout.keys.filter(k => k.black).length, 10);
  assert.equal(layout.width, 14 * 24);
});

test("black keys straddle the seam between white keys", () => {
  const { keys } = keyboardLayout(60, 71, 24, 110);
  const cSharp = keys.find(k => k.midi === 61);
  assert.equal(cSharp.x + cSharp.width / 2, 24);
  assert.ok(isBlackKey(61) && !isBlackKey(60));
});

test("fitWindow keeps every inversion inside 8 white keys", async () => {
  const { fitWindow, isBlackKey } = await import("../src/lib/keyboard-layout.ts");
  const { makeChord } = await import("../src/lib/music.ts");
  const { inversions, chordPages, LAUNCH_QUALITIES } = await import("../src/lib/reference.ts");
  assert.deepEqual(fitWindow([60, 64, 67]), { start: 60, end: 72 });
  assert.deepEqual(fitWindow([61, 65, 68]), { start: 60, end: 72 });
  for (const chord of chordPages(LAUNCH_QUALITIES)) for (const inv of inversions(chord)) {
    const { start, end } = fitWindow(inv.midi);
    let whites = 0; for (let m = start; m <= end; m++) if (!isBlackKey(m)) whites++;
    assert.equal(whites, 8, `${chord.symbol} ${inv.label}`);
    assert.ok(start <= Math.min(...inv.midi) && end >= Math.max(...inv.midi));
  }
  assert.ok(makeChord("C", "major"));
});

test("fitWindow never ends on a black key", async () => {
  const { fitWindow, isBlackKey } = await import("../src/lib/keyboard-layout.ts");
  const w = fitWindow([66, 68, 69, 71, 73, 74, 76, 78]); // F♯ minor scale, F♯4 to F♯5
  assert.ok(!isBlackKey(w.end) && w.end >= 78 && w.start === 65);
});
