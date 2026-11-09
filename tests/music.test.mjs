import { test } from "node:test";
import assert from "node:assert/strict";
import { MAJOR_KEYS, MINOR_KEYS, diatonicChords, keyInfo, makeChord, makePresets, makeVoicings, midiName, nearestVoicing, optimizeProgression, pitchClass, scaleDegreeLabels, scaleNotes, stepChord, voiceLeadingCost } from "../src/lib/music.ts";

test("scales and relative keys work across all twelve paired keys", () => {
  for (let i=0;i<12;i++) {
    const major=scaleNotes(MAJOR_KEYS[i],"major");
    const minor=scaleNotes(MINOR_KEYS[i],"natural minor");
    assert.equal(major.length,7); assert.equal(minor.length,7);
    assert.equal(new Set(major.map(pitchClass)).size,7);
    assert.equal(new Set(minor.map(pitchClass)).size,7);
    assert.equal(keyInfo(MAJOR_KEYS[i],"major").relative,MINOR_KEYS[i]);
    assert.equal(keyInfo(MINOR_KEYS[i],"minor").relative,MAJOR_KEYS[i]);
  }
});
test("scales retain correct enharmonic spellings", () => {
  assert.deepEqual(scaleNotes("F♯","major"),["F♯","G♯","A♯","B","C♯","D♯","E♯"]);
  assert.deepEqual(scaleNotes("D♭","major"),["D♭","E♭","F","G♭","A♭","B♭","C"]);
  assert.deepEqual(scaleNotes("E","harmonic minor"),["E","F♯","G","A","B","C","D♯"]);
  assert.deepEqual(scaleDegreeLabels("minor pentatonic"),["1","♭3","4","5","♭7"]);
});
test("seventh, altered, and extended chords spell correctly", () => {
  assert.deepEqual(makeChord("G","maj7").notes,["G","B","D","F♯"]);
  assert.deepEqual(makeChord("D","dom13").notes,["D","F♯","A","C","E","B"]);
  assert.deepEqual(makeChord("B","dom7b9").notes,["B","D♯","F♯","A","C"]);
  assert.deepEqual(makeChord("C","dim7").notes,["C","E♭","G♭","B♭♭"]);
  assert.equal(midiName(72,"B♯"),"B♯4");
  assert.equal(midiName(59,"C♭"),"C♭4");
});
test("diatonic families and harmonic minor dominant are distinct", () => {
  assert.deepEqual(diatonicChords("G","major",true).map(x=>x.chord.symbol),["Gmaj7","Am7","Bm7","Cmaj7","D7","Em7","F♯m7♭5"]);
  const minorJazz=makePresets("minor").find(p=>p.id==="jazz");
  assert.deepEqual(stepChord(minorJazz.steps[1],"E","minor").notes,["B","D♯","F♯","A"]);
});
test("voicings fit within the default four octave keyboard", () => {
  for (const chord of [makeChord("G","maj9"),makeChord("D","dom13"),makeChord("B","dom7b9")]) {
    for (const voicing of makeVoicings(chord)) assert.ok(voicing.notes.every(n=>n.midi>=36&&n.midi<=83),`${chord.symbol} ${voicing.id}`);
  }
});
test("voice leading chooses available voicings and a nearest move", () => {
  const steps=makePresets("major").find(p=>p.id==="dreamy").steps;
  const result=optimizeProgression(steps,"G","major");
  assert.equal(result.length,steps.length);
  result.forEach(s=>assert.ok(makeVoicings(stepChord(s,"G","major")).some(v=>v.id===s.voicingId)));
  const first=makeVoicings(stepChord(result[0],"G","major")).find(v=>v.id===result[0].voicingId);
  const second=stepChord(result[1],"G","major");
  const nearest=nearestVoicing(first,second);
  assert.ok(voiceLeadingCost(first,nearest)<=voiceLeadingCost(first,makeVoicings(second)[0]));
});
