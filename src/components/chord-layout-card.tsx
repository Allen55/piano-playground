"use client";

import { Play } from "lucide-react";
import { midiName, type Chord, type Voicing } from "@/lib/music";

const BLACK = new Set([1, 3, 6, 8, 10]);
const START = 36; // C2
const END = 84; // C6, exclusive
const WHITE_WIDTH = 7;

function MiniKeyboard({ voicing }: { voicing: Voicing }) {
  const voiced = new Map(voicing.notes.map(note => [note.midi, note]));
  let whiteIndex = 0;
  const keys = Array.from({ length: END - START }, (_, offset) => {
    const midi = START + offset;
    const black = BLACK.has(midi % 12);
    const x = black ? whiteIndex * WHITE_WIDTH - 2.3 : whiteIndex++ * WHITE_WIDTH;
    return { midi, black, x };
  });
  const draw = ({ midi, black, x }: (typeof keys)[number]) => {
    const note = voiced.get(midi);
    const color = note?.hand === "left" ? "#e4ab6d" : note?.hand === "right" ? "#92c6e9" : black ? "#253138" : "#dce3e4";
    return <rect key={midi} x={x} y={0} width={black ? 4.6 : 6.6} height={black ? 38 : 65} rx={black ? 1.3 : 1.5} fill={color} stroke={black ? "#172126" : "#8e9da3"} strokeWidth=".4" />;
  };
  return <svg className="comparison-keyboard" viewBox="0 0 196 66" preserveAspectRatio="none" role="img" aria-label={`Piano layout for ${voicing.label}`}>
    {keys.filter(key => !key.black).map(draw)}
    {keys.filter(key => key.black).map(draw)}
  </svg>;
}

type Props = {
  chord: Chord;
  voicing: Voicing;
  numeral: string;
  index: number;
  active: boolean;
  playing: boolean;
  onSelect: () => void;
  onPlay: () => void;
};

export function ChordLayoutCard({ chord, voicing, numeral, index, active, playing, onSelect, onPlay }: Props) {
  return <article className={`comparison-card ${active ? "active" : ""} ${playing ? "playing" : ""}`}>
    <div className="comparison-card-top">
      <button className="comparison-select" onClick={onSelect} aria-label={`Select ${chord.symbol}, chord ${index + 1}`}>
        <span className="comparison-index">{String(index + 1).padStart(2, "0")} <span>/</span> {numeral}</span>
        <strong>{chord.symbol}</strong>
      </button>
      <button className="comparison-play" onClick={onPlay} aria-label={`Play ${chord.symbol}`} title={`Play ${chord.symbol}`}><Play size={13} fill="currentColor" /></button>
    </div>
    <MiniKeyboard voicing={voicing} />
    <div className="comparison-voicing">{voicing.label}</div>
    <div className="comparison-hands">
      {(["left", "right"] as const).map(hand => <div className="comparison-hand" key={hand}>
        <span className={`comparison-hand-label ${hand}`}>{hand === "left" ? "L" : "R"}</span>
        <span className="comparison-hand-notes">{voicing.notes.filter(note => note.hand === hand).sort((a, b) => a.midi - b.midi).map((note, i) => <span key={`${note.midi}-${i}`}>{midiName(note.midi, note.name)}<sup>{note.finger ?? "·"}</sup></span>)}</span>
      </div>)}
    </div>
  </article>;
}
