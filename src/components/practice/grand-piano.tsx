"use client";
// The full 88-key piano, A0 to C8. An overview shows every key; on small screens a zoomed strip below it
// scrolls sideways with keys large enough to tap, and the overview outlines (and moves) the zoomed window.
import { useEffect, useMemo, useRef, useState } from "react";
import { keyboardLayout, type KeyRect } from "@/lib/keyboard-layout";
import { HIGHEST_MIDI, LOWEST_MIDI, MIDDLE_C, midiLabel } from "@/lib/notation";

export type KeyMark = "correct" | "wrong" | "study" | "start" | "target";
type Props = {
  marks: Map<number, KeyMark>;
  onKey: (midi: number) => void;
  /** Small screens: add the zoomed strip, and the overview scrolls it instead of answering. */
  compact: boolean;
  /** Key to bring into view in the zoomed strip. */
  focus: number;
  label: string;
};

const WW = 24, WH = 130, ZOOM_H = 84, LABEL_H = 22;
const FILL: Record<KeyMark, [string, string]> = {
  correct: ["#46b98a", "#2f8f68"], wrong: ["#e0705c", "#b44c3a"], study: ["#8abce8", "#4d86b8"], start: ["#e8b47a", "#b9824a"], target: ["#46b98a", "#2f8f68"],
};
const MARK_WORD: Record<KeyMark, string> = { correct: "correct", wrong: "your answer", study: "shown", start: "starting note", target: "answer" };

function Keys({ keys, marks, onKey, interactive }: { keys: KeyRect[]; marks: Map<number, KeyMark>; onKey?: (midi: number) => void; interactive: boolean }) {
  const draw = (k: KeyRect) => {
    const mark = marks.get(k.midi);
    const fill = mark ? FILL[mark][k.black ? 1 : 0] : k.black ? "#1d272c" : "#e6ecee";
    const name = midiLabel(k.midi);
    return (
      <g key={k.midi} className={interactive ? "gp-key" : undefined} data-midi={k.midi} data-mark={mark}
        role={interactive ? "button" : undefined} aria-label={interactive ? `${name}${mark ? `, ${MARK_WORD[mark]}` : ""}` : undefined}
        onClick={onKey ? () => onKey(k.midi) : undefined}>
        <rect x={k.x} y={0} width={k.width} height={k.height} rx={k.black ? 2 : 3} fill={fill} stroke={k.black ? "#0f1619" : "#8e9da3"} strokeWidth={1} />
        {k.midi === MIDDLE_C && <circle cx={k.x + k.width / 2} cy={k.height - 14} r={4} fill={mark ? "#10181b" : "#e8b47a"} stroke="#6b5132" strokeWidth={0.8} />}
      </g>
    );
  };
  return <>{keys.filter(k => !k.black).map(draw)}{keys.filter(k => k.black).map(draw)}</>;
}

function OctaveLabels({ keys, height }: { keys: KeyRect[]; height: number }) {
  return (
    <>
      {keys.filter(k => k.midi % 12 === 0 || k.midi === LOWEST_MIDI).map(k => (
        <text key={k.midi} x={k.x + k.width / 2} y={height + 15} textAnchor="middle" fontSize={k.midi === MIDDLE_C ? 12 : 11} fontWeight={k.midi === MIDDLE_C ? 800 : 500} fill={k.midi === MIDDLE_C ? "#e8b47a" : "#93a3aa"}>
          {k.midi === MIDDLE_C ? "Middle C · C4" : midiLabel(k.midi)}
        </text>
      ))}
    </>
  );
}

export function GrandPiano({ marks, onKey, compact, focus, label }: Props) {
  const layout = useMemo(() => keyboardLayout(LOWEST_MIDI, HIGHEST_MIDI, WW, WH), []);
  // The zoomed strip uses shorter keys so it stays a comfortable height on a phone.
  const zoomLayout = useMemo(() => keyboardLayout(LOWEST_MIDI, HIGHEST_MIDI, WW, ZOOM_H), []);
  const zoomRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ left: 0, width: 0.25 });

  const xOf = (midi: number) => { const k = layout.keys.find(k => k.midi === midi); return k ? k.x + k.width / 2 : 0; };

  // Keep the zoomed strip on the key of interest.
  useEffect(() => {
    const el = zoomRef.current;
    if (!compact || !el) return;
    const target = (xOf(focus) / layout.width) * el.scrollWidth - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, compact]);

  const syncView = () => {
    const el = zoomRef.current;
    if (el) setView({ left: el.scrollLeft / el.scrollWidth, width: el.clientWidth / el.scrollWidth });
  };
  useEffect(() => { if (compact) syncView(); }, [compact]);

  const navigate = (midi: number) => {
    const el = zoomRef.current;
    if (el) el.scrollTo({ left: (xOf(midi) / layout.width) * el.scrollWidth - el.clientWidth / 2, behavior: "smooth" });
  };

  const box = `-1 -1 ${layout.width + 2} ${WH + LABEL_H}`;
  return (
    <div className="gp" aria-label={label}>
      <div className="gp-overview">
        <svg viewBox={box} width="100%" role="group" aria-label={compact ? "Piano overview, A0 to C8. Tap to move the zoomed keys." : "Piano, A0 to C8"} style={{ display: "block" }}>
          <Keys keys={layout.keys} marks={marks} onKey={compact ? navigate : onKey} interactive={!compact} />
          <OctaveLabels keys={layout.keys} height={WH} />
          {compact && <rect className="gp-window" x={view.left * layout.width} y={-1} width={view.width * layout.width} height={WH + 2} rx={3} />}
        </svg>
      </div>
      {compact && (
        <div className="gp-zoom" ref={zoomRef} onScroll={syncView}>
          <svg viewBox={`-1 -1 ${layout.width + 2} ${ZOOM_H + LABEL_H}`} width={layout.whiteCount * 44} role="group" aria-label="Zoomed piano keys" style={{ display: "block" }}>
            <Keys keys={zoomLayout.keys} marks={marks} onKey={onKey} interactive />
            <OctaveLabels keys={zoomLayout.keys} height={ZOOM_H} />
          </svg>
        </div>
      )}
    </div>
  );
}
