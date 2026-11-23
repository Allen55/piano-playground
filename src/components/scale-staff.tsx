// A scale written out on one staff: clef, then each note as a whole note with its accidental, note names and
// scale degrees underneath. No hooks, so it renders on the server and the notes are in the HTML.
import { ACC_DROP, ACC_GLYPH, ACC_SIZE, CLEF_BASELINE, S, WholeNote, yOf } from "@/components/practice/staff-svg";
import { ledgerSteps, spell, staffStep, type Clef, type Pitch } from "@/lib/notation";
import { shownAccidentals } from "@/lib/scales";

type Props = { clef: Clef; pitches: Pitch[]; degrees: string[]; label: string };

const GAP = 40;
const START = 62;

export function ScaleStaff({ clef, pitches, degrees, label }: Props) {
  const width = START + pitches.length * GAP + 10;
  const shown = shownAccidentals(pitches);
  const notes = pitches.map((p, i) => ({ p, step: staffStep(p, clef), x: START + 16 + i * GAP + (shown.some(a => a !== null) ? 6 : 0), acc: shown[i] }));
  return (
    <svg viewBox={`0 0 ${width} 200`} role="img" aria-label={label} width="100%" style={{ display: "block", maxWidth: width * 1.5 }}>
      <title>{label}</title>
      {[0, 2, 4, 6, 8].map(s => <line key={s} x1={2} x2={width - 2} y1={yOf(s)} y2={yOf(s)} stroke="var(--ink)" strokeWidth={1} />)}
      <line x1={2} x2={2} y1={yOf(8)} y2={yOf(0)} stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={width - 6} x2={width - 6} y1={yOf(8)} y2={yOf(0)} stroke="var(--ink)" strokeWidth={1} />
      <line x1={width - 2} x2={width - 2} y1={yOf(8)} y2={yOf(0)} stroke="var(--ink)" strokeWidth={3} />
      {clef === "treble"
        ? <text x={8} y={CLEF_BASELINE.treble} className="music-glyph" fontSize={4 * S} fill="var(--ink)">𝄞</text>
        : <text x={8} y={CLEF_BASELINE.bass} className="music-glyph" fontSize={4 * S} fill="var(--ink)">𝄢</text>}
      {notes.map(({ p, step, x, acc }, i) => (
        <g key={i} data-pitch={`${spell(p)}${p.octave}`}>
          {ledgerSteps(step).map(s => <line key={s} x1={x - 12} x2={x + 12} y1={yOf(s)} y2={yOf(s)} stroke="var(--ink)" strokeWidth={1.3} />)}
          {acc !== null && <text x={x - 17} y={yOf(step) + ACC_DROP[acc]} className="music-glyph" fontSize={ACC_SIZE} textAnchor="middle" fill="var(--ink)">{ACC_GLYPH[acc]}</text>}
          <WholeNote x={x} y={yOf(step)} fill={i === 0 || i === notes.length - 1 ? "var(--accent)" : "var(--ink)"} />
          <text x={x} y={170} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--ink)">{spell(p)}</text>
          <text x={x} y={190} textAnchor="middle" fontSize={12} fill="var(--ink-soft)">{degrees[i]}</text>
        </g>
      ))}
    </svg>
  );
}
