// Engraved single-staff diagram: clef, key signature, whole notes, ledger lines and accidentals.
// No hooks, so it can render on the server. Positions come from the same Pitch data that lights the piano keys.
import { ACC_SIGN, keyAccidental, keySigGlyphs, ledgerSteps, staffStep, type Clef, type Pitch } from "@/lib/notation";

export type StaffTone = "ink" | "correct" | "wrong" | "muted";
export type StaffNote = { pitch: Pitch; tone?: StaffTone };

type Props = {
  clef: Clef;
  /** Key signature: sharps positive, flats negative. */
  keyCount?: number;
  notes: StaffNote[];
  /** Single note, two notes side by side (melodic), or stacked (harmonic). */
  layout?: "single" | "melodic" | "harmonic";
  label: string;
  className?: string;
};

export const S = 10; // staff space
export const BOTTOM = 112; // y of the bottom line
export const yOf = (step: number) => BOTTOM - step * (S / 2);
const TONE: Record<StaffTone, string> = { ink: "var(--ink)", correct: "var(--good)", wrong: "var(--bad)", muted: "var(--ink-soft)" };
export const ACC_GLYPH: Record<number, string> = { ...ACC_SIGN, 0: "♮" };
// Noto Music glyph metrics (measured): baseline drop that centres each accidental on its line or space,
// and clef baselines that put the treble curl round G4 and the bass dots round F3.
export const ACC_SIZE = 3.6 * S;
export const ACC_DROP: Record<number, number> = { [-2]: 3.5, [-1]: 3.5, 0: 5, 1: 5, 2: 5 };
export const CLEF_BASELINE = { treble: BOTTOM + 1, bass: BOTTOM - 5 };

export function WholeNote({ x, y, fill }: { x: number; y: number; fill: string }) {
  // Outer oval with a tilted hollow, the shape of an engraved whole note.
  const rx = 7.2, ry = 5, irx = 3.6, iry = 2.4, rot = -58;
  const t = (rot * Math.PI) / 180;
  const dx = irx * Math.cos(t), dy = irx * Math.sin(t);
  const d = `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z `
    + `M ${x - dx} ${y - dy} A ${irx} ${iry} ${rot} 1 0 ${x + dx} ${y + dy} A ${irx} ${iry} ${rot} 1 0 ${x - dx} ${y - dy} Z`;
  return <path d={d} fill={fill} fillRule="evenodd" />;
}

export function StaffSvg({ clef, keyCount = 0, notes, layout = "single", label, className }: Props) {
  const sig = keySigGlyphs(keyCount, clef);
  const sigX = 46;
  const noteStart = sigX + sig.length * 11 + 34;
  const width = Math.max(240, noteStart + (layout === "melodic" ? 110 : 64));
  const placed = notes.map((n, i) => {
    const step = staffStep(n.pitch, clef);
    const needsAcc = n.pitch.acc !== keyAccidental(keyCount, n.pitch.letter);
    return { ...n, step, needsAcc, x: noteStart + (width - noteStart) * (layout === "melodic" ? (i + 1) / 3 : 0.45) };
  });
  if (layout === "harmonic" && placed.length === 2) {
    // Seconds and unisons: the upper note moves to the right of the stem side, as engravers do.
    const [lo, hi] = placed[0].step <= placed[1].step ? [placed[0], placed[1]] : [placed[1], placed[0]];
    if (hi.step - lo.step <= 1) hi.x += 15;
  }
  // Accidentals stagger leftward when two in one chord would collide.
  // In a chord every accidental goes left of the leftmost notehead, even when a second pushes one note right.
  const chordLeft = Math.min(...placed.map(p => p.x));
  const accX = placed.map(p => (layout === "harmonic" ? chordLeft : p.x) - 17);
  if (layout === "harmonic" && placed.length === 2 && placed.every(p => p.needsAcc) && Math.abs(placed[0].step - placed[1].step) < 6) {
    const lower = placed[0].step <= placed[1].step ? 0 : 1;
    accX[lower] -= 10;
  }
  const minX = Math.min(...placed.map(p => p.x)), maxX = Math.max(...placed.map(p => p.x));
  return (
    <svg className={className} viewBox={`0 0 ${width} 172`} role="img" aria-label={label} width="100%" style={{ display: "block" }}>
      <title>{label}</title>
      {[0, 2, 4, 6, 8].map(s => <line key={s} x1={2} x2={width - 2} y1={yOf(s)} y2={yOf(s)} stroke="var(--ink)" strokeWidth={1} />)}
      <line x1={2} x2={2} y1={yOf(8)} y2={yOf(0)} stroke="var(--ink)" strokeWidth={1.2} />
      {clef === "treble"
        ? <text x={8} y={CLEF_BASELINE.treble} className="music-glyph" fontSize={4 * S} fill="var(--ink)">𝄞</text>
        : <text x={8} y={CLEF_BASELINE.bass} className="music-glyph" fontSize={4 * S} fill="var(--ink)">𝄢</text>}
      {sig.map((g, i) => <text key={i} x={sigX + i * 11} y={yOf(g.step) + ACC_DROP[g.acc]} className="music-glyph" fontSize={ACC_SIZE} fill="var(--ink)">{ACC_GLYPH[g.acc]}</text>)}
      {placed.flatMap(p => ledgerSteps(p.step).map(s => ({ s, x: p.x }))).map(({ s, x }, i) => (
        <line key={`l${i}`} x1={(layout === "harmonic" ? minX : x) - 12} x2={(layout === "harmonic" ? maxX : x) + 12} y1={yOf(s)} y2={yOf(s)} stroke="var(--ink)" strokeWidth={1.3} />
      ))}
      {placed.map((p, i) => (
        <g key={i} data-pitch={`${p.pitch.letter}:${p.pitch.acc}:${p.pitch.octave}`}>
          {p.needsAcc && <text x={accX[i]} y={yOf(p.step) + ACC_DROP[p.pitch.acc]} className="music-glyph" fontSize={ACC_SIZE} textAnchor="middle" fill={TONE[p.tone ?? "ink"]}>{ACC_GLYPH[p.pitch.acc]}</text>}
          <WholeNote x={p.x} y={yOf(p.step)} fill={TONE[p.tone ?? "ink"]} />
        </g>
      ))}
    </svg>
  );
}
