import { PROGRESSIONS } from "./progressions.ts";
import { allKeys, chordPages, chordSlug, keySlug, LAUNCH_QUALITIES } from "./reference.ts";
import { CANONICAL_ALIAS, scaleHref, scalePages } from "./scales.ts";

/** Every indexable path on the public site, with trailing slashes. Used by the sitemap. */
export function sitePaths(): string[] {
  return [
    "/", "/keys/", "/scales/", "/chords/", "/progressions/", "/progressions/builder/", "/practice/", "/studio/", "/about/", "/privacy/", "/contact/",
    ...allKeys().map(k => `/keys/${keySlug(k)}/`),
    ...chordPages(LAUNCH_QUALITIES).map(c => `/chords/${chordSlug(c)}/`),
    ...PROGRESSIONS.map(p => `/progressions/${p.slug}/`),
    ...scalePages().filter(p => !CANONICAL_ALIAS[p.scale.id]).map(scaleHref),
  ];
}
