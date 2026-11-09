"use client";

import "./progression.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { InstrumentToggle } from "@/components/instrument-toggle";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { useStripPlayer } from "@/components/use-strip-player";
import { builderHref, studioHref, type BuilderState } from "@/lib/builder";
import { builderChordType, defaultTonic, tonicFromQuery, getProgression, keysFor, progressionChords, stripSteps, voiceLeadingText, type InversionMode } from "@/lib/progressions";
import { chordAltText, keySlug } from "@/lib/reference";

const MODES: [InversionMode, string][] = [["root", "Root position"], ["first", "1st inversion"], ["second", "2nd inversion"], ["smooth", "Smooth"]];

// The first render (default key, root position) is identical on server and client, so the chords are in the HTML source.
export function ProgressionStrip({ slug }: { slug: string }) {
  const progression = getProgression(slug)!;
  const [tonic, setTonic] = useState(defaultTonic(progression.mode));
  const [mode, setMode] = useState<InversionMode>("smooth");
  const [bpm, setBpm] = useState(90);
  // Links from chord pages and key hubs open the page in their key (?key=g-major). Applied after hydration.
  useEffect(() => { const linked = tonicFromQuery(progression, window.location.search); if (linked) setTonic(linked); }, [progression]);

  const chords = progressionChords(progression, tonic);
  const steps = stripSteps(chords, mode);
  const player = useStripPlayer(steps.map(s => s.midi), bpm, progression.beats);
  const chordType = builderChordType(progression);
  const handoff: BuilderState = {
    key: { tonic, mode: progression.mode },
    degrees: progression.degrees,
    sevenths: chordType === "sevenths",
    inversion: mode === "smooth" ? "smooth" : steps.map(s => s.inversion.index),
  };

  return (
    <div>
      <div className="strip-controls">
        <label>Key
          <select value={tonic} onChange={e => { player.stop(); setTonic(e.target.value); }}>
            {keysFor(progression).map(k => <option key={k} value={k}>{k} {progression.mode}</option>)}
          </select>
        </label>
        <span className="inv-tabs" role="group" aria-label="Inversion" style={{ margin: 0 }}>
          {MODES.map(([id, label]) => <button key={id} type="button" className="inv-tab" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}
        </span>
        <label>Tempo
          <select value={bpm} onChange={e => setBpm(Number(e.target.value))}>{[60, 75, 90, 110, 130].map(v => <option key={v} value={v}>{v} bpm</option>)}</select>
        </label>
        <button type="button" className="play-btn" style={{ margin: 0 }} onClick={() => player.toggle()}>{player.playing ? "Stop" : "Play all"}</button>
        <InstrumentToggle />
      </div>
      <div className={`strip${progression.barsPerRow ? " strip-bars" : ""}`}>
        {steps.map((step, i) => (
          <div key={i} className={`strip-card${player.active === i ? " active" : ""}`}>
            <h3>{step.chord.symbol}<small>{progression.barsPerRow ? `Bar ${i + 1} · ` : ""}{progression.numerals[i]} in {tonic} {progression.mode}</small></h3>
            <KeyboardSvg label={chordAltText(step.chord, step.inversion)} notes={step.midi.map((midi, n) => ({ midi, role: step.inversion.roles[n], label: step.inversion.names[n] }))} />
            <p>{step.inversion.label}: {step.inversion.names.join(" – ")}</p>
            {i > 0 && <p className="vl">From {steps[i - 1].chord.symbol}: {voiceLeadingText(steps[i - 1], step)}.</p>}
          </div>
        ))}
      </div>
      <p className="strip-links">
        {chordType && <Link href={builderHref(handoff)}>Edit in the progression builder</Link>}
        <Link href={studioHref(handoff, chordType ? undefined : progression.qualities)}>Open in Studio</Link>
        <Link href={`/print/progressions/${progression.slug}/?key=${keySlug({ tonic, mode: progression.mode })}&inv=${mode}`}>Print or save as PDF</Link>
      </p>
    </div>
  );
}
