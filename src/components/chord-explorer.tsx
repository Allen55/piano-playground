"use client";

import { useState } from "react";
import { KeyboardSvg, ROLE_FILL } from "@/components/keyboard-svg";
import { playNotes } from "@/lib/audio";
import type { ToneRole } from "@/lib/music";

export type ExplorerInversion = { label: string; names: string[]; roles: ToneRole[]; midi: number[]; bass: string; alt: string };

const ROLE_LABELS: Record<ToneRole, string> = { root: "Root", third: "Third", fifth: "Fifth", seventh: "Seventh", extension: "Extension" };

// The initial state matches the server render (root position), so the keyboard is present in the HTML source.
export function ChordExplorer({ symbol, inversions }: { symbol: string; inversions: ExplorerInversion[] }) {
  const [index, setIndex] = useState(0);
  const inv = inversions[index];
  const roles = [...new Set(inv.roles)];
  return (
    <div className="panel-box">
      <div className="inv-tabs" role="group" aria-label="Inversion">
        {inversions.map((item, i) => (
          <button key={item.label} type="button" className="inv-tab" aria-pressed={i === index} onClick={() => setIndex(i)}>{item.label}</button>
        ))}
      </div>
      <KeyboardSvg label={inv.alt} notes={inv.midi.map((midi, i) => ({ midi, role: inv.roles[i], label: inv.names[i] }))} />
      <p className="inv-notes">{symbol}, {inv.label.toLowerCase()}: {inv.names.join(" – ")} (lowest note {inv.bass})</p>
      <div className="legend">{roles.map(r => <span key={r}><i style={{ background: ROLE_FILL[r] }} />{ROLE_LABELS[r]}</span>)}</div>
      <button type="button" className="play-btn" onClick={() => playNotes(inv.midi, false, 1.6)}>Play chord</button>
      <button type="button" className="play-btn" style={{ marginLeft: 8 }} onClick={() => playNotes(inv.midi, true, 1.2)}>Play arpeggio</button>
    </div>
  );
}
