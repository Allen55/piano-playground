import type { Metadata } from "next";
import Link from "next/link";
import { ProgressionBuilder } from "@/components/progression-builder";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Chord Progression Builder for Piano",
  description: "Build a chord progression in any key by tapping Roman numerals or typing 1-5-6-4. See every chord on a keyboard with smooth inversions and voice leading, hear it, and share the link.",
  alternates: { canonical: "/progressions/builder/" },
};

export default function BuilderPage() {
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/progressions/">Progressions</Link> / Builder</p>
      <h1>Chord progression builder</h1>
      <p className="lede">Pick a key, then tap numerals or type a progression such as 1-5-6-4. Every chord appears on its own keyboard with the notes that move between chords. The link updates as you build, so you can bookmark or share it.</p>
      <ProgressionBuilder />
      <h2>How it works</h2>
      <ul>
        <li>Numbers 1 to 7 are the scale degrees of the key. In C major, 1-5-6-4 is C, G, Am, F.</li>
        <li>Sevenths turns every chord into its diatonic seventh chord, for example Imaj7, ii7, V7 and viiø7 in a major key.</li>
        <li>Smooth for all chooses, for each chord, the inversion closest to the one before it, so your hand moves as little as possible. Per chord lets you set each inversion yourself.</li>
        <li>Send to Studio opens the progression in the full workspace, where you can change voicings, beats and tempo.</li>
      </ul>
    </>
  );
}
