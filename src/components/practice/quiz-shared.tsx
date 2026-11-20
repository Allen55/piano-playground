"use client";
// Pieces shared by the note-reading and interval quizzes: score, the Pass / Reveal → Next flow keys, and filter controls.
import { useEffect, useRef, useState } from "react";

export type Outcome = "correct" | "wrong" | "passed";
export type Score = { correct: number; answered: number; streak: number; best: number; passes: number };
export const EMPTY_SCORE: Score = { correct: 0, answered: 0, streak: 0, best: 0, passes: 0 };

/** Passing reveals the answer without touching correct, answered or the streak. */
export function scoreAfter(s: Score, outcome: Outcome): Score {
  if (outcome === "passed") return { ...s, passes: s.passes + 1 };
  if (outcome === "wrong") return { ...s, answered: s.answered + 1, streak: 0 };
  const streak = s.streak + 1;
  return { ...s, correct: s.correct + 1, answered: s.answered + 1, streak, best: Math.max(s.best, streak) };
}

export function ScoreBar({ score, onReset }: { score: Score; onReset: () => void }) {
  return (
    <div className="pg-score" aria-label="Score">
      <span><b data-score="correct">{score.correct}</b> / <b data-score="answered">{score.answered}</b> correct</span>
      <span>Streak <b data-score="streak">{score.streak}</b>{score.best > 0 && <small> (best {score.best})</small>}</span>
      <span>Passes <b data-score="passes">{score.passes}</b></span>
      <button type="button" className="pg-link" onClick={onReset}>Reset score</button>
    </div>
  );
}

/** Keyboard flow: letters (while asking), P to pass, Enter for the next question once the answer shows. */
export function useQuizKeys(active: boolean, revealed: boolean, handlers: { onLetter?: (letter: string) => void; onPass: () => void; onNext: () => void }) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      const key = e.key.toLowerCase();
      if (key === "enter") {
        if (!revealed) return;
        // Stop Enter from also clicking the focused button, which would skip a question.
        e.preventDefault();
        ref.current.onNext();
      } else if (key === "p" && !revealed) {
        e.preventDefault();
        ref.current.onPass();
      } else if (/^[a-g]$/.test(key) && !revealed && ref.current.onLetter) {
        e.preventDefault();
        ref.current.onLetter(key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, revealed]);
}

/** True below 900px wide, where the piano adds a zoomed strip. False during server render. */
export function useCompact(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

/** Filters remembered in this browser. Starts on `fallback` so the server and first client render match. */
export function useStoredState<T>(key: string, fallback: T): [T, (next: T) => void, boolean] {
  const [value, setValue] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue({ ...fallback, ...JSON.parse(raw) });
    } catch { /* storage blocked or bad data */ }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (next: T) => {
    setValue(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage blocked */ }
  };
  return [value, set, loaded];
}

export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="pg-field">
      <span className="pg-field-label">{label}</span>
      <span className="inv-tabs pg-seg" role="group" aria-label={label}>
        {options.map(([id, text]) => <button key={id} type="button" className="inv-tab" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}
      </span>
    </div>
  );
}

export function Toggles({ label, options, onToggle }: { label: string; options: { id: string; text: string; on: boolean }[]; onToggle: (id: string) => void }) {
  return (
    <div className="pg-field">
      <span className="pg-field-label">{label}</span>
      <span className="inv-tabs pg-seg" role="group" aria-label={label}>
        {options.map(o => <button key={o.id} type="button" className="inv-tab" aria-pressed={o.on} onClick={() => onToggle(o.id)}>{o.on ? "✓ " : ""}{o.text}</button>)}
      </span>
    </div>
  );
}

export function EmptyFilters({ reasons }: { reasons: string[] }) {
  return (
    <div className="pg-empty" role="alert">
      <b>No questions fit these filters.</b>
      <ul>{reasons.map(r => <li key={r}>{r}</li>)}</ul>
      <p>Adjust the filters below; the quiz restarts as soon as at least one question fits.</p>
    </div>
  );
}

export function FlowButtons({ revealed, onPass, onNext, nextLabel, disabled }: { revealed: boolean; onPass: () => void; onNext: () => void; nextLabel: string; disabled?: boolean }) {
  return (
    <div className="pg-flow">
      {revealed
        ? <button type="button" className="play-btn pg-next" onClick={onNext}>{nextLabel} <kbd>Enter</kbd></button>
        : <button type="button" className="inv-tab pg-pass" onClick={onPass} disabled={disabled}>Pass / Reveal <kbd>P</kbd></button>}
    </div>
  );
}
