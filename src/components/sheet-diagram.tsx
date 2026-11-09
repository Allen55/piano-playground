// Small keyboard diagram for printed sheets: a tight 8-white-key window so labels stay readable on paper.
import { KeyboardSvg } from "@/components/keyboard-svg";
import { fitWindow } from "@/lib/keyboard-layout";
import type { Chord } from "@/lib/music";
import { chordAltText, type Inversion } from "@/lib/reference";

export function SheetDiagram({ chord, inversion, midi = inversion.midi }: { chord: Chord; inversion: Inversion; midi?: number[] }) {
  const { start, end } = fitWindow(midi);
  return (
    <KeyboardSvg start={start} end={end} label={chordAltText(chord, inversion)}
      notes={midi.map((m, n) => ({ midi: m, role: inversion.roles[n], label: inversion.names[n] }))} />
  );
}
