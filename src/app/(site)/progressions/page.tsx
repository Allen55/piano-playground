import type { Metadata } from "next";
import Link from "next/link";
import { PROGRESSIONS, STYLES, defaultTonic, distinctSteps, progressionChords } from "@/lib/progressions";

export const metadata: Metadata = {
  title: "Piano Chord Progressions: Pop, Jazz and Blues in Every Key",
  description: "Common pop, jazz and blues chord progressions as Roman numerals, with the actual chords in all 12 keys, inversions and voice leading.",
  alternates: { canonical: "/progressions/" },
};

export default function ProgressionsIndex() {
  return (
    <>
      <h1>Piano chord progressions</h1>
      <p className="lede">Each progression shows its chords laid out in a row, in any key, with inversions and the notes that move between chords.</p>
      <p>Want a different progression? <Link href="/progressions/builder/">Open the progression builder</Link> and type any sequence of scale degrees, such as 1-5-6-4, in any key.</p>
      {STYLES.map(style => (
        <section key={style.id}>
          <h2>{style.label}</h2>
          <p>{style.blurb}</p>
          <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Progression</th><th>Numerals</th><th>Example</th><th>Sounds like</th></tr></thead>
            <tbody>
              {PROGRESSIONS.filter(p => p.style === style.id).map(p => {
                const tonic = defaultTonic(p.mode);
                const chords = progressionChords(p, tonic);
                const shown = p.barsPerRow ? distinctSteps(p).map(s => chords[s.index].symbol).join(", ") : chords.map(c => c.symbol).join(", ");
                return (
                  <tr key={p.slug}>
                    <td><Link href={`/progressions/${p.slug}/`}>{p.name}</Link></td>
                    <td>{p.barsPerRow ? distinctSteps(p).map(s => s.numeral).join(", ") : p.numerals.join(" – ")}</td>
                    <td>{tonic} {p.mode}: {shown}</td>
                    <td>{p.sound}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </section>
      ))}
    </>
  );
}
