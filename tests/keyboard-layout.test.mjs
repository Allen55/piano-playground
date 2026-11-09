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
