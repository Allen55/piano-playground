"use client";

/** Opens the browser's print dialog for pages that print as they are (the chord chart uses its print stylesheet). */
export function PrintPageButton({ label = "Print or save as PDF" }: { label?: string }) {
  return <button type="button" className="play-btn print-btn" onClick={() => window.print()}>{label}</button>;
}
