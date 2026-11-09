import Link from "next/link";
import { allKeys, chordPages, chordSlug, keySlug, LAUNCH_QUALITIES } from "@/lib/reference";
import { keyName } from "@/lib/keys";
import { SITE_NAME } from "@/lib/site";

export default function HomePage() {
  const chords = chordPages(LAUNCH_QUALITIES);
  return (
    <>
      <h1>{SITE_NAME}: piano chords, keys and scales</h1>
      <p className="lede">Notes, inversions and keyboard diagrams for every major and minor triad.</p>
      <h2>Major and minor chords</h2>
      <div className="chord-grid">{chords.map(c => <Link key={chordSlug(c)} href={`/chords/${chordSlug(c)}/`}>{c.symbol}</Link>)}</div>
      <h2>Keys</h2>
      <div className="chord-grid">{allKeys().map(k => <Link key={keySlug(k)} href={`/keys/${keySlug(k)}/`}>{keyName(k)}</Link>)}</div>
    </>
  );
}
