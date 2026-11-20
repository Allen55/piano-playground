"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { playMidi } from "@/lib/audio";
import {
  CLEF_NAME, DEFAULT_NOTE_FILTERS, KEY_SIGS, RANGE_PITCHES, RANGE_PRESETS, describeStep, drawNext, eligibleNotes, explainNoNotes,
  keyChoices, keySig, keySigLabel, midiOf, pitchName, rangeLabel, seededRng, spell, type NoteFilters, type NotePrompt, type Pitch, type RangeMode,
} from "@/lib/notation";
import { GrandPiano, type KeyMark } from "./grand-piano";
import { EMPTY_SCORE, EmptyFilters, FlowButtons, ScoreBar, Segmented, Toggles, scoreAfter, useQuizKeys, useStoredState, type Outcome, type Score } from "./quiz-shared";
import { StaffSvg } from "./staff-svg";

type Answer = { outcome: Outcome; letter?: number; midi?: number };
const LANDMARKS: Record<string, string> = {
  A0: "lowest key", G2: "bass bottom line", F3: "bass 4th line", A3: "bass top line", C4: "middle C",
  E4: "treble bottom line", G4: "treble 2nd line", F5: "treble top line", C8: "highest key",
};
const CLEF_CENTER = { treble: 71, bass: 50 };

export function NoteReading({ active, study, compact }: { active: boolean; study: boolean; compact: boolean }) {
  const [filters, setFilters, loaded] = useStoredState<NoteFilters>("practice-note-filters", DEFAULT_NOTE_FILTERS);
  const pool = useMemo(() => eligibleNotes(filters), [filters]);
  // A seeded first draw renders the same on the server and in the browser; later draws use Math.random.
  const [state, setState] = useState(() => {
    const first = drawNext([], eligibleNotes(DEFAULT_NOTE_FILTERS), undefined, seededRng(4));
    return { prompt: first?.item ?? null, bag: first?.bag ?? [] as NotePrompt[] };
  });
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [score, setScore] = useState<Score>(EMPTY_SCORE);
  const filtersKey = JSON.stringify(filters);
  const firstFilters = useRef(true);

  // New filters: start a fresh bag and, if the current note no longer fits, a new question.
  useEffect(() => {
    if (!loaded) return;
    if (firstFilters.current) { firstFilters.current = false; if (filtersKey === JSON.stringify(DEFAULT_NOTE_FILTERS)) return; }
    const current = state.prompt;
    if (current && pool.some(p => p.id === current.id)) { setState({ prompt: current, bag: [] }); return; }
    const next = drawNext([], pool, current?.id, Math.random);
    setState({ prompt: next?.item ?? null, bag: next?.bag ?? [] });
    setAnswer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, loaded]);

  const prompt = pool.length ? state.prompt : null;
  const count = keySig(filters.key).count;
  const choices = keyChoices(count);
  const revealed = answer !== null;

  const finish = (a: Answer) => {
    if (!prompt || revealed) return;
    setAnswer(a);
    setScore(s => scoreAfter(s, a.outcome));
  };
  const answerLetter = (choice: Pitch) => {
    if (!prompt) return;
    finish({ outcome: choice.letter === prompt.pitch.letter && choice.acc === prompt.pitch.acc ? "correct" : "wrong", letter: choice.letter });
    void playMidi(midiOf(prompt.pitch));
  };
  const answerKey = (midi: number) => {
    void playMidi(midi);
    if (!prompt || revealed) return;
    finish({ outcome: midi === midiOf(prompt.pitch) ? "correct" : "wrong", midi });
  };
  const pass = () => { if (prompt) { finish({ outcome: "passed" }); void playMidi(midiOf(prompt.pitch)); } };
  const next = () => {
    const n = drawNext(state.bag, pool, prompt?.id, Math.random);
    setState({ prompt: n?.item ?? null, bag: n?.bag ?? [] });
    setAnswer(null);
  };
  useQuizKeys(active, revealed, {
    onLetter: l => { const c = choices.find(c => "CDEFGAB"[c.letter] === l); if (c) answerLetter(c); },
    onPass: pass, onNext: next,
  });

  const set = (patch: Partial<NoteFilters>) => setFilters({ ...filters, ...patch });
  const marks = new Map<number, KeyMark>();
  if (prompt) {
    const midi = midiOf(prompt.pitch);
    if (revealed) {
      if (answer.midi !== undefined && answer.midi !== midi) marks.set(answer.midi, "wrong");
      marks.set(midi, "correct");
    } else if (study) marks.set(midi, "study");
  }
  const showAnswer = revealed || study;
  const where = prompt ? `${pitchName(prompt.pitch)}: ${describeStep(prompt.step)}` : "";
  const reasons = explainNoNotes(filters);

  return (
    <div className="pg-stage" hidden={!active}>
      <section className="pg-staff-card" aria-live="polite">
        <div className="pg-paper">
          {prompt
            ? <StaffSvg clef={prompt.clef} keyCount={count} notes={[{ pitch: prompt.pitch, tone: revealed ? (answer.outcome === "correct" ? "correct" : "ink") : "ink" }]}
                label={showAnswer ? `${CLEF_NAME[prompt.clef]} clef, ${where}` : `${CLEF_NAME[prompt.clef]} clef with one note. Name it.`} />
            : <StaffSvg clef="treble" keyCount={count} notes={[]} label="Empty staff" />}
        </div>
        <p className="pg-prompt">
          {prompt ? <>{CLEF_NAME[prompt.clef]} clef{count !== 0 && `, ${keySig(filters.key).major} major key signature`}. {study && !revealed ? "Study: the note is lit on the piano." : "Name the note or play its key."}</> : "Waiting for filters that fit."}
        </p>
      </section>

      <section className="pg-piano-card">
        <GrandPiano marks={marks} onKey={answerKey} compact={compact} label="88-key piano"
          focus={prompt ? (showAnswer ? midiOf(prompt.pitch) : CLEF_CENTER[prompt.clef]) : 60} />
        <p className="pg-hint">Click a key to answer with its exact pitch and octave. Letters ignore the octave.</p>
      </section>

      <section className="pg-answers">
        {!prompt && <EmptyFilters reasons={reasons} />}
        <div className="pg-choices" role="group" aria-label="Note names">
          {choices.map(c => {
            const isRight = prompt && revealed && c.letter === prompt.pitch.letter;
            const isMine = revealed && answer.letter === c.letter;
            return (
              <button key={c.letter} type="button" className="pg-choice" disabled={!prompt || revealed}
                data-state={isRight ? "correct" : isMine ? "wrong" : undefined} onClick={() => answerLetter(c)}>
                {spell(c)}
              </button>
            );
          })}
        </div>
        <FlowButtons revealed={revealed} onPass={pass} onNext={next} nextLabel="Next note" disabled={!prompt} />
        <ScoreBar score={score} onReset={() => setScore(EMPTY_SCORE)} />
      </section>

      <section className="pg-feedback" aria-live="polite">
        {prompt && revealed && (
          <div className={`pg-result pg-${answer.outcome}`} data-outcome={answer.outcome}>
            <b>{answer.outcome === "correct" ? "Correct." : answer.outcome === "passed" ? "Passed." : "Not quite."}</b>{" "}
            {answer.outcome === "wrong" && (answer.letter !== undefined ? `You chose ${spell(choices.find(c => c.letter === answer.letter)!)}. ` : `You played ${keyName(answer.midi!)}. `)}
            It is <b>{pitchName(prompt.pitch)}</b>, on {describeStep(prompt.step)} in the {prompt.clef} clef.
          </div>
        )}
        {prompt && !revealed && <p className="pg-hint">Type A–G, press P to pass. {pool.length} note{pool.length === 1 ? "" : "s"} in rotation.</p>}
      </section>

      <details className="pg-filters" open>
        <summary>Note filters</summary>
        <div className="pg-filter-grid">
          <Toggles label="Clef" options={[{ id: "treble", text: "Treble", on: filters.treble }, { id: "bass", text: "Bass", on: filters.bass }]}
            onToggle={id => set({ [id]: !filters[id as "treble" | "bass"] })} />
          <Segmented label="Staff position" value={filters.position} onChange={position => set({ position })}
            options={[["both", "Lines & spaces"], ["lines", "Lines"], ["spaces", "Spaces"]]} />
          <Segmented label="Outside the staff (ledger lines)" value={filters.outside} onChange={outside => set({ outside })}
            options={[["off", "Off"], ["include", "Include"], ["only", "Only"]]} />
          <div className="pg-field">
            <label className="pg-field-label" htmlFor="pg-key">Key signature</label>
            <select id="pg-key" className="pg-select" value={filters.key} onChange={e => set({ key: e.target.value })}>
              {KEY_SIGS.map(k => <option key={k.id} value={k.id}>{keySigLabel(k)}</option>)}
            </select>
          </div>
          <div className="pg-field pg-field-wide">
            <span className="pg-field-label">Pitch range: {rangeLabel(filters)}</span>
            <span className="inv-tabs pg-seg" role="group" aria-label="Range presets">
              {RANGE_PRESETS.map(p => (
                <button key={p.id} type="button" className="inv-tab" aria-pressed={matchesPreset(filters, p.set)} onClick={() => set(p.set)}>{p.label}</button>
              ))}
            </span>
            <div className="pg-range">
              <label>Mode
                <select className="pg-select" value={filters.range} onChange={e => set({ range: e.target.value as RangeMode })}>
                  <option value="full">Full range</option>
                  <option value="atLeast">At or above</option>
                  <option value="atMost">At or below</option>
                  <option value="between">Between</option>
                </select>
              </label>
              {(filters.range === "atLeast" || filters.range === "between") && (
                <label>{filters.range === "between" ? "Low note" : "Reference"}
                  <PitchSelect value={filters.low} onChange={low => set({ low })} />
                </label>
              )}
              {(filters.range === "atMost" || filters.range === "between") && (
                <label>{filters.range === "between" ? "High note" : "Reference"}
                  <PitchSelect value={filters.high} onChange={high => set({ high })} />
                </label>
              )}
            </div>
          </div>
        </div>
        <button type="button" className="pg-link" onClick={() => setFilters(DEFAULT_NOTE_FILTERS)}>Reset filters</button>
      </details>
    </div>
  );
}

const keyName = (midi: number) => {
  const names = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
};

function matchesPreset(f: NoteFilters, set: Partial<NoteFilters>) {
  return Object.entries(set).every(([k, v]) => f[k as keyof NoteFilters] === v);
}

function PitchSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="pg-select" value={value} onChange={e => onChange(e.target.value)}>
      {RANGE_PITCHES.map(p => <option key={p} value={p}>{p}{LANDMARKS[p] ? ` (${LANDMARKS[p]})` : ""}</option>)}
    </select>
  );
}
