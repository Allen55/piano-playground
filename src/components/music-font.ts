import { Noto_Music } from "next/font/google";

// Engraving glyphs (clefs, sharps, flats, double accidentals) come from Noto Music so staves look the same everywhere.
// Pages that draw a staff add `musicFont.variable` to a wrapper; `.music-glyph` picks it up.
export const musicFont = Noto_Music({ weight: "400", subsets: ["music"], variable: "--font-music", display: "block" });
