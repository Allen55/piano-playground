"use client";

import "./chord-map.css";
import { useState } from "react";
import Link from "next/link";
import { InstrumentToggle } from "@/components/instrument-toggle";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { playNotes } from "@/lib/audio";
import type { Chord } from "@/lib/music";
import { chordAltText, inversions } from "@/lib/reference";

export type ChordMapRow = { numeral: string; triad: Chord; seventh: Chord; triadHref?: string };

const SHORT = ["Root", "1st", "2nd", "3rd"];

// Every inversion is rendered into the HTML; CSS shows the selected one, so the content is crawlable and the toggle needs no re-render of the diagrams.
function ChordCell({ chord, href, caption }: { chord: Chord; href?: string; caption: string }) {
  const [index, setIndex] = useState(0);
  const all = inversions(chord);
  const current = all[index];
  return (
    <div className="map-cell" data-inv={index}>
      <h3>{href ? <Link href={href}>{chord.symbol}</Link> : chord.symbol}<small>{caption}</small></h3>
      <div className="inv-tabs" role="group" aria-label={`${chord.symbol} inversion`}>
        {all.map((inv, i) => <button key={inv.label} type="button" className="inv-tab" aria-pressed={i === index} title={inv.label} onClick={() => setIndex(i)}>{SHORT[i]}</button>)}
      </div>
      {all.map((inv, i) => (
        <div key={inv.label} className="inv-pane" data-i={i}>
          <KeyboardSvg label={chordAltText(chord, inv)} notes={inv.midi.map((midi, n) => ({ midi, role: inv.roles[n], label: inv.names[n] }))} />
          <p className="map-notes">{inv.label}: {inv.names.join(" – ")}</p>
        </div>
      ))}
      <button type="button" className="play-btn map-play" onClick={() => playNotes(current.midi, false, 1.6)}>Play</button>
    </div>
  );
}

export function ChordMap({ rows }: { rows: ChordMapRow[] }) {
  return (
    <div>
      <InstrumentToggle />
      <div className="map-head"><span>Triads</span><span>Seventh chords</span></div>
      {rows.map(row => (
        <div className="map-row" key={row.numeral}>
          <ChordCell chord={row.triad} href={row.triadHref} caption={`${row.numeral} · ${row.triad.fullName}`} />
          <ChordCell chord={row.seventh} caption={`${row.numeral} · ${row.seventh.fullName}`} />
        </div>
      ))}
    </div>
  );
}
