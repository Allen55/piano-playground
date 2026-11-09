import { test } from "node:test";
import assert from "node:assert/strict";
import { sitePaths } from "../src/lib/site-paths.ts";

test("sitemap paths are unique, slashed and complete", () => {
  const paths = sitePaths();
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every(p => p.startsWith("/") && p.endsWith("/")));
  assert.equal(paths.filter(p => p.startsWith("/keys/") && p !== "/keys/").length, 24);
  assert.equal(paths.filter(p => p.startsWith("/chords/") && p !== "/chords/").length, 72);
  assert.ok(paths.includes("/progressions/builder/"));
  assert.ok(paths.includes("/chords/c-sharp-minor/") && paths.includes("/keys/f-sharp-major/"));
});
