"use client";

import "./progression.css";
import { useRef, useState } from "react";
import { InstrumentToggle } from "@/components/instrument-toggle";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { playNotes } from "@/lib/audio";
import { defaultTonic, getProgression, keysFor, progressionChords, stripSteps, voiceLeadingText, type InversionMode } from "@/lib/progressions";
import { chordAltText } from "@/lib/reference";

const MODES: [InversionMode, string][] = [["root", "Root position"], ["first", "1st inversion"], ["second", "2nd inversion"], ["smooth", "Smooth"]];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The first render (default key, root position) is identical on server and client, so the chords are in the HTML source.
export function ProgressionStrip({ slug }: { slug: string }) {
  const progression = getProgression(slug)!;
  const [tonic, setTonic] = useState(defaultTonic(progression.mode));
  const [mode, setMode] = useState<InversionMode>("smooth");
  const [bpm, setBpm] = useState(90);
  const [active, setActive] = useState<number | null>(null);
  const stopRef = useRef(true);

  const chords = progressionChords(progression, tonic);
  const steps = stripSteps(chords, mode);

  const stop = () => { stopRef.current = true; setActive(null); };
  const playAll = async () => {
    stopRef.current = false;
    const beat = 60000 / bpm;
    for (let i = 0; i < steps.length && !stopRef.current; i++) {
      setActive(i);
      await playNotes(steps[i].midi, false, (beat * 1.8) / 1000);
      await sleep(beat * 2);
    }
    setActive(null);
    stopRef.current = true;
  };

  return (
    <div>
      <div className="strip-controls">
        <label>Key
          <select value={tonic} onChange={e => { stop(); setTonic(e.target.value); }}>
            {keysFor(progression).map(k => <option key={k} value={k}>{k} {progression.mode}</option>)}
          </select>
        </label>
        <span className="inv-tabs" role="group" aria-label="Inversion" style={{ margin: 0 }}>
          {MODES.map(([id, label]) => <button key={id} type="button" className="inv-tab" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}
        </span>
        <label>Tempo
          <select value={bpm} onChange={e => setBpm(Number(e.target.value))}>{[60, 75, 90, 110, 130].map(v => <option key={v} value={v}>{v} bpm</option>)}</select>
        </label>
        <button type="button" className="play-btn" style={{ margin: 0 }} onClick={() => (stopRef.current ? playAll() : stop())}>{active === null ? "Play all" : "Stop"}</button>
        <InstrumentToggle />
      </div>
      <div className="strip">
        {steps.map((step, i) => (
          <div key={i} className={`strip-card${active === i ? " active" : ""}`}>
            <h3>{step.chord.symbol}<small>{progression.numerals[i]} in {tonic} {progression.mode}</small></h3>
            <KeyboardSvg label={chordAltText(step.chord, step.inversion)} notes={step.midi.map((midi, n) => ({ midi, role: step.inversion.roles[n], label: step.inversion.names[n] }))} />
            <p>{step.inversion.label}: {step.inversion.names.join(" – ")}</p>
            {i > 0 && <p className="vl">From {steps[i - 1].chord.symbol}: {voiceLeadingText(steps[i - 1], step)}.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
