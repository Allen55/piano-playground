"use client";

import { InstrumentToggle } from "@/components/instrument-toggle";
import { playSequence } from "@/lib/audio";

/** Play buttons for a scale page. `midi` is one ascending octave, tonic to tonic. */
export function ScalePlayer({ midi }: { midi: number[] }) {
  const upDown = [...midi, ...midi.slice(0, -1).reverse()];
  return (
    <div>
      <button type="button" className="play-btn" onClick={() => playSequence(midi, 0.32, 0.6)}>Play ascending</button>
      <button type="button" className="play-btn" style={{ marginLeft: 8 }} onClick={() => playSequence(upDown, 0.28, 0.55)}>Play up and down</button>
      <InstrumentToggle />
    </div>
  );
}
