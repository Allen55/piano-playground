import { PROGRESSIONS } from "./progressions.ts";
import { allKeys, chordPages, chordSlug, keySlug, LAUNCH_QUALITIES } from "./reference.ts";

/** Every indexable path on the public site, with trailing slashes. Used by the sitemap. */
export function sitePaths(): string[] {
  return [
    "/", "/keys/", "/chords/", "/progressions/", "/studio/", "/about/", "/privacy/", "/contact/",
    ...allKeys().map(k => `/keys/${keySlug(k)}/`),
    ...chordPages(LAUNCH_QUALITIES).map(c => `/chords/${chordSlug(c)}/`),
    ...PROGRESSIONS.map(p => `/progressions/${p.slug}/`),
  ];
}
