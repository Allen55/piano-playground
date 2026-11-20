"use client";
import { useEffect, useRef, useState } from "react";
import { playMidi, playNotes, playSequence } from "@/lib/audio";
import {
  DEFAULT_INTERVAL_FILTERS, INTERVAL_PRESETS, QUALITIES, QUALITY_NAME, earDistances, earName, eligibleIntervals, explainInterval, explainNoIntervals,
  intervalName, makeIntervalQuestion, withArticle, numberName, spellingChoices, specSemitones, type Exercise, type IntervalFilters, type IntervalQuestion, type IntervalSpec, type Quality,
} from "@/lib/intervals";
import { CLEF_NAME, midiOf, pitchName, samePitch, seededRng, type Pitch } from "@/lib/notation";
import { GrandPiano, type KeyMark } from "./grand-piano";
import { EMPTY_SCORE, EmptyFilters, FlowButtons, ScoreBar, Segmented, Toggles, scoreAfter, useQuizKeys, useStoredState, type Outcome, type Score } from "./quiz-shared";
import { StaffSvg } from "./staff-svg";

type Answer = { outcome: Outcome; choice?: string; midi?: number; spelling?: Pitch };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const specId = (s: IntervalSpec) => `${s.quality}${s.number}`;
const DIR_WORD = { up: "above", down: "below", together: "with" } as const;
/** Unisons have no direction to speak of. */
const dirWord = (q: IntervalQuestion) => (q.spec.number === 1 ? "with" : DIR_WORD[q.direction]);
const dirNote = (q: IntervalQuestion) => (q.spec.number === 1 ? "" : q.direction === "down" ? " (descending)" : q.direction === "together" ? " (harmonic)" : " (ascending)");

export function IntervalTrainer({ active, study, compact }: { active: boolean; study: boolean; compact: boolean }) {
  const [filters, setFilters, loaded] = useStoredState<IntervalFilters>("practice-interval-filters", DEFAULT_INTERVAL_FILTERS);
  const [q, setQ] = useState<IntervalQuestion | null>(() => makeIntervalQuestion(DEFAULT_INTERVAL_FILTERS, seededRng(9)));
  const [answer, setAnswer] = useState<Answer | null>(null);
  /** Build: the right key was found and the spelling is being chosen. */
  const [spellingStep, setSpellingStep] = useState(false);
  const [showWritten, setShowWritten] = useState(false);
  const [score, setScore] = useState<Score>(EMPTY_SCORE);
  const filtersKey = JSON.stringify(filters);
  const firstFilters = useRef(true);

  const reasons = explainNoIntervals(filters);
  const revealed = answer !== null;
  const ear = filters.exercise === "ear";

  const fresh = (f: IntervalFilters, lastId?: string) => {
    setQ(makeIntervalQuestion(f, Math.random, lastId));
    setAnswer(null); setSpellingStep(false); setShowWritten(false);
  };
  useEffect(() => {
    if (!loaded) return;
    if (firstFilters.current) { firstFilters.current = false; if (filtersKey === JSON.stringify(DEFAULT_INTERVAL_FILTERS)) return; }
    fresh(filters, q?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, loaded]);

  const play = (question = q) => {
    if (!question) return;
    const [a, b] = [midiOf(question.a), midiOf(question.b)];
    if (question.direction === "together") void playNotes([a, b], false, 1.6);
    else void playSequence([a, b]);
  };
  const finish = (a: Answer) => {
    if (!q || revealed) return;
    setAnswer(a); setSpellingStep(false);
    setScore(s => scoreAfter(s, a.outcome));
  };
  const pass = () => { finish({ outcome: "passed" }); };
  const next = () => {
    const n = makeIntervalQuestion(filters, Math.random, q?.id);
    setQ(n); setAnswer(null); setSpellingStep(false); setShowWritten(false);
    if (n && filters.exercise === "ear") play(n);
  };
  useQuizKeys(active, revealed, { onPass: pass, onNext: next });

  const choose = (id: string) => {
    if (!q) return;
    let right: boolean;
    if (ear) right = Number(id) === specSemitones(q.spec);
    else if (filters.answer === "number") right = Number(id) === q.spec.number;
    else right = id === specId(q.spec);
    finish({ outcome: right ? "correct" : "wrong", choice: id });
  };
  const pressKey = (midi: number) => {
    void playMidi(midi);
    if (!q || revealed || filters.exercise !== "build" || spellingStep) return;
    if (midi !== midiOf(q.b)) return finish({ outcome: "wrong", midi });
    if (filters.spelling) setSpellingStep(true);
    else finish({ outcome: "correct", midi });
  };
  const chooseSpelling = (p: Pitch) => finish({ outcome: samePitch(p, q!.b) ? "correct" : "wrong", midi: midiOf(q!.b), spelling: p });

  const set = (patch: Partial<IntervalFilters>) => setFilters({ ...filters, ...patch });
  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // Answer buttons for Identify and Ear.
  let options: { id: string; text: string }[] = [];
  if (ear) options = earDistances(filters).map(s => ({ id: String(s), text: earName(s) }));
  else if (filters.answer === "number") options = [...new Set(eligibleIntervals(filters).map(s => s.number))].sort((a, b) => a - b).map(n => ({ id: String(n), text: cap(numberName(n)) }));
  else options = eligibleIntervals(filters).map(s => ({ id: specId(s), text: cap(intervalName(s)) }));
  const rightId = q ? (ear ? String(specSemitones(q.spec)) : filters.answer === "number" ? String(q.spec.number) : specId(q.spec)) : "";

  // What the staff and piano show.
  const writtenVisible = !ear || showWritten;
  const marks = new Map<number, KeyMark>();
  if (q) {
    const [ma, mb] = [midiOf(q.a), midiOf(q.b)];
    const showBoth = revealed ? writtenVisible : study && !ear;
    if (filters.exercise === "build") marks.set(ma, "start");
    if (showBoth) {
      if (answer?.midi !== undefined && answer.midi !== mb) marks.set(answer.midi, "wrong");
      marks.set(ma, "start");
      marks.set(mb, revealed ? "target" : "study");
    }
  }
  const staffNotes = !q ? [] : filters.exercise === "build" && !revealed && !study ? [{ pitch: q.a }] : [{ pitch: q.a }, { pitch: q.b, tone: revealed && answer?.outcome !== "wrong" ? "correct" as const : "ink" as const }];
  const layout = q?.direction === "together" ? "harmonic" : staffNotes.length > 1 ? "melodic" : "single";
  const focus = q ? Math.round((midiOf(q.a) + (revealed || study ? midiOf(q.b) : midiOf(q.a))) / 2) : 60;

  let promptText = "";
  if (q) {
    if (filters.exercise === "identify") promptText = filters.answer === "number" ? "What is the interval number?" : "Name the interval: quality and number.";
    else if (filters.exercise === "build") promptText = `Find the note ${withArticle(intervalName(q.spec))} ${dirWord(q)} ${pitchName(q.a)} on the piano.`;
    else promptText = `Listen: two notes ${q.direction === "together" ? "played together" : q.direction === "up" ? "ascending" : "descending"}. What interval is it?`;
  }

  return (
    <div className="pg-stage" hidden={!active}>
      <section className="pg-staff-card" aria-live="polite">
        <div className="pg-paper">
          {q && writtenVisible
            ? <StaffSvg clef={q.clef} notes={staffNotes} layout={layout} label={revealed || study ? `${CLEF_NAME[q.clef]} clef: ${pitchName(q.a)} and ${pitchName(q.b)}` : `${CLEF_NAME[q.clef]} clef with ${staffNotes.length === 1 ? `starting note ${pitchName(q.a)}` : "two notes"}`} />
            : <div className="pg-listen"><StaffSvg clef={q?.clef ?? "treble"} notes={[]} label="Staff hidden for ear training" /><span>{q && ear ? (revealed ? "Staff hidden" : "Listen…") : ""}</span></div>}
        </div>
        <p className="pg-prompt">{q ? promptText : "Waiting for filters that fit."}</p>
        {q && ear && <button type="button" className="inv-tab" onClick={() => play()}>▶ {revealed ? "Play again" : "Play / Replay"}</button>}
        {q && ear && revealed && !showWritten && <button type="button" className="inv-tab pg-show" onClick={() => setShowWritten(true)}>Show staff & keyboard</button>}
        {q && !ear && <button type="button" className="inv-tab" onClick={() => play()}>▶ Hear it</button>}
      </section>

      <section className="pg-piano-card">
        <GrandPiano marks={marks} onKey={pressKey} compact={compact} focus={focus} label="88-key piano" />
        <p className="pg-hint">{filters.exercise === "build" ? "Click the key that completes the interval. The orange key is the starting note." : "Click any key to hear it."}</p>
      </section>

      <section className="pg-answers">
        {!q && <EmptyFilters reasons={reasons.length ? reasons : ["No interval fits inside the staff with these filters."]} />}
        {q && filters.exercise !== "build" && (
          <div className="pg-choices pg-choices-wide" role="group" aria-label="Interval answers">
            {options.map(o => (
              <button key={o.id} type="button" className="pg-choice" disabled={revealed} onClick={() => choose(o.id)}
                data-state={revealed && o.id === rightId ? "correct" : revealed && o.id === answer?.choice ? "wrong" : undefined}>{o.text}</button>
            ))}
          </div>
        )}
        {q && filters.exercise === "build" && (spellingStep || (revealed && answer?.spelling)) && (
          <div className="pg-spelling">
            <p>Right key. Which spelling is {withArticle(intervalName(q.spec))} {dirWord(q)} {pitchName(q.a)}?</p>
            <div className="pg-choices" role="group" aria-label="Spellings">
              {spellingChoices(q.b).map(p => (
                <button key={pitchName(p)} type="button" className="pg-choice" disabled={revealed} onClick={() => chooseSpelling(p)}
                  data-state={revealed && samePitch(p, q.b) ? "correct" : revealed && answer?.spelling && samePitch(p, answer.spelling) ? "wrong" : undefined}>{pitchName(p)}</button>
              ))}
            </div>
          </div>
        )}
        <FlowButtons revealed={revealed} onPass={pass} onNext={next} nextLabel="Next interval" disabled={!q} />
        <ScoreBar score={score} onReset={() => setScore(EMPTY_SCORE)} />
      </section>

      <section className="pg-feedback" aria-live="polite">
        {q && revealed && (
          <div className={`pg-result pg-${answer.outcome}`} data-outcome={answer.outcome}>
            <b>{answer.outcome === "correct" ? "Correct." : answer.outcome === "passed" ? "Passed." : "Not quite."}</b>{" "}
            {answer.outcome === "wrong" && wrongText(answer, options)}
            {ear
              ? <>It is <b>{withArticle(earName(specSemitones(q.spec)).toLowerCase())}</b> ({specSemitones(q.spec)} semitone{specSemitones(q.spec) === 1 ? "" : "s"}){writtenVisible ? <>, written here as {pitchName(q.a)} to {pitchName(q.b)}, {withArticle(intervalName(q.spec))}.</> : "."}</>
              : <>{pitchName(q.a)} to {pitchName(q.b)} is <b>{withArticle(intervalName(q.spec))}</b>{dirNote(q)}.</>}
            {writtenVisible && <p className="pg-explain">{explainInterval(q.a, q.b)}</p>}
          </div>
        )}
        {q && !revealed && <p className="pg-hint">Press P to pass and reveal; Enter for the next interval.</p>}
      </section>

      <details className="pg-filters" open>
        <summary>Interval filters</summary>
        <div className="pg-filter-grid">
          <Segmented<Exercise> label="Exercise" value={filters.exercise} onChange={exercise => set({ exercise })}
            options={[["identify", "Identify"], ["build", "Build"], ["ear", "Ear training"]]} />
          {filters.exercise === "identify" && (
            <Segmented label="Answer with" value={filters.answer} onChange={answer => set({ answer })}
              options={[["number", "Number only"], ["full", "Full name & quality"]]} />
          )}
          {filters.exercise === "build" && (
            <Segmented label="Spelling" value={filters.spelling ? "on" : "off"} onChange={v => set({ spelling: v === "on" })}
              options={[["on", "Pick the written spelling too"], ["off", "Key only"]]} />
          )}
          <Toggles label={ear ? "Clef (not used: ear training picks one to fit)" : "Clef"} options={[{ id: "treble", text: "Treble", on: filters.treble }, { id: "bass", text: "Bass", on: filters.bass }]}
            onToggle={id => set({ [id]: !filters[id as "treble" | "bass"] })} />
          <Toggles label="Direction" onToggle={id => set({ [id]: !filters[id as "up" | "down" | "together"] })}
            options={[{ id: "up", text: "Ascending", on: filters.up }, { id: "down", text: "Descending", on: filters.down }, { id: "together", text: "Together (harmonic)", on: filters.together }]} />
          <div className="pg-field pg-field-wide">
            <span className="pg-field-label">Presets</span>
            <span className="inv-tabs pg-seg" role="group" aria-label="Interval presets">
              {INTERVAL_PRESETS.map(p => (
                <button key={p.id} type="button" className="inv-tab" aria-pressed={sameSet(p.sizes, filters.sizes) && sameSet(p.qualities, filters.qualities)}
                  onClick={() => set({ sizes: p.sizes, qualities: p.qualities })}>{p.label}</button>
              ))}
            </span>
          </div>
          <Toggles label="Interval size" onToggle={id => set({ sizes: toggleIn(filters.sizes, Number(id)).sort((a, b) => a - b) })}
            options={Array.from({ length: 15 }, (_, i) => ({ id: String(i + 1), text: cap(numberName(i + 1)), on: filters.sizes.includes(i + 1) }))} />
          <Toggles label="Quality" onToggle={id => set({ qualities: toggleIn(filters.qualities, id as Quality) })}
            options={QUALITIES.map(qq => ({ id: qq, text: cap(QUALITY_NAME[qq]), on: filters.qualities.includes(qq) }))} />
        </div>
        <p className="pg-hint">Melodic intervals (ascending or descending) show the notes one after the other; harmonic intervals stack them. Ear training gives one answer per distance, so an augmented 4th and a diminished 5th are both “tritone”.</p>
        <button type="button" className="pg-link" onClick={() => setFilters(DEFAULT_INTERVAL_FILTERS)}>Reset filters</button>
      </details>
    </div>
  );
}

function wrongText(answer: Answer, options: { id: string; text: string }[]): string {
  if (answer.spelling) return `You spelled it ${pitchName(answer.spelling)}. `;
  if (answer.midi !== undefined) return `You played ${["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"][answer.midi % 12]}${Math.floor(answer.midi / 12) - 1}. `;
  const o = options.find(o => o.id === answer.choice);
  return o ? `You chose ${o.text.toLowerCase()}. ` : "";
}

const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every(x => b.includes(x));
