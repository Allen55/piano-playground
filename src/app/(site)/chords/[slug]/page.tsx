import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChordExplorer } from "@/components/chord-explorer";
import { AdSlot } from "@/components/ad-slot";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { CHORDS, makeChord, spell, type Chord } from "@/lib/music";
import { keyName } from "@/lib/keys";
import { SITE_URL } from "@/lib/site";
import { STEP_NAMES, chordAltText, chordPages, chordSlug, enharmonicAlias, harmonicMinorHome, inversions, isLaunchChord, keySlug, keyboardName, keysContaining, keysWithAllNotes, LAUNCH_QUALITIES, pageChordFor, parseChordSlug, relatedChords, symbolAliases, type RelatedChord } from "@/lib/reference";

export const dynamicParams = false;
export function generateStaticParams() { return chordPages(LAUNCH_QUALITIES).map(c => ({ slug: chordSlug(c) })); }

function lookup(slug: string): Chord {
  const chord = parseChordSlug(slug);
  if (!chord || !isLaunchChord(chord)) notFound();
  return chord;
}

const isSus = (chord: Chord) => chord.quality === "sus2" || chord.quality === "sus4";
/** Prose name: "C major", "C diminished", "C suspended second". */
const longName = (chord: Chord) => `${chord.root} ${CHORDS[chord.quality].name.toLowerCase()}`;
/** Heading name: sus chords are searched by symbol (Csus4), the rest by name (C Diminished). */
const headName = (chord: Chord) => (isSus(chord) ? chord.symbol : chord.fullName);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const chord = lookup((await params).slug);
  const title = `${headName(chord)} Chord on Piano: Notes & Inversions`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: `The ${longName(chord)} chord (${chord.symbol}) contains the notes ${chord.notes.join(", ")}. See it on a piano keyboard in root position and every inversion.`,
    alternates: { canonical: `/chords/${chordSlug(chord)}/` },
  };
}

/** "F♭ (the E key)" for theory spellings that land on another key, otherwise just the note. */
const withKey = (note: string) => { const k = keyboardName(note); return k ? `${note} (the ${k} key)` : note; };

function stackedIntervals(chord: Chord): string {
  const steps = chord.intervals.slice(1).map((v, i) => v - chord.intervals[i]);
  return steps.map(s => STEP_NAMES[s] ?? `${s} semitones`).join(" + ");
}

/** A short, factual description of how this chord type is built and how it relates to its neighbours. */
function buildNotes(chord: Chord, related: RelatedChord[]): string[] {
  const [root, middle, top] = chord.notes;
  const major = makeChord(root, "major");
  const minor = makeChord(root, "minor");
  const same = related.filter(r => r.relation === "Same notes").map(r => pageChordFor(r.chord).symbol);
  const lines = [`${chord.symbol} stacks a ${stackedIntervals(chord)} on ${root}.`];
  switch (chord.quality) {
    case "major": lines.push(`Lower the third, ${withKey(middle)}, by a half step to ${withKey(minor.notes[1])} and you get ${minor.symbol}.`); break;
    case "minor": lines.push(`Raise the third, ${withKey(middle)}, by a half step to ${withKey(major.notes[1])} and you get ${major.symbol}.`); break;
    case "diminished":
      lines.push(`The outer interval, ${root} up to ${withKey(top)}, is a diminished fifth (6 semitones), a half step smaller than the perfect fifth in ${minor.symbol} (${minor.notes.join(", ")}).`);
      break;
    case "augmented":
      lines.push(`Its fifth, ${withKey(top)}, is a half step higher than the fifth of ${major.symbol} (${withKey(major.notes[2])}).`);
      lines.push(`Two major thirds split the octave into three equal parts, so ${chord.symbol}, ${same.join(" and ")} are played on the same three keys.`);
      break;
    case "sus2":
      lines.push(`The third is replaced by the second, ${withKey(middle)}, so the chord is neither major nor minor. Move ${withKey(middle)} up to ${withKey(major.notes[1])} for ${major.symbol} or to ${withKey(minor.notes[1])} for ${minor.symbol}.`);
      if (same.length) lines.push(`${chord.symbol} uses the same notes as ${same[0]}.`);
      break;
    case "sus4":
      lines.push(`The third is replaced by the fourth, ${withKey(middle)}, so the chord is neither major nor minor. Move ${withKey(middle)} down to ${withKey(major.notes[1])} for ${major.symbol} or to ${withKey(minor.notes[1])} for ${minor.symbol}; resolving ${chord.symbol} to ${major.symbol} this way is common.`);
      if (same.length) lines.push(`${chord.symbol} uses the same notes as ${same[0]}.`);
      break;
  }
  lines.push("An inversion changes which note is in the bass, not the name of the chord.");
  return lines;
}

function inversionNote(chord: Chord, related: RelatedChord[]): string | undefined {
  const same = related.filter(r => r.relation === "Same notes").map(r => pageChordFor(r.chord));
  const invs = inversions(chord);
  if (chord.quality === "augmented") return `Because the notes are evenly spaced, every inversion of ${chord.symbol} has the same shape under the hand: the 1st inversion is played on the same keys as ${same[0].symbol} and the 2nd inversion on the same keys as ${same[1].symbol}.`;
  if (chord.quality === "sus2" && same[0]) return `The 2nd inversion (${invs[2].names.join(", ")}) is ${same[0].symbol} in root position.`;
  if (chord.quality === "sus4" && same[0]) return `The 1st inversion (${invs[1].names.join(", ")}) is ${same[0].symbol} in root position.`;
  return undefined;
}

function KeysSection({ chord }: { chord: Chord }) {
  const keys = keysContaining(chord).filter(k => !k.sevenths);
  if (keys.length) {
    const resolve = chord.quality === "diminished" ? makeChord(spell(chord.root, 2, 1), "major") : undefined;
    return (
      <>
        <h2>Keys that contain {chord.symbol}</h2>
        <p>{chord.symbol} is a diatonic triad in these keys, shown with its Roman numeral.{resolve ? ` As vii° in a major key it usually leads to ${resolve.symbol}, a half step above its root.` : ""}</p>
        <table className="data-table">
          <thead><tr><th>Key</th><th>Numeral</th></tr></thead>
          <tbody>{keys.map(k => <tr key={`${k.tonic}${k.mode}`}><td><Link href={`/keys/${keySlug(k)}/`}>{keyName(k)}</Link></td><td>{k.numeral}</td></tr>)}</tbody>
        </table>
      </>
    );
  }
  if (chord.quality === "augmented") {
    const home = harmonicMinorHome(chord);
    const major = makeChord(chord.root, "major");
    const four = makeChord(spell(chord.root, 4, 5), "major");
    return (
      <>
        <h2>Where {chord.symbol} comes from</h2>
        <p>{chord.symbol} is not one of the seven triads of any major or natural minor key. Its raised fifth comes from the harmonic minor scale, where it is the III+ chord: {chord.symbol} is III+ in {home} harmonic minor.</p>
        <p>It is also used as a passing chord. In {major.symbol} – {chord.symbol} – {four.symbol}, the fifth {major.notes[2]} rises to {withKey(chord.notes[2])} and then to {four.notes[1]}.</p>
      </>
    );
  }
  const fits = keysWithAllNotes(chord);
  return (
    <>
      <h2>Keys where {chord.symbol} fits</h2>
      <p>{chord.symbol} is not one of a key&apos;s seven standard triads, but every one of its notes is in the scale of these keys:</p>
      <table className="data-table">
        <thead><tr><th>Key</th><th>In the key</th></tr></thead>
        <tbody>{fits.map(k => <tr key={`${k.tonic}${k.mode}`}><td><Link href={`/keys/${keySlug(k)}/`}>{keyName(k)}</Link></td><td>{k.numeral}</td></tr>)}</tbody>
      </table>
    </>
  );
}

export default async function ChordPage({ params }: { params: Promise<{ slug: string }> }) {
  const chord = lookup((await params).slug);
  const invs = inversions(chord);
  const alias = enharmonicAlias(chord);
  const aliases = [...symbolAliases(chord).slice(1), ...(alias ? [alias] : [])];
  const related = relatedChords(chord);
  const respelled = chord.notes.flatMap(n => { const k = keyboardName(n); return k ? [`${n} is the ${k} key`] : []; });
  const invNote = inversionNote(chord, related);
  const explorer = invs.map(i => ({ label: i.label, names: i.names, roles: i.roles, midi: i.midi, bass: i.bass, alt: chordAltText(chord, i) }));
  return (
    <>
      <p className="crumbs"><Link href="/">Home</Link> / <Link href="/chords/">Chords</Link> / {chord.symbol}</p>
      <h1>{headName(chord)} chord</h1>
      <p className="lede">The {longName(chord)} chord ({chord.symbol}) has the notes {chord.notes.join(", ")}.{respelled.length ? ` On the keyboard, ${respelled.join(" and ")}.` : ""}</p>
      <dl className="facts">
        <div className="fact"><dt>Notes</dt><dd>{chord.notes.join(" ")}</dd></div>
        <div className="fact"><dt>Formula</dt><dd>{chord.formula.join(" ")}</dd></div>
        <div className="fact"><dt>Intervals</dt><dd style={{ fontSize: 15 }}>{stackedIntervals(chord)}</dd></div>
        <div className="fact"><dt>Symbol</dt><dd>{chord.symbol}</dd></div>
        {aliases.length > 0 && <div className="fact"><dt>Also written</dt><dd style={{ fontSize: 15 }}>{aliases.join(", ")}</dd></div>}
      </dl>
      <ChordExplorer symbol={chord.symbol} inversions={explorer} />

      <h2>{chord.symbol} inversions</h2>
      <p>An inversion changes which chord tone is the lowest note. {chord.symbol} has {invs.length} positions: the notes stay the same, only the bass changes.{invNote ? ` ${invNote}` : ""}</p>
      <div className="inv-grid">
        {invs.map(i => (
          <div className="inv-card" key={i.label}>
            <h3>{i.label}</h3>
            <KeyboardSvg label={chordAltText(chord, i)} notes={i.midi.map((midi, n) => ({ midi, role: i.roles[n], label: i.names[n] }))} />
            <p>{i.names.join(" – ")}. Lowest note: {i.bass}.</p>
          </div>
        ))}
      </div>

      <AdSlot />

      <KeysSection chord={chord} />

      <h2>Related chords</h2>
      <ul className="chip-list">
        {related.map((r, n) => {
          const target = pageChordFor(r.chord);
          return (
            <li key={n} className="chip">
              {r.relation}: {isLaunchChord(target) ? <Link href={`/chords/${chordSlug(target)}/`}>{target.symbol}</Link> : r.chord.symbol}
            </li>
          );
        })}
      </ul>

      <h2>How {chord.symbol} is built</h2>
      {buildNotes(chord, related).map((line, n) => <p key={n}>{line}</p>)}
    </>
  );
}
