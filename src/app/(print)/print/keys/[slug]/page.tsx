import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { PrintSheet } from "@/components/print-controls";
import { SheetDiagram } from "@/components/sheet-diagram";
import { fitWindow } from "@/lib/keyboard-layout";
import { keyName, relativeKey, scaleMidi } from "@/lib/keys";
import { diatonicChords, keyInfo, type Chord } from "@/lib/music";
import { allKeys, inversions, keySlug, parseKeySlug, seventhNumeral } from "@/lib/reference";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() { return allKeys().map(k => ({ slug: keySlug(k) })); }

function lookup(slug: string) {
  const key = parseKeySlug(slug);
  if (!key) notFound();
  return key;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const key = lookup((await params).slug);
  return { title: `${keyName(key)} chord sheet (print)`, alternates: { canonical: `/keys/${keySlug(key)}/` } };
}

function ChordCard({ numeral, chord }: { numeral: string; chord: Chord }) {
  const invs = inversions(chord);
  return (
    <div className={`sheet-card${invs.length === 3 ? " triad" : ""}`}>
      <h3>{chord.symbol}<small>{numeral}</small></h3>
      {invs.map(inv => (
        <div key={inv.index} className={`inv-${inv.index}`}>
          <SheetDiagram chord={chord} inversion={inv} />
          <p>{inv.label}: {inv.names.join(" ")}</p>
        </div>
      ))}
    </div>
  );
}

export default async function KeySheet({ params }: { params: Promise<{ slug: string }> }) {
  const key = lookup((await params).slug);
  const info = keyInfo(key.tonic, key.mode);
  const triads = diatonicChords(key.tonic, key.mode, false);
  const sevenths = diatonicChords(key.tonic, key.mode, true);
  const scale = scaleMidi(info.notes);
  const path = `/keys/${keySlug(key)}/`;
  return (
    <PrintSheet backHref={path} backLabel={`Back to ${keyName(key)}`} inversions={["Root position", "1st inversion", "2nd inversion", "3rd (sevenths)"]}>
      <h1>{keyName(key)}: chords on piano</h1>
      <p className="sheet-sub">Scale: {info.notes.join(" ")} · Key signature: {info.signature} · Relative key: {keyName(relativeKey(key))}</p>
      <div className="sheet-scale">
        <KeyboardSvg {...fitWindow(scale)} label={`${keyName(key)} scale: ${info.notes.join(", ")}`} notes={scale.map((midi, i) => ({ midi, role: i === 0 || i === 7 ? "root" : "fifth", label: [...info.notes, key.tonic][i] }))} />
      </div>
      <h2>Triads</h2>
      <p className="sheet-sub no-3">Triads have no 3rd inversion, so they are shown in root position.</p>
      <div className="sheet-grid">{triads.map(t => <ChordCard key={t.numeral} numeral={t.numeral} chord={t.chord} />)}</div>
      <h2>Seventh chords</h2>
      <div className="sheet-grid">{sevenths.map(t => <ChordCard key={t.numeral} numeral={seventhNumeral(t.numeral, t.chord.quality)} chord={t.chord} />)}</div>
      <p className="sheet-credit">{SITE_NAME} · {new URL(path, SITE_URL).href}</p>
    </PrintSheet>
  );
}
