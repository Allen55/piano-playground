import type { Metadata } from "next";
import Link from "next/link";
import { musicFont as music } from "@/components/music-font";
import { PracticeGame } from "@/components/practice/practice-game";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Piano Sight-Reading and Interval Trainer",
  description: "Practice reading notes in treble and bass clef, ledger lines and key signatures, then name, build and hear intervals on a full 88-key piano.",
  alternates: { canonical: "/practice/" },
};

export default function PracticePage() {
  return (
    <div className={`practice-wide ${music.variable}`}>
      <p className="crumbs"><Link href="/">Home</Link> / Practice</p>
      <h1>Sight-reading and interval trainer</h1>
      <p className="lede">Name notes on the staff, find them on all 88 keys, and train intervals by sight and by ear. Combine filters to practise exactly the notes you find hard.</p>
      <PracticeGame />
      <h2>How it works</h2>
      <ul>
        <li><b>Note reading</b>: answer with the A–G buttons, by typing A–G, or by clicking the exact key. Letters are graded by name; piano keys by pitch and octave, so C4 and C5 are different answers.</li>
        <li><b>Pass / Reveal</b> (or P) shows the answer without guessing. Passes are counted on their own and leave your score and streak alone. Press Enter or Next to move on.</li>
        <li><b>Study</b> lights the key for each note from the start, so you can connect staff positions to the keyboard before quizzing yourself.</li>
        <li><b>Intervals</b>: identify the interval between two written notes, build one on the piano from a starting note, or name it by ear. Full names tell enharmonic spellings apart, so C to F♯ is an augmented 4th and C to G♭ a diminished 5th.</li>
        <li>Middle C (C4) sits on the first ledger line below the treble staff and the first ledger line above the bass staff. The bottom line of the treble staff is E4; the fourth line of the bass staff is F3.</li>
      </ul>
    </div>
  );
}
