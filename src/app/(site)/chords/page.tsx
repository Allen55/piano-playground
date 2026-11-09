import type { Metadata } from "next";
import Link from "next/link";
import { chordPages, chordSlug } from "@/lib/reference";

export const metadata: Metadata = { title: "Piano Chords: Major and Minor Triads", alternates: { canonical: "/chords/" } };

export default function ChordsIndex() {
  const groups = [["Major chords", "major"], ["Minor chords", "minor"]] as const;
  return (
    <>
      <h1>Piano chords</h1>
      <p className="lede">Every major and minor triad, with notes and inversions.</p>
      {groups.map(([title, quality]) => (
        <section key={quality}>
          <h2>{title}</h2>
          <div className="chord-grid">{chordPages([quality]).map(c => <Link key={chordSlug(c)} href={`/chords/${chordSlug(c)}/`}>{c.symbol}</Link>)}</div>
        </section>
      ))}
    </>
  );
}
