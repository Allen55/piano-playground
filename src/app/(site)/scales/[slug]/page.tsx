import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { musicFont } from "@/components/music-font";
import { ScalePlayer } from "@/components/scale-player";
import { ScaleStaff } from "@/components/scale-staff";
import { fitWindow } from "@/lib/keyboard-layout";
import { midiOf } from "@/lib/notation";
import { chordHref } from "@/lib/reference";
import {
  CANONICAL_ALIAS, FAMILIES, SCALES, alternateTonic, intervalFromRoot, modesOf, parentScale, parseScaleSlug, scaleChords,
  scaleHref, scalePageFor, scalePages, scalePitches, scaleSlug, scaleSpelling, scaleTitle, stepPattern, type ScalePage,
} from "@/lib/scales";
import { SITE_URL } from "@/lib/site";
import type { Chord } from "@/lib/music";

export const dynamicParams = false;
export function generateStaticParams() { return scalePages().map(p => ({ slug: scaleSlug(p) })); }

function lookup(slug: string): ScalePage {
  const page = parseScaleSlug(slug);
  if (!page) notFound();
  return page;
}

/** Aeolian pages share their notes with natural minor; the natural minor page is the canonical one. */
function canonicalPath(page: ScalePage): string {
  const alias = CANONICAL_ALIAS[page.scale.id];
  return alias ? scaleHref(scalePageFor(page.tonic, alias)) : scaleHref(page);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = lookup((await params).slug);
  const notes = scaleSpelling(page.tonic, page.scale);
  return {
    metadataBase: new URL(SITE_URL),
    title: `${scaleTitle(page)} Scale on Piano: Notes, Staff & Chords`,
    description: `The ${scaleTitle(page)} scale has the notes ${notes.join(", ")} (formula ${page.scale.formula}). See it on the staff and the piano keyboard, and hear it played.`,
    alternates: { canonical: canonicalPath(page) },
  };
}

const chordLink = (chord: Chord | undefined) => {
  if (!chord) return "—";
  const href = chordHref(chord);
  return href ? <Link href={href}>{chord.symbol}</Link> : chord.symbol;
};

export default async function ScalePageView({ params }: { params: Promise<{ slug: string }> }) {
  const page = lookup((await params).slug);
  const { scale, tonic } = page;
  const title = scaleTitle(page);
  const notes = scaleSpelling(tonic, scale);
  const treble = scalePitches(tonic, scale);
  const bass = scalePitches(tonic, scale, treble[0].octave - 1);
  const midi = treble.map(midiOf);
  const degrees = [...scale.steps.map(s => s.label), "8"];
  const pattern = stepPattern(scale);
  const chords = scaleChords(tonic, scale);
  const parent = parentScale(page);
  const modes = parent ? modesOf(parent) : scale.id === "major" || scale.id === "melodic-minor" ? modesOf(page) : [];
  const alternate = alternateTonic(tonic, scale);
  const range = fitWindow(midi, 9);
  const family = FAMILIES.find(f => f.id === scale.family)!;
  const noteList = [...notes, tonic].join(", ");
  return (
    <div className={musicFont.variable}>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/scales/">Scales</Link> / {title}</p>
      <h1>{title} scale</h1>
      <p className="lede">The {title} scale has the notes {notes.join(", ")}. {scale.about}</p>
      <dl className="facts">
        <div className="fact"><dt>Notes</dt><dd style={{ fontSize: 15 }}>{notes.join(" ")}</dd></div>
        <div className="fact"><dt>Formula</dt><dd style={{ fontSize: 15 }}>{scale.formula}</dd></div>
        <div className="fact"><dt>Type</dt><dd style={{ fontSize: 15 }}><Link href={`/scales/#${family.id}`}>{family.name}</Link></dd></div>
        <div className="fact"><dt>Steps</dt><dd style={{ fontSize: 15 }}>{pattern.join(" ")}</dd></div>
        {scale.aka && <div className="fact"><dt>Also called</dt><dd style={{ fontSize: 15 }}>{scale.aka.join(", ")}</dd></div>}
        {parent && <div className="fact"><dt>Same notes as</dt><dd style={{ fontSize: 15 }}><Link href={scaleHref(parent)}>{scaleTitle(parent)}</Link></dd></div>}
      </dl>
      {alternate && <p>Also written as <strong>{alternate} {scale.name.toLowerCase()}</strong> ({scaleSpelling(alternate, scale).join(" ")}): the same keys with different note names.</p>}

      <h2>{title} scale on the staff</h2>
      <p>One octave going up, treble clef for the right hand and bass clef for the left. Numbers under each note are the scale degrees compared with the major scale.</p>
      <div className="staff-paper">
        <ScaleStaff clef="treble" pitches={treble} degrees={degrees} label={`${title} scale in treble clef: ${noteList}`} />
        <ScaleStaff clef="bass" pitches={bass} degrees={degrees} label={`${title} scale in bass clef: ${noteList}`} />
      </div>

      <h2>{title} scale on the piano</h2>
      <p>Step pattern: {pattern.map(p => ({ H: "half", W: "whole", "W+H": "step and a half", "2W": "two whole steps" }[p] ?? p)).join(", ")}. H is a half step (next key), W a whole step (two keys).</p>
      <div className="panel-box">
        <KeyboardSvg start={range.start} end={range.end} label={`${title} scale on a piano keyboard: ${noteList}`}
          notes={midi.map((m, i) => ({ midi: m, role: i === 0 || i === midi.length - 1 ? "root" : "fifth", label: [...notes, tonic][i] }))} />
        <ScalePlayer midi={midi} />
      </div>

      <h2>Notes and intervals</h2>
      <table className="data-table">
        <thead><tr><th>Degree</th><th>Note</th><th>Interval from {tonic}</th></tr></thead>
        <tbody>
          {scale.steps.map((s, i) => <tr key={i}><td>{s.label}</td><td>{notes[i]}</td><td>{intervalFromRoot(s.label)}</td></tr>)}
        </tbody>
      </table>

      <AdSlot />

      {chords.length > 0 && <>
        <h2>Chords in the {title} scale</h2>
        <p>Stacking every other note of the scale on each degree gives these triads and seventh chords.</p>
        <table className="data-table">
          <thead><tr><th>Degree</th><th>Triad</th><th>Seventh chord</th><th>Notes</th></tr></thead>
          <tbody>
            {chords.map(c => (
              <tr key={c.numeral}>
                <td>{c.numeral}</td><td>{chordLink(c.triad)}</td><td>{chordLink(c.seventh)}</td>
                <td>{(c.seventh ?? c.triad)?.notes.join(" ") ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>}

      {modes.length > 0 && <>
        <h2>Modes of {scaleTitle(parent ?? page)}</h2>
        <p>Each mode uses the notes of {scaleTitle(parent ?? page)}, starting from a different degree.</p>
        <ul className="chip-list">
          {modes.map(m => <li key={scaleSlug(m)}>{scaleSlug(m) === scaleSlug(page) ? <span className="chip chip-current">{scaleTitle(m)}</span> : <Link className="chip" href={scaleHref(m)}>{scaleTitle(m)}</Link>}</li>)}
        </ul>
      </>}

      <h2>{scale.name} scale in every key</h2>
      <ul className="chip-list">
        {scalePages().filter(p => p.scale.id === scale.id).map(p => (
          <li key={p.tonic}>{p.tonic === tonic ? <span className="chip chip-current">{scaleTitle(p)}</span> : <Link className="chip" href={scaleHref(p)}>{scaleTitle(p)}</Link>}</li>
        ))}
      </ul>

      <h2>Other scales starting on {tonic}</h2>
      {FAMILIES.map(f => (
        <div key={f.id} style={{ marginBottom: 12 }}>
          <h3>{f.name}</h3>
          <ul className="chip-list">
            {SCALES.filter(s => s.family === f.id && s.id !== scale.id).map(s => {
              const other = scalePageFor(tonic, s.id);
              return <li key={s.id}><Link className="chip" href={scaleHref(other)}>{scaleTitle(other)}</Link></li>;
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
