import { test } from "node:test";
import assert from "node:assert/strict";
import { SALAMANDER_URLS, SAMPLE_BASE_URL } from "../src/lib/samples.ts";

test("salamander sample map covers A0 to C8 with sharps encoded as s", () => {
  const keys = Object.keys(SALAMANDER_URLS);
  assert.equal(keys.length, 30);
  assert.equal(SALAMANDER_URLS["D#4"], "Ds4.mp3");
  assert.equal(SALAMANDER_URLS.C8, "C8.mp3");
  assert.ok(keys.includes("A0") && keys.includes("F#7"));
  assert.ok(Object.values(SALAMANDER_URLS).every(f => /^[A-G]s?[0-8]\.mp3$/.test(f)));
  assert.ok(SAMPLE_BASE_URL.endsWith("/"));
});
