import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { diatonicChords, keyInfo, type Mode } from "@/lib/music";
import { SITE_URL } from "@/lib/site";
import { allKeys, chordAltText, chordSlug, inversions, isLaunchChord, keySlug, pageChordFor, parseKeySlug } from "@/lib/reference";
import { keyName, parallelKey, relativeKey, scaleMidi } from "@/lib/keys";

export const dynamicParams = false;
export function generateStaticParams() { return allKeys().map(k => ({ slug: keySlug(k) })); }

const STEPS: Record<Mode, string> = { major: "whole, whole, half, whole, whole, whole, half", minor: "whole, half, whole, whole, half, whole, whole" };

function lookup(slug: string) {
  const key = parseKeySlug(slug);
  if (!key) notFound();
  return key;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const key = lookup((await params).slug);
  const info = keyInfo(key.tonic, key.mode);
  return {
    metadataBase: new URL(SITE_URL),
    title: `${keyName(key)[0].toUpperCase()}${keyName(key).slice(1)}: Scale, Chords & Inversions on Piano`,
    description: `The ${keyName(key)} scale has the notes ${info.notes.join(", ")}. See its seven chords and their inversions on a piano keyboard.`,
    alternates: { canonical: `/keys/${keySlug(key)}/` },
  };
}

export default async function KeyPage({ params }: { params: Promise<{ slug: string }> }) {
  const key = lookup((await params).slug);
  const info = keyInfo(key.tonic, key.mode);
  const triads = diatonicChords(key.tonic, key.mode, false);
  const sevenths = diatonicChords(key.tonic, key.mode, true);
  const relative = relativeKey(key);
  const parallel = parallelKey(key);
  const scale = scaleMidi(info.notes);
  const keyLink = (k: typeof key) => <Link href={`/keys/${keySlug(k)}/`}>{keyName(k)}</Link>;
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/keys/">Keys</Link> / {keyName(key)}</p>
      <h1>{keyName(key)} key</h1>
      <p className="lede">The {keyName(key)} scale has the notes {info.notes.join(", ")}. Key signature: {info.signature}.</p>
      <dl className="facts">
        <div className="fact"><dt>Scale</dt><dd style={{ fontSize: 15 }}>{info.notes.join(" ")}</dd></div>
        <div className="fact"><dt>Signature</dt><dd style={{ fontSize: 15 }}>{info.signature}</dd></div>
        <div className="fact"><dt>Relative key</dt><dd style={{ fontSize: 15 }}>{keyLink(relative)}</dd></div>
        {parallel && <div className="fact"><dt>Parallel key</dt><dd style={{ fontSize: 15 }}>{keyLink(parallel)}</dd></div>}
      </dl>

      <h2>{keyName(key)} scale on the piano</h2>
      <p>Step pattern: {STEPS[key.mode]}. Starting on {key.tonic}, the scale returns to {key.tonic} one octave higher.</p>
      <div className="panel-box">
        <KeyboardSvg label={`${keyName(key)} scale on a piano keyboard: ${info.notes.join(", ")}, ${key.tonic}`} notes={scale.map((midi, i) => ({ midi, role: i === 0 || i === 7 ? "root" : "fifth", label: [...info.notes, key.tonic][i] }))} />
      </div>

      <h2>Chords in {keyName(key)}</h2>
      <p>Each note of the scale builds one triad using only notes from the key. The Roman numeral shows the scale degree; capitals are major, lowercase are minor or diminished.</p>
      <table className="data-table">
        <thead><tr><th>Degree</th><th>Chord</th><th>Notes</th><th>Seventh chord</th></tr></thead>
        <tbody>
          {triads.map((t, i) => {
            const page = pageChordFor(t.chord);
            return (
              <tr key={t.numeral}>
                <td>{t.numeral}</td>
                <td>{isLaunchChord(page) ? <Link href={`/chords/${chordSlug(page)}/`}>{t.chord.symbol}</Link> : t.chord.symbol}</td>
                <td>{t.chord.notes.join(" ")}</td>
                <td>{sevenths[i].chord.symbol} ({sevenths[i].chord.notes.join(" ")})</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>All chords in {keyName(key)} with inversions</h2>
      <p>Every triad in the key in root position and each inversion.</p>
      {triads.map(t => (
        <section key={t.numeral} style={{ marginTop: 22 }}>
          <h3>{t.numeral}: {t.chord.fullName}</h3>
          <div className="inv-grid">
            {inversions(t.chord).map(i => (
              <div className="inv-card" key={i.label}>
                <KeyboardSvg label={chordAltText(t.chord, i)} notes={i.midi.map((midi, n) => ({ midi, role: i.roles[n], label: i.names[n] }))} />
                <p>{i.label}: {i.names.join(" – ")}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
