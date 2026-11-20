"use client";
import "./practice.css";
import { useState } from "react";
import { InstrumentToggle } from "@/components/instrument-toggle";
import { IntervalTrainer } from "./interval-trainer";
import { NoteReading } from "./note-reading";
import { Segmented, useCompact } from "./quiz-shared";

type Mode = "notes" | "intervals";

/** Sight-reading and interval trainer. Both modes stay mounted so switching keeps each score and question. */
export function PracticeGame() {
  const [mode, setMode] = useState<Mode>("notes");
  const [display, setDisplay] = useState<"quiz" | "study">("quiz");
  const compact = useCompact();
  return (
    <div className="pg">
      <div className="pg-bar">
        <span className="inv-tabs pg-modes" role="tablist" aria-label="Trainer">
          <button type="button" role="tab" className="inv-tab" aria-selected={mode === "notes"} aria-pressed={mode === "notes"} onClick={() => setMode("notes")}>Note reading</button>
          <button type="button" role="tab" className="inv-tab" aria-selected={mode === "intervals"} aria-pressed={mode === "intervals"} onClick={() => setMode("intervals")}>Intervals</button>
        </span>
        <Segmented label="Display" value={display} onChange={setDisplay} options={[["quiz", "Quiz"], ["study", "Study"]]} />
        <InstrumentToggle />
      </div>
      <NoteReading active={mode === "notes"} study={display === "study"} compact={compact} />
      <IntervalTrainer active={mode === "intervals"} study={display === "study"} compact={compact} />
    </div>
  );
}
