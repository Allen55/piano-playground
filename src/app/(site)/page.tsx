import Link from "next/link";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { keyName } from "@/lib/keys";
import { allKeys, chordAltText, chordPages, chordSlug, inversions, keySlug, LAUNCH_QUALITIES } from "@/lib/reference";
import { makeChord } from "@/lib/music";
import { SITE_NAME } from "@/lib/site";

const POPULAR = [["C", "major"], ["G", "major"], ["D", "major"], ["A", "major"], ["E", "major"], ["F", "major"], ["A", "minor"], ["E", "minor"], ["D", "minor"]] as const;

export default function HomePage() {
  const chords = chordPages(LAUNCH_QUALITIES);
  const bySlug = new Map(chords.map(c => [chordSlug(c), c]));
  const demo = makeChord("C", "major");
  const demoInv = inversions(demo)[0];
  return (
    <>
      <h1>{SITE_NAME}: piano chords, keys and scales</h1>
      <p className="lede">Start with a key to see its scale and chords, or look up any chord and see it on a keyboard in every inversion.</p>
      <div className="panel-box" style={{ marginTop: 18 }}>
        <KeyboardSvg label={chordAltText(demo, demoInv)} notes={demoInv.midi.map((midi, n) => ({ midi, role: demoInv.roles[n], label: demoInv.names[n] }))} />
        <p className="inv-notes">C major: C – E – G. <Link href="/chords/c-major/">See C major and its inversions</Link></p>
      </div>

      <h2>Start with a key</h2>
      <p>Each key page lists the scale, the seven chords in the key and every inversion of each chord. <Link href="/keys/">All 24 keys</Link></p>
      <div className="chord-grid">{allKeys().map(k => <Link key={keySlug(k)} href={`/keys/${keySlug(k)}/`}>{keyName(k)}</Link>)}</div>

      <h2>Common chords</h2>
      <div className="chord-grid">
        {POPULAR.map(([root, quality]) => {
          const chord = chordPages([quality]).find(c => c.root === root)!;
          return <Link key={chordSlug(chord)} href={`/chords/${chordSlug(chord)}/`}>{chord.symbol}</Link>;
        })}
      </div>
      <p style={{ marginTop: 12 }}><Link href="/chords/">Full chord chart with inversions</Link>, covering all {bySlug.size} major, minor, diminished, augmented and suspended chords.</p>

      <h2>Chord progressions</h2>
      <p>See a progression such as I-V-vi-IV laid out chord by chord in any key, with inversions. <Link href="/progressions/">All progressions</Link> or <Link href="/progressions/builder/">build your own</Link>.</p>

      <h2>Practice in the Studio</h2>
      <p>Build a progression, hear it with voice-leading between chords and see each voicing on the keys. <Link href="/studio/">Open the Studio</Link></p>
    </>
  );
}
