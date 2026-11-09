"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageStyle, PaperPicker, PrintButton, usePaper } from "@/components/print-controls";
import { SheetDiagram } from "@/components/sheet-diagram";
import { defaultTonic, getProgression, keysFor, progressionChords, progressionHref, stripSteps, tonicFromQuery, voiceLeadingText, type InversionMode } from "@/lib/progressions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const MODES: [InversionMode, string][] = [["smooth", "Smooth"], ["root", "Root position"], ["first", "1st inversion"], ["second", "2nd inversion"]];

/** Printable progression strip. Opens in the key and inversion passed from the progression page (?key=g-major&inv=smooth). */
export function ProgressionSheet({ slug }: { slug: string }) {
  const progression = getProgression(slug)!;
  const [paper, setPaper] = usePaper();
  const [tonic, setTonic] = useState(defaultTonic(progression.mode));
  const [mode, setMode] = useState<InversionMode>("smooth");
  useEffect(() => {
    const linked = tonicFromQuery(progression, window.location.search);
    if (linked) setTonic(linked);
    const inv = new URLSearchParams(window.location.search).get("inv");
    if (MODES.some(([id]) => id === inv)) setMode(inv as InversionMode);
  }, [progression]);

  const steps = stripSteps(progressionChords(progression, tonic), mode);
  const page = progressionHref(progression, tonic);
  return (
    <>
      <PageStyle paper={paper} />
      <div className="print-controls">
        <Link href={page}>← Back to {progression.name}</Link>
        <PaperPicker paper={paper} onChange={setPaper} />
        <label>Key
          <select value={tonic} onChange={e => setTonic(e.target.value)}>
            {keysFor(progression).map(k => <option key={k} value={k}>{k} {progression.mode}</option>)}
          </select>
        </label>
        <span className="seg" role="group" aria-label="Inversion">
          {MODES.map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}
        </span>
        <PrintButton />
      </div>
      <div className="sheet">
        <h1>{progression.name} in {tonic} {progression.mode}</h1>
        <p className="sheet-sub">{progression.numerals.join(" – ")} · {MODES.find(([id]) => id === mode)![1]}{mode === "smooth" ? " (each chord in the inversion closest to the one before)" : ""}</p>
        <div className="sheet-grid">
          {steps.map((step, i) => (
            <div key={i} className="sheet-card">
              <h3>{step.chord.symbol}<small>{progression.barsPerRow ? `Bar ${i + 1} · ` : ""}{progression.numerals[i]}</small></h3>
              <SheetDiagram chord={step.chord} inversion={step.inversion} midi={step.midi} />
              <p>{step.inversion.label}: {step.inversion.names.join(" ")}</p>
              {i > 0 && <p className="vl">From {steps[i - 1].chord.symbol}: {voiceLeadingText(steps[i - 1], step)}.</p>}
            </div>
          ))}
        </div>
        <p className="sheet-credit">{SITE_NAME} · {new URL(page, SITE_URL).href}</p>
      </div>
    </>
  );
}
