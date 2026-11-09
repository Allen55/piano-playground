"use client";

import { useState } from "react";

const OPTIONS = ["Root position", "1st inversion", "2nd inversion"];

// Every inversion is in the server-rendered HTML; this only switches which one is visible (see chart.css).
export function ChordChartToggle({ children }: { children: React.ReactNode }) {
  const [inv, setInv] = useState(0);
  return (
    <div className="chart" data-inv={inv}>
      <div className="inv-tabs chart-tabs" role="group" aria-label="Show inversion">
        {OPTIONS.map((label, i) => <button key={label} type="button" className="inv-tab" aria-pressed={i === inv} onClick={() => setInv(i)}>{label}</button>)}
      </div>
      {children}
    </div>
  );
}
