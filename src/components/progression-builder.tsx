"use client";

import "./progression.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { InstrumentToggle } from "@/components/instrument-toggle";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { useStripPlayer } from "@/components/use-strip-player";
import { DEFAULT_BUILDER, MAX_CHORDS, builderNumeral, builderQuery, builderSteps, formatDegrees, inversionIndexes, parseBuilderQuery, parseDegrees, studioHref, type BuilderState } from "@/lib/builder";
import { diatonicChords } from "@/lib/music";
import { voiceLeadingText } from "@/lib/progressions";
import { allKeys, chordAltText, keySlug, parseKeySlug } from "@/lib/reference";

const INVERSION_NAMES = ["Root", "1st", "2nd", "3rd"];
const KEYS = allKeys();

// Renders the default progression on the server; the URL state is applied after hydration.
export function ProgressionBuilder() {
  const [state, setState] = useState<BuilderState>(DEFAULT_BUILDER);
  const [text, setText] = useState(formatDegrees(DEFAULT_BUILDER.degrees));
  const [loaded, setLoaded] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [loop, setLoop] = useState(false);
  const [copied, setCopied] = useState(false);

  const steps = builderSteps(state);
  const player = useStripPlayer(steps.map(s => s.midi), bpm);
  const palette = diatonicChords(state.key.tonic, state.key.mode, state.sevenths);
  const typedOk = parseDegrees(text) !== undefined || text.trim() === "";

  useEffect(() => {
    const initial = parseBuilderQuery(window.location.search);
    setState(initial);
    setText(formatDegrees(initial.degrees));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) window.history.replaceState(null, "", `${window.location.pathname}${builderQuery(state)}`);
  }, [state, loaded]);

  /** Change the chord list, keeping each remaining chord's fixed inversion. */
  const setDegrees = (degrees: number[], inversion: BuilderState["inversion"], syncText = true) => {
    setState(s => ({ ...s, degrees, inversion }));
    if (syncText) setText(formatDegrees(degrees));
  };
  const add = (degree: number) => {
    if (state.degrees.length >= MAX_CHORDS) return;
    setDegrees([...state.degrees, degree], state.inversion === "smooth" ? "smooth" : [...state.inversion, 0]);
  };
  const remove = (index: number) => {
    player.stop();
    setDegrees(state.degrees.filter((_, i) => i !== index), state.inversion === "smooth" ? "smooth" : state.inversion.filter((_, i) => i !== index));
  };
  const typed = (value: string) => {
    setText(value);
    const degrees = parseDegrees(value);
    if (!degrees) return;
    const current = state.inversion;
    setDegrees(degrees, current === "smooth" ? "smooth" : degrees.map((_, i) => current[i] ?? 0), false);
  };
  const setInversion = (index: number, value: number) => {
    const fixed = inversionIndexes(state);
    fixed[index] = value;
    setState(s => ({ ...s, inversion: fixed }));
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="builder">
      <div className="strip-controls">
        <label>Key
          <select value={keySlug(state.key)} onChange={e => { player.stop(); setState(s => ({ ...s, key: parseKeySlug(e.target.value) ?? s.key })); }}>
            <optgroup label="Major">{KEYS.filter(k => k.mode === "major").map(k => <option key={keySlug(k)} value={keySlug(k)}>{k.tonic} major</option>)}</optgroup>
            <optgroup label="Minor">{KEYS.filter(k => k.mode === "minor").map(k => <option key={keySlug(k)} value={keySlug(k)}>{k.tonic} minor</option>)}</optgroup>
          </select>
        </label>
        <span className="inv-tabs" role="group" aria-label="Chord type" style={{ margin: 0 }}>
          <button type="button" className="inv-tab" aria-pressed={!state.sevenths} onClick={() => setState(s => ({ ...s, sevenths: false }))}>Triads</button>
          <button type="button" className="inv-tab" aria-pressed={state.sevenths} onClick={() => setState(s => ({ ...s, sevenths: true }))}>Sevenths</button>
        </span>
      </div>

      <div className="numeral-pad" role="group" aria-label="Add a chord">
        {palette.map((entry, i) => (
          <button key={i} type="button" onClick={() => add(i + 1)} disabled={state.degrees.length >= MAX_CHORDS}>
            <strong>{builderNumeral(state.key, i + 1, state.sevenths)}</strong>
            <span>{entry.chord.symbol}</span>
          </button>
        ))}
      </div>

      <div className="strip-controls">
        <label className="builder-input">Progression
          <input value={text} onChange={e => typed(e.target.value)} placeholder="1-5-6-4 or I-V-vi-IV" aria-invalid={!typedOk} spellCheck={false} />
        </label>
        <button type="button" className="inv-tab" onClick={() => remove(state.degrees.length - 1)} disabled={!state.degrees.length}>Undo</button>
        <button type="button" className="inv-tab" onClick={() => { player.stop(); setDegrees([], state.inversion === "smooth" ? "smooth" : []); }} disabled={!state.degrees.length}>Clear</button>
      </div>
      {!typedOk && <p className="builder-hint">Use scale degrees 1 to 7 or numerals such as I, V, vi, separated by dashes or spaces (up to {MAX_CHORDS} chords).</p>}

      <div className="strip-controls">
        <span className="inv-tabs" role="group" aria-label="Inversions" style={{ margin: 0 }}>
          <button type="button" className="inv-tab" aria-pressed={state.inversion === "smooth"} onClick={() => setState(s => ({ ...s, inversion: "smooth" }))}>Smooth for all</button>
          <button type="button" className="inv-tab" aria-pressed={state.inversion !== "smooth"} onClick={() => setState(s => ({ ...s, inversion: inversionIndexes(s) }))}>Per chord</button>
        </span>
        <label>Tempo
          <select value={bpm} onChange={e => setBpm(Number(e.target.value))}>{[60, 75, 90, 110, 130].map(v => <option key={v} value={v}>{v} bpm</option>)}</select>
        </label>
        <label><input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> Loop</label>
        <button type="button" className="play-btn" style={{ margin: 0 }} onClick={() => player.toggle(loop)} disabled={!steps.length}>{player.playing ? "Stop" : "Play all"}</button>
        <InstrumentToggle />
      </div>

      {steps.length ? (
        <div className="strip">
          {steps.map((step, i) => (
            <div key={i} className={`strip-card${player.active === i ? " active" : ""}`}>
              <div className="card-head">
                <h3>{step.chord.symbol}<small>{builderNumeral(state.key, state.degrees[i], state.sevenths)}</small></h3>
                <button type="button" className="card-remove" onClick={() => remove(i)} aria-label={`Remove ${step.chord.symbol}`}>×</button>
              </div>
              <KeyboardSvg label={chordAltText(step.chord, step.inversion)} notes={step.midi.map((midi, n) => ({ midi, role: step.inversion.roles[n], label: step.inversion.names[n] }))} />
              <label className="card-inversion">Inversion
                <select value={step.inversion.index} onChange={e => setInversion(i, Number(e.target.value))}>
                  {step.chord.notes.slice(0, 4).map((_, n) => <option key={n} value={n}>{INVERSION_NAMES[n]}</option>)}
                </select>
              </label>
              <p>{step.inversion.label}: {step.inversion.names.join(" – ")}</p>
              {i > 0 && <p className="vl">From {steps[i - 1].chord.symbol}: {voiceLeadingText(steps[i - 1], step)}.</p>}
            </div>
          ))}
        </div>
      ) : <p className="builder-hint">Tap a numeral above or type a progression to start.</p>}

      <p className="strip-links">
        <button type="button" className="inv-tab" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</button>
        <Link className="play-btn" href={studioHref(state)} aria-disabled={!steps.length}>Send to Studio</Link>
      </p>
    </div>
  );
}
