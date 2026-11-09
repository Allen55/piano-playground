// Progression builder state: parsing typed progressions, the shareable URL, and the strip it produces.
import { CHORDS, diatonicChords, type Chord, type Quality } from "./music.ts";
import { inversions, keySlug, parseKeySlug, seventhNumeral, smoothInversions, type KeyRef } from "./reference.ts";
import type { StripStep } from "./progressions.ts";

/** "smooth" picks the closest inversion for every chord; an array fixes each chord's inversion (0 = root position). */
export type BuilderInversion = "smooth" | number[];
export type BuilderState = { key: KeyRef; degrees: number[]; sevenths: boolean; inversion: BuilderInversion };

export const MAX_CHORDS = 16;
export const DEFAULT_BUILDER: BuilderState = { key: { tonic: "C", mode: "major" }, degrees: [1, 5, 6, 4], sevenths: false, inversion: "smooth" };

const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };
const TOKEN = /^(vii|iii|vi|iv|ii|v|i|[1-7])(?:°|ø|o)?(?:maj7|m7|7)?$/i;

/** Read a typed progression such as "1-5-6-4", "1 5 6 4", "I-V-vi-IV" or "ii7 V7 Imaj7". Undefined if any token is not a scale degree. */
export function parseDegrees(text: string): number[] | undefined {
  const tokens = text.trim().split(/[\s,\-–—|]+/).filter(Boolean);
  if (!tokens.length || tokens.length > MAX_CHORDS) return undefined;
  const degrees: number[] = [];
  for (const token of tokens) {
    const match = TOKEN.exec(token);
    if (!match) return undefined;
    const head = match[1].toLowerCase();
    degrees.push(/^\d$/.test(head) ? Number(head) : ROMAN[head]);
  }
  return degrees;
}

export const formatDegrees = (degrees: number[]): string => degrees.join("-");

/** Roman numeral for a degree in a key, with the seventh-chord suffix when sevenths are on (Imaj7, ii7, V7, viiø7). */
export function builderNumeral(key: KeyRef, degree: number, sevenths: boolean): string {
  const { numeral, chord } = diatonicChords(key.tonic, key.mode, sevenths)[degree - 1];
  return sevenths ? seventhNumeral(numeral, chord.quality) : numeral;
}

export function builderChords(state: BuilderState): Chord[] {
  const chords = diatonicChords(state.key.tonic, state.key.mode, state.sevenths);
  return state.degrees.map(d => chords[d - 1].chord);
}

/** The strip: one voiced chord per degree, following the smooth path or each chord's chosen inversion. */
export function builderSteps(state: BuilderState): StripStep[] {
  const chords = builderChords(state);
  if (state.inversion === "smooth") return smoothInversions(chords);
  const fixed = state.inversion;
  return chords.map((chord, i) => {
    const all = inversions(chord);
    const inversion = all[Math.min(fixed[i] ?? 0, all.length - 1)];
    return { chord, inversion, midi: inversion.midi };
  });
}

/** The inversion index of every chord as currently shown, so switching from Smooth to per-chord keeps the picture. */
export function inversionIndexes(state: BuilderState): number[] {
  return builderSteps(state).map(s => s.inversion.index);
}

const NAMED: Record<string, number> = { root: 0, first: 1, second: 2, third: 3 };

/** Parse ?key=g-major&p=1-5-6-4&chords=sevenths&inv=smooth. Anything invalid falls back to the default. */
export function parseBuilderQuery(search: string | URLSearchParams): BuilderState {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const key = parseKeySlug(params.get("key") ?? "") ?? DEFAULT_BUILDER.key;
  const degrees = parseDegrees(params.get("p") ?? "") ?? DEFAULT_BUILDER.degrees;
  const sevenths = params.get("chords") === "sevenths";
  const inv = params.get("inv") ?? "smooth";
  let inversion: BuilderInversion = "smooth";
  if (inv in NAMED) inversion = degrees.map(() => NAMED[inv]);
  else if (/^[0-3](-[0-3])*$/.test(inv)) {
    const given = inv.split("-").map(Number);
    inversion = degrees.map((_, i) => given[i] ?? 0);
  }
  return { key, degrees, sevenths, inversion };
}

/** The query string for a state, e.g. "?key=g-major&p=1-5-6-4&inv=smooth". */
export function builderQuery(state: BuilderState): string {
  const params = new URLSearchParams({ key: keySlug(state.key), p: formatDegrees(state.degrees) });
  if (state.sevenths) params.set("chords", "sevenths");
  params.set("inv", state.inversion === "smooth" ? "smooth" : state.inversion.join("-"));
  return `?${params.toString()}`;
}

export const builderHref = (state: BuilderState): string => `/progressions/builder/${builderQuery(state)}`;
/**
 * Studio link. `qualities` overrides each chord's type for progressions the builder cannot express
 * (I7–IV7–V7 blues, minor V7), as ?q=dom7-dom7-min7.
 */
export function studioHref(state: BuilderState, qualities?: Quality[]): string {
  const q = qualities?.length ? `&q=${qualities.join("-")}` : "";
  return `/studio/${builderQuery(state)}${q}`;
}

/** Per-chord quality overrides from ?q=, only when every one is a known quality and the count matches. */
export function parseQualities(params: URLSearchParams, count: number): Quality[] | undefined {
  const q = params.get("q")?.split("-");
  if (!q || q.length !== count || !q.every(id => id in CHORDS)) return undefined;
  return q as Quality[];
}
