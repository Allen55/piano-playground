let synth: import("tone").PolySynth<import("tone").Synth> | null = null;
let toneModule: typeof import("tone") | null = null;
async function getSynth() {
  if (!toneModule) toneModule = await import("tone");
  await toneModule.start();
  if (!synth) synth = new toneModule.PolySynth(toneModule.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.012, decay: 0.22, sustain: 0.28, release: 1.05 } }).toDestination();
  synth.volume.value = -11;
  return { synth, tone: toneModule };
}
export async function playMidi(midi: number, length = 0.65) { const { synth, tone } = await getSynth(); synth.triggerAttackRelease(tone.Frequency(midi,"midi").toFrequency(), length); }
export async function playNotes(midis: number[], arpeggiate = false, length = 1.5) { const { synth, tone } = await getSynth(); const now = tone.now(); [...new Set(midis)].sort((a,b)=>a-b).forEach((midi,i)=>synth.triggerAttackRelease(tone.Frequency(midi,"midi").toFrequency(), length, now+(arpeggiate ? i*0.115 : 0), 0.68)); }
