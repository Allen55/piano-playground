import { test } from "node:test";
import assert from "node:assert/strict";
import { keyName, parallelKey, relativeKey, scaleMidi } from "../src/lib/keys.ts";

test("relative and parallel keys", () => {
  assert.equal(keyName(relativeKey({ tonic: "C", mode: "major" })), "A minor");
  assert.equal(keyName(relativeKey({ tonic: "D♯", mode: "minor" })), "F♯ major");
  assert.equal(keyName(parallelKey({ tonic: "C", mode: "major" })), "C minor");
  assert.equal(parallelKey({ tonic: "D♭", mode: "major" }), undefined);
});

test("scale midi ascends and ends on the octave", () => {
  assert.deepEqual(scaleMidi(["C", "D", "E", "F", "G", "A", "B"]), [60, 62, 64, 65, 67, 69, 71, 72]);
  assert.equal(Math.max(...scaleMidi(["B", "C♯", "D♯", "E", "F♯", "G♯", "A♯"])), 83);
});
