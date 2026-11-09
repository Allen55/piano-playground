import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { ProgressionStrip } from "@/components/progression-strip";
import { CHORDS } from "@/lib/music";
import { SITE_URL } from "@/lib/site";
import { PROGRESSIONS, STYLES, defaultTonic, distinctSteps, getProgression, keysFor, outsideNotes, progressionChords, type Progression } from "@/lib/progressions";
import { chordHref } from "@/lib/reference";

export const dynamicParams = false;
export function generateStaticParams() { return PROGRESSIONS.map(p => ({ slug: p.slug })); }

function lookup(slug: string) {
  const progression = getProgression(slug);
  if (!progression) notFound();
  return progression;
}

const ROLES: Record<string, string> = { "1": "tonic", "2": "supertonic", "3": "mediant", "4": "subdominant", "5": "dominant", "6": "submediant", "7": "leading tone or subtonic" };

/** Name inside a sentence: "the minor ii-V-i", but numerals keep their case ("the I-V-vi-IV"). */
const proseName = (p: Progression) => p.name.replace(/^([A-Z])(?=[a-z])/, c => c.toLowerCase());

/** "C, G, Am, F" for short loops; the distinct chords ("C7, F7 and G7") for 12-bar forms. */
function chordList(p: Progression, tonic: string): string {
  const chords = progressionChords(p, tonic);
  if (!p.barsPerRow) return chords.map(c => c.symbol).join(", ");
  const names = distinctSteps(p).map(s => chords[s.index].symbol);
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = lookup((await params).slug);
  const tonic = defaultTonic(p.mode);
  return {
    metadataBase: new URL(SITE_URL),
    title: `${p.name} Chord Progression on Piano`,
    description: `The ${proseName(p)} progression in ${tonic} ${p.mode} uses ${chordList(p, tonic)}. See every chord on a keyboard in all 12 keys, with inversions and voice leading.`,
    alternates: { canonical: `/progressions/${p.slug}/` },
  };
}

export default async function ProgressionPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = lookup((await params).slug);
  const tonic = defaultTonic(p.mode);
  const base = progressionChords(p, tonic);
  const columns = distinctSteps(p);
  const rows = keysFor(p).map(k => ({ tonic: k, chords: progressionChords(p, k) }));
  const style = STYLES.find(s => s.id === p.style)!;
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/progressions/">Progressions</Link> / {p.name}</p>
      <h1>{p.name} chord progression on piano</h1>
      <p className="lede">
        {p.barsPerRow
          ? <>The {proseName(p)} is {p.degrees.length} bars long, one chord per bar: {p.numerals.join(" – ")}. In {tonic} {p.mode} it uses {chordList(p, tonic)}.</>
          : <>The {proseName(p)} progression is {p.numerals.join(" – ")}, the chords on scale degrees {p.degrees.join(", ")} of a {p.mode} key. In {tonic} {p.mode} that is {chordList(p, tonic)}.</>}
      </p>
      {p.about && <p>{p.about}</p>}
      <ProgressionStrip slug={p.slug} />

      <AdSlot />

      <h2>What each chord is</h2>
      <ul>
        {columns.map(({ numeral, index }) => {
          const chord = base[index];
          const outside = outsideNotes(chord, tonic, p.mode);
          return (
            <li key={numeral}>
              <strong>{numeral}</strong>: {CHORDS[chord.quality].name.toLowerCase()} chord on the {ROLES[String(p.degrees[index])]} (scale degree {p.degrees[index]}). In {tonic} {p.mode}: {chord.symbol}, notes {chord.notes.join(" ")}.
              {outside.length > 0 && ` ${outside.join(" and ")} ${outside.length === 1 ? "is" : "are"} not in the ${tonic} ${p.mode === "major" ? "major" : "natural minor"} scale.`}
            </li>
          );
        })}
      </ul>

      <h2>{p.name} in all 12 {p.mode} keys</h2>
      <table className="data-table">
        <thead><tr><th>Key</th>{columns.map(c => <th key={c.numeral}>{c.numeral}</th>)}</tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.tonic}>
              <td>{r.tonic} {p.mode}</td>
              {columns.map(({ numeral, index }) => {
                const c = r.chords[index];
                const href = chordHref(c);
                return <td key={numeral}>{href ? <Link href={href}>{c.symbol}</Link> : c.symbol}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p>More {style.label.toLowerCase()} progressions: {PROGRESSIONS.filter(x => x.style === p.style && x.slug !== p.slug).map((x, i, all) => (
        <span key={x.slug}><Link href={`/progressions/${x.slug}/`}>{x.name}</Link>{i < all.length - 1 ? ", " : "."}</span>
      ))}</p>
    </>
  );
}
