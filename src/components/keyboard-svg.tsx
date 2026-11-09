// Server-renderable keyboard diagram: no hooks, no "use client", so the notes are in the HTML source.
import { keyboardLayout } from "@/lib/keyboard-layout";
import type { ToneRole } from "@/lib/music";

export const ROLE_FILL: Record<ToneRole, string> = {
  root: "#e8b47a", third: "#8ed1b9", fifth: "#d2e1eb", seventh: "#c4a8e5", extension: "#d4ca8d",
};

export type KeyboardNote = { midi: number; role?: ToneRole; label?: string };

type Props = {
  notes: KeyboardNote[];
  start?: number;
  end?: number;
  label: string;
  showLabels?: boolean;
  className?: string;
  /** Reuse the plain keyboard from <KeyboardDefs> on the same page and draw only the pressed keys. For pages with hundreds of diagrams. */
  shared?: boolean;
};

const WHITE = "#e6ecee", BLACK = "#1d272c";
const defId = (start: number, end: number, black: boolean) => `kb-${start}-${end}-${black ? "b" : "w"}`;
const keyRect = (key: { x: number; width: number; height: number; black: boolean }, fill: string) => (
  <rect x={key.x} y={0} width={key.width} height={key.height} rx={3} fill={fill} stroke={key.black ? "#0f1619" : "#8e9da3"} strokeWidth={1} />
);

/** The unpressed keyboard, drawn once per page for every `shared` diagram with the same range. */
export function KeyboardDefs({ start = 60, end = 83 }: { start?: number; end?: number }) {
  const layout = keyboardLayout(start, end);
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <g id={defId(start, end, false)}>{layout.keys.filter(k => !k.black).map(k => <g key={k.midi}>{keyRect(k, WHITE)}</g>)}</g>
        <g id={defId(start, end, true)}>{layout.keys.filter(k => k.black).map(k => <g key={k.midi}>{keyRect(k, BLACK)}</g>)}</g>
      </defs>
    </svg>
  );
}

export function KeyboardSvg({ notes, start = 60, end = 83, label, showLabels = true, className, shared = false }: Props) {
  const layout = keyboardLayout(start, end);
  const pressed = new Map(notes.map(n => [n.midi, n]));
  const draw = (key: (typeof layout.keys)[number]) => {
    const note = pressed.get(key.midi);
    const fill = note ? ROLE_FILL[note.role ?? "root"] : key.black ? BLACK : WHITE;
    return (
      <g key={key.midi}>
        {keyRect(key, fill)}
        {showLabels && note?.label && (
          <text x={key.x + key.width / 2} y={key.height - 8} textAnchor="middle" fontSize={key.black ? 9 : 11} fontWeight={600} fill={key.black ? "#10181b" : "#1c2529"}>{note.label}</text>
        )}
      </g>
    );
  };
  return (
    <svg className={className} viewBox={`-1 -1 ${layout.width + 2} ${layout.height + 2}`} role="img" aria-label={label} width="100%" style={{ maxWidth: layout.width * 1.6, display: "block" }}>
      <title>{label}</title>
      {shared ? (
        <>
          <use href={`#${defId(start, end, false)}`} />
          {layout.keys.filter(k => !k.black && pressed.has(k.midi)).map(draw)}
          <use href={`#${defId(start, end, true)}`} />
          {layout.keys.filter(k => k.black && pressed.has(k.midi)).map(draw)}
        </>
      ) : (
        <>
          {layout.keys.filter(k => !k.black).map(draw)}
          {layout.keys.filter(k => k.black).map(draw)}
        </>
      )}
    </svg>
  );
}
