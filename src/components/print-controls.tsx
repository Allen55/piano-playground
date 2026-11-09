"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type Paper = "letter" | "A4";

/** Letter for US and Canadian browsers, A4 everywhere else; the reader can switch before printing. */
export function usePaper() {
  const [paper, setPaper] = useState<Paper>("letter");
  useEffect(() => {
    const lang = navigator.language || "en-US";
    if (!/^(en-US|en-CA|es-US|fr-CA)$/i.test(lang)) setPaper("A4");
  }, []);
  return [paper, setPaper] as const;
}

/** Page size and margins for the browser's print dialog. */
export function PageStyle({ paper }: { paper: Paper }) {
  return <style>{`@page{size:${paper} portrait;margin:12mm}`}</style>;
}

export function PaperPicker({ paper, onChange }: { paper: Paper; onChange: (paper: Paper) => void }) {
  return (
    <span className="seg" role="group" aria-label="Paper size">
      {(["letter", "A4"] as const).map(p => <button key={p} type="button" aria-pressed={paper === p} onClick={() => onChange(p)}>{p === "letter" ? "US Letter" : "A4"}</button>)}
    </span>
  );
}

export function PrintButton() {
  return <button type="button" className="print-go" onClick={() => window.print()}>Print or save as PDF</button>;
}

/**
 * Toolbar plus wrapper for sheets whose diagrams are all in the HTML. The chosen inversion is a data attribute,
 * and print.css shows only the matching diagrams, like the chord chart.
 */
export function PrintSheet({ backHref, backLabel, inversions, children }: { backHref: string; backLabel: string; inversions: string[]; children: React.ReactNode }) {
  const [paper, setPaper] = usePaper();
  const [inv, setInv] = useState(0);
  return (
    <>
      <PageStyle paper={paper} />
      <div className="print-controls">
        <Link href={backHref}>← {backLabel}</Link>
        <PaperPicker paper={paper} onChange={setPaper} />
        <span className="seg" role="group" aria-label="Inversion">
          {inversions.map((label, i) => <button key={label} type="button" aria-pressed={inv === i} onClick={() => setInv(i)}>{label}</button>)}
        </span>
        <PrintButton />
      </div>
      <div className="sheet" data-inv={inv}>{children}</div>
    </>
  );
}
