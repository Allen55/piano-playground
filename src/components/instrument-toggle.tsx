"use client";

import { useEffect, useState } from "react";
import { loadInstrument, setInstrument, type Instrument } from "@/lib/audio";

const OPTIONS: [Instrument, string][] = [["synth", "Synth"], ["piano", "Piano"]];

/** Sound choice, remembered in the browser. Starts on "synth" so server and first client render match. */
export function InstrumentToggle() {
  const [value, setValue] = useState<Instrument>("synth");
  useEffect(() => { setValue(loadInstrument()); }, []);
  const choose = (next: Instrument) => { setInstrument(next); setValue(next); };
  return (
    <span className="inv-tabs" role="group" aria-label="Sound" style={{ display: "inline-flex", margin: "12px 0 0 12px" }}>
      {OPTIONS.map(([id, label]) => <button key={id} type="button" className="inv-tab" aria-pressed={value === id} onClick={() => choose(id)}>{label}</button>)}
    </span>
  );
}
