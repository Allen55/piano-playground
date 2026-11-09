"use client";

import { useRef, useState } from "react";
import { playNotes } from "@/lib/audio";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Plays a row of chords in order, two beats each, and reports which one is sounding. */
export function useStripPlayer(chords: number[][], bpm: number) {
  const [active, setActive] = useState<number | null>(null);
  const stopRef = useRef(true);
  const chordsRef = useRef(chords); chordsRef.current = chords;
  const bpmRef = useRef(bpm); bpmRef.current = bpm;

  const stop = () => { stopRef.current = true; setActive(null); };
  const play = async (loop = false) => {
    stopRef.current = false;
    do {
      for (let i = 0; i < chordsRef.current.length && !stopRef.current; i++) {
        const beat = 60000 / bpmRef.current;
        setActive(i);
        await playNotes(chordsRef.current[i], false, (beat * 1.8) / 1000);
        await sleep(beat * 2);
      }
    } while (loop && !stopRef.current && chordsRef.current.length);
    setActive(null);
    stopRef.current = true;
  };
  const toggle = (loop = false) => (stopRef.current ? play(loop) : stop());
  return { active, playing: active !== null, stop, toggle };
}
