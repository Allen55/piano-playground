import "./chart.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ChordChartToggle } from "@/components/chord-chart-toggle";
import { PrintPageButton } from "@/components/print-page-button";
import { KeyboardDefs, KeyboardSvg } from "@/components/keyboard-svg";
import { LAUNCH_QUALITIES, chordAltText, chordPages, chordSlug, inversions } from "@/lib/reference";

export const metadata: Metadata = {
  title: "Piano Chord Chart: All Chords with Notes and Inversions",
  description: "Every major, minor, diminished, augmented, sus2, sus4 and seventh chord on a piano keyboard diagram, with notes, root position and every inversion.",
  alternates: { canonical: "/chords/" },
};

export default function ChordsChart() {
  const groups = [["Major chords", "major"], ["Minor chords", "minor"], ["Diminished chords", "diminished"], ["Augmented chords", "augmented"], ["Suspended second (sus2) chords", "sus2"], ["Suspended fourth (sus4) chords", "sus4"],
    ["Dominant seventh (7) chords", "dom7"], ["Major seventh (maj7) chords", "maj7"], ["Minor seventh (m7) chords", "min7"],
    ["Half-diminished seventh (m7♭5) chords", "halfDim7"], ["Diminished seventh (dim7) chords", "dim7"]] as const;
  return (
    <>
      <h1>Piano chord chart</h1>
      <p className="lede">All {chordPages(LAUNCH_QUALITIES).length} chords on the keyboard: major, minor, diminished, augmented, sus2, sus4 and the five common seventh chords. Switch between root position and each inversion; the notes are listed on every card. Printing gives a light, black-and-white friendly copy of whichever inversion is selected.</p>
      <p><PrintPageButton label="Print chord chart" /></p>
      <KeyboardDefs />
      <ChordChartToggle>
        {groups.map(([title, quality]) => (
          <section key={quality}>
            <h2>{title}</h2>
            <div className="chart-grid">
              {chordPages([quality]).map(chord => (
                <div className={`chart-card${chord.notes.length === 3 ? " chart-triad" : ""}`} key={chordSlug(chord)}>
                  <h3><Link href={`/chords/${chordSlug(chord)}/`}>{chord.symbol}</Link> <span style={{ fontWeight: 400, fontSize: 14, color: "#8d9ba2" }}>{chord.fullName}</span></h3>
                  <p className="chart-notes">{chord.notes.join(" ")}</p>
                  {inversions(chord).map(i => (
                    <div key={i.index} className={`chart-inv-${i.index}`}>
                      <KeyboardSvg shared label={chordAltText(chord, i)} notes={i.midi.map((midi, n) => ({ midi, role: i.roles[n], label: i.names[n] }))} />
                      <p className="chart-notes" style={{ marginTop: 6 }}>{i.label}: {i.names.join(" – ")}</p>
                    </div>
                  ))}
                  {chord.notes.length === 3 && <p className="chart-notes chart-no-3">Triads have no 3rd inversion, so root position is shown.</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </ChordChartToggle>
    </>
  );
}
