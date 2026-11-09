import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: "What this site covers and how the chord and key information is generated.", alternates: { canonical: "/about/" } };

export default function AboutPage() {
  return (
    <>
      <h1>About {SITE_NAME}</h1>
      <p className="lede">{SITE_NAME} is a reference for piano chords, keys and scales, with keyboard diagrams for every chord and inversion.</p>
      <h2>What is covered</h2>
      <p>Every major, minor, diminished, augmented, sus2 and sus4 chord, the 24 major and minor keys with their scales and seven chords, and each chord in root position and every inversion. The <Link href="/studio/">Studio</Link> lets you build progressions and hear them.</p>
      <h2>How the information is produced</h2>
      <p>Note names, chord formulas, key signatures and inversions are computed from music theory rules by the site's own code, and the keyboard diagrams are drawn from the same data. This keeps every page consistent: a chord's notes on the diagram are always the notes listed in the text.</p>
      <p>Chords are spelled with one standard name per page (for example D♭ major, with C♯ major noted as another name). Inversions are shown with the chosen chord tone as the lowest note.</p>
      <h2>Sound credits</h2>
      <p>The Piano sound uses the Salamander Grand Piano by Alexander Holm, licensed under <a href="https://creativecommons.org/licenses/by/3.0/" rel="noopener noreferrer">CC BY 3.0</a> (<a href="https://sfzinstruments.github.io/pianos/salamander" rel="noopener noreferrer">source</a>). The Synth sound is generated in your browser.</p>
      <h2>Corrections</h2>
      <p>If you find a mistake, please <Link href="/contact/">get in touch</Link>.</p>
    </>
  );
}
