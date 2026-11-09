import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChordExplorer } from "@/components/chord-explorer";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { CHORDS, type Chord } from "@/lib/music";
import { SITE_URL } from "@/lib/site";
import { chordAltText, chordPages, chordSlug, enharmonicAlias, inversions, isLaunchChord, keysContaining, LAUNCH_QUALITIES, pageChordFor, parseChordSlug, relatedChords } from "@/lib/reference";

export const dynamicParams = false;
export function generateStaticParams() { return chordPages(LAUNCH_QUALITIES).map(c => ({ slug: chordSlug(c) })); }

function lookup(slug: string): Chord {
  const chord = parseChordSlug(slug);
  if (!chord || !isLaunchChord(chord)) notFound();
  return chord;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const chord = lookup((await params).slug);
  const title = `${chord.fullName} Chord on Piano: Notes & Inversions`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: `${chord.fullName} (${chord.symbol}) contains the notes ${chord.notes.join(", ")}. See it on a piano keyboard in root position and every inversion.`,
    alternates: { canonical: `/chords/${chordSlug(chord)}/` },
  };
}

const THIRDS: Record<number, string> = { 3: "minor third", 4: "major third" };
function stackedIntervals(chord: Chord): string {
  const steps = chord.intervals.slice(1).map((v, i) => v - chord.intervals[i]);
  return steps.map(s => THIRDS[s] ?? `${s} semitones`).join(" + ");
}

export default async function ChordPage({ params }: { params: Promise<{ slug: string }> }) {
  const chord = lookup((await params).slug);
  const invs = inversions(chord);
  const alias = enharmonicAlias(chord);
  const keys = keysContaining(chord).filter(k => !k.sevenths);
  const related = relatedChords(chord);
  const explorer = invs.map(i => ({ label: i.label, names: i.names, roles: i.roles, midi: i.midi, bass: i.bass, alt: chordAltText(chord, i) }));
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/chords/">Chords</Link> / {chord.symbol}</p>
      <h1>{chord.fullName} chord</h1>
      <p className="lede">The {chord.fullName} chord ({chord.symbol}) has the notes {chord.notes.join(", ")}.{alias ? ` It is also written ${alias}${CHORDS[chord.quality].suffix ? "" : " major"}.` : ""}</p>
      <dl className="facts">
        <div className="fact"><dt>Notes</dt><dd>{chord.notes.join(" ")}</dd></div>
        <div className="fact"><dt>Formula</dt><dd>{chord.formula.join(" ")}</dd></div>
        <div className="fact"><dt>Intervals</dt><dd style={{ fontSize: 15 }}>{stackedIntervals(chord)}</dd></div>
        <div className="fact"><dt>Symbol</dt><dd>{chord.symbol}</dd></div>
      </dl>
      <ChordExplorer symbol={chord.symbol} inversions={explorer} />

      <h2>{chord.symbol} inversions</h2>
      <p>An inversion changes which chord tone is the lowest note. {chord.symbol} has {invs.length} positions: the notes stay the same, only the bass changes.</p>
      <div className="inv-grid">
        {invs.map(i => (
          <div className="inv-card" key={i.label}>
            <h3>{i.label}</h3>
            <KeyboardSvg label={chordAltText(chord, i)} notes={i.midi.map((midi, n) => ({ midi, role: i.roles[n], label: i.names[n] }))} />
            <p>{i.names.join(" – ")}. Lowest note: {i.bass}.</p>
          </div>
        ))}
      </div>

      <h2>Keys that contain {chord.symbol}</h2>
      <p>{chord.symbol} is a diatonic triad in these keys, shown with its Roman numeral.</p>
      <table className="data-table">
        <thead><tr><th>Key</th><th>Numeral</th></tr></thead>
        <tbody>{keys.map(k => <tr key={`${k.tonic}${k.mode}`}><td>{k.tonic} {k.mode}</td><td>{k.numeral}</td></tr>)}</tbody>
      </table>

      <h2>Related chords</h2>
      <ul className="chip-list">
        {related.map(r => {
          const target = pageChordFor(r.chord);
          return (
            <li key={r.relation} className="chip">
              {r.relation}: {isLaunchChord(target) ? <Link href={`/chords/${chordSlug(target)}/`}>{target.symbol}</Link> : r.chord.symbol}
            </li>
          );
        })}
      </ul>
    </>
  );
}
