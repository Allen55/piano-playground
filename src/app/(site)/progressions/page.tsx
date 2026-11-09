import type { Metadata } from "next";
import Link from "next/link";
import { PROGRESSIONS, defaultTonic, progressionChords } from "@/lib/progressions";

export const metadata: Metadata = {
  title: "Piano Chord Progressions: Chords in Every Key",
  description: "Common chord progressions as Roman numerals, with the actual chords in all 12 keys, inversions and voice leading.",
  alternates: { canonical: "/progressions/" },
};

export default function ProgressionsIndex() {
  return (
    <>
      <h1>Piano chord progressions</h1>
      <p className="lede">Each progression shows its chords laid out in a row, in any key, with inversions and the notes that move between chords.</p>
      <table className="data-table">
        <thead><tr><th>Progression</th><th>Mode</th><th>Example</th></tr></thead>
        <tbody>
          {PROGRESSIONS.map(p => (
            <tr key={p.slug}>
              <td><Link href={`/progressions/${p.slug}/`}>{p.name}</Link></td>
              <td>{p.mode}</td>
              <td>{defaultTonic(p.mode)} {p.mode}: {progressionChords(p, defaultTonic(p.mode)).map(c => c.symbol).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
