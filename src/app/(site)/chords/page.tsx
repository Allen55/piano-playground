import "./chart.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ChordChartToggle } from "@/components/chord-chart-toggle";
import { KeyboardSvg } from "@/components/keyboard-svg";
import { chordAltText, chordPages, chordSlug, inversions } from "@/lib/reference";

export const metadata: Metadata = {
  title: "Piano Chord Chart: All Major and Minor Chords with Inversions",
  description: "Every major and minor piano chord on a keyboard diagram, with notes, root position and both inversions.",
  alternates: { canonical: "/chords/" },
};

export default function ChordsChart() {
  const groups = [["Major chords", "major"], ["Minor chords", "minor"]] as const;
  return (
    <>
      <h1>Piano chord chart</h1>
      <p className="lede">All 24 major and minor chords on the keyboard. Switch between root position and each inversion; the notes are listed on every card. Use your browser's print command for a one-page-per-section copy.</p>
      <ChordChartToggle>
        {groups.map(([title, quality]) => (
          <section key={quality}>
            <h2>{title}</h2>
            <div className="chart-grid">
              {chordPages([quality]).map(chord => (
                <div className="chart-card" key={chordSlug(chord)}>
                  <h3><Link href={`/chords/${chordSlug(chord)}/`}>{chord.symbol}</Link> <span style={{ fontWeight: 400, fontSize: 14, color: "#8d9ba2" }}>{chord.fullName}</span></h3>
                  <p className="chart-notes">{chord.notes.join(" ")}</p>
                  {inversions(chord).map(i => (
                    <div key={i.index} className={`chart-inv-${i.index}`}>
                      <KeyboardSvg label={chordAltText(chord, i)} notes={i.midi.map((midi, n) => ({ midi, role: i.roles[n], label: i.names[n] }))} />
                      <p className="chart-notes" style={{ marginTop: 6 }}>{i.label}: {i.names.join(" – ")}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </ChordChartToggle>
    </>
  );
}
