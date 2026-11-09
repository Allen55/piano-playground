import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { ProgressionStrip } from "@/components/progression-strip";
import { SITE_URL } from "@/lib/site";
import { PROGRESSIONS, defaultTonic, getProgression, keysFor, progressionChords } from "@/lib/progressions";
import { chordSlug, isLaunchChord, pageChordFor } from "@/lib/reference";

export const dynamicParams = false;
export function generateStaticParams() { return PROGRESSIONS.map(p => ({ slug: p.slug })); }

function lookup(slug: string) {
  const progression = getProgression(slug);
  if (!progression) notFound();
  return progression;
}

const ROLES: Record<string, string> = { "1": "tonic", "2": "supertonic", "3": "mediant", "4": "subdominant", "5": "dominant", "6": "submediant", "7": "leading tone or subtonic" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = lookup((await params).slug);
  const chords = progressionChords(p, defaultTonic(p.mode)).map(c => c.symbol).join(", ");
  return {
    metadataBase: new URL(SITE_URL),
    title: `${p.name} Chord Progression on Piano`,
    description: `The ${p.name} progression in ${defaultTonic(p.mode)} ${p.mode} is ${chords}. See every chord on a keyboard in all 12 keys, with inversions and voice leading.`,
    alternates: { canonical: `/progressions/${p.slug}/` },
  };
}

export default async function ProgressionPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = lookup((await params).slug);
  const tonic = defaultTonic(p.mode);
  const base = progressionChords(p, tonic);
  const rows = keysFor(p).map(k => ({ tonic: k, chords: progressionChords(p, k) }));
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/progressions/">Progressions</Link> / {p.name}</p>
      <h1>{p.name} chord progression on piano</h1>
      <p className="lede">The {p.name} progression plays the chords built on scale degrees {p.degrees.join(", ")} of a {p.mode} key. In {tonic} {p.mode} that is {base.map(c => c.symbol).join(", ")}.</p>
      <ProgressionStrip slug={p.slug} />

      <AdSlot />

      <h2>What each chord is</h2>
      <ul>
        {p.numerals.map((n, i) => <li key={i}><strong>{n}</strong>: chord on the {ROLES[String(p.degrees[i])]} (scale degree {p.degrees[i]}). In {tonic} {p.mode}: {base[i].symbol}, notes {base[i].notes.join(" ")}.</li>)}
      </ul>

      <h2>{p.name} in all 12 {p.mode} keys</h2>
      <table className="data-table">
        <thead><tr><th>Key</th>{p.numerals.map((n, i) => <th key={i}>{n}</th>)}</tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.tonic}>
              <td>{r.tonic} {p.mode}</td>
              {r.chords.map((c, i) => {
                const page = pageChordFor(c);
                return <td key={i}>{isLaunchChord(page) ? <Link href={`/chords/${chordSlug(page)}/`}>{c.symbol}</Link> : c.symbol}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
