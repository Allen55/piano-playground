export type Mode = "major" | "minor";
export type ScaleType = "major" | "natural minor" | "harmonic minor" | "melodic minor" | "major pentatonic" | "minor pentatonic" | "blues" | "dorian" | "mixolydian" | "lydian";
export type Quality = keyof typeof CHORDS;
export type Hand = "left" | "right";
export type ToneRole = "root" | "third" | "fifth" | "seventh" | "extension";
export type VoicedNote = { midi: number; name: string; hand: Hand; role: ToneRole; finger?: number };
export type Voicing = { id: string; label: string; notes: VoicedNote[]; description: string };
export type Chord = { root: string; quality: Quality; symbol: string; fullName: string; notes: string[]; formula: string[]; intervals: number[]; roles: ToneRole[] };
export type ProgressionStep = { id: string; degree: number; quality: Quality; root?: string; beats: number; voicingId?: string };
export type Progression = { id: string; name: string; mood: string; genre: string; description: string; numerals: string[]; tempo: number; steps: ProgressionStep[] };

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const MAJOR_KEYS = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"];
export const MINOR_KEYS = ["A", "E", "B", "F♯", "C♯", "G♯", "D♯", "B♭", "F", "C", "G", "D"];
export const KEY_SIGNATURES: Record<string, string> = { C: "No sharps or flats", G: "1 sharp · F♯", D: "2 sharps · F♯ C♯", A: "3 sharps · F♯ C♯ G♯", E: "4 sharps · F♯ C♯ G♯ D♯", B: "5 sharps · F♯ C♯ G♯ D♯ A♯", "F♯": "6 sharps · F♯ C♯ G♯ D♯ A♯ E♯", "D♭": "5 flats · B♭ E♭ A♭ D♭ G♭", "A♭": "4 flats · B♭ E♭ A♭ D♭", "E♭": "3 flats · B♭ E♭ A♭", "B♭": "2 flats · B♭ E♭", F: "1 flat · B♭" };
const SCALES: Record<ScaleType, number[]> = {
  major: [0,2,4,5,7,9,11], "natural minor": [0,2,3,5,7,8,10], "harmonic minor": [0,2,3,5,7,8,11], "melodic minor": [0,2,3,5,7,9,11],
  "major pentatonic": [0,2,4,7,9], "minor pentatonic": [0,3,5,7,10], blues: [0,3,5,6,7,10],
  dorian: [0,2,3,5,7,9,10], mixolydian: [0,2,4,5,7,9,10], lydian: [0,2,4,6,7,9,11],
};
type ChordDef = { name: string; suffix: string; intervals: number[]; degrees: number[]; formula: string[] };
export const CHORDS = {
  major: { name: "Major", suffix: "", intervals: [0,4,7], degrees: [1,3,5], formula: ["1","3","5"] },
  minor: { name: "Minor", suffix: "m", intervals: [0,3,7], degrees: [1,3,5], formula: ["1","♭3","5"] },
  diminished: { name: "Diminished", suffix: "dim", intervals: [0,3,6], degrees: [1,3,5], formula: ["1","♭3","♭5"] },
  augmented: { name: "Augmented", suffix: "+", intervals: [0,4,8], degrees: [1,3,5], formula: ["1","3","♯5"] },
  sus2: { name: "Suspended second", suffix: "sus2", intervals: [0,2,7], degrees: [1,2,5], formula: ["1","2","5"] },
  sus4: { name: "Suspended fourth", suffix: "sus4", intervals: [0,5,7], degrees: [1,4,5], formula: ["1","4","5"] },
  power: { name: "Power chord", suffix: "5", intervals: [0,7], degrees: [1,5], formula: ["1","5"] },
  maj7: { name: "Major seventh", suffix: "maj7", intervals: [0,4,7,11], degrees: [1,3,5,7], formula: ["1","3","5","7"] },
  dom7: { name: "Dominant seventh", suffix: "7", intervals: [0,4,7,10], degrees: [1,3,5,7], formula: ["1","3","5","♭7"] },
  min7: { name: "Minor seventh", suffix: "m7", intervals: [0,3,7,10], degrees: [1,3,5,7], formula: ["1","♭3","5","♭7"] },
  minMaj7: { name: "Minor-major seventh", suffix: "m(maj7)", intervals: [0,3,7,11], degrees: [1,3,5,7], formula: ["1","♭3","5","7"] },
  halfDim7: { name: "Half-diminished seventh", suffix: "m7♭5", intervals: [0,3,6,10], degrees: [1,3,5,7], formula: ["1","♭3","♭5","♭7"] },
  dim7: { name: "Diminished seventh", suffix: "dim7", intervals: [0,3,6,9], degrees: [1,3,5,7], formula: ["1","♭3","♭5","♭♭7"] },
  maj9: { name: "Major ninth", suffix: "maj9", intervals: [0,4,7,11,14], degrees: [1,3,5,7,9], formula: ["1","3","5","7","9"] },
  min9: { name: "Minor ninth", suffix: "m9", intervals: [0,3,7,10,14], degrees: [1,3,5,7,9], formula: ["1","♭3","5","♭7","9"] },
  dom9: { name: "Dominant ninth", suffix: "9", intervals: [0,4,7,10,14], degrees: [1,3,5,7,9], formula: ["1","3","5","♭7","9"] },
  maj11: { name: "Major eleventh", suffix: "maj11", intervals: [0,4,7,11,14,17], degrees: [1,3,5,7,9,11], formula: ["1","3","5","7","9","11"] },
  min11: { name: "Minor eleventh", suffix: "m11", intervals: [0,3,7,10,14,17], degrees: [1,3,5,7,9,11], formula: ["1","♭3","5","♭7","9","11"] },
  dom11: { name: "Dominant eleventh", suffix: "11", intervals: [0,4,7,10,14,17], degrees: [1,3,5,7,9,11], formula: ["1","3","5","♭7","9","11"] },
  maj13: { name: "Major thirteenth", suffix: "maj13", intervals: [0,4,7,11,14,21], degrees: [1,3,5,7,9,13], formula: ["1","3","5","7","9","13"] },
  min13: { name: "Minor thirteenth", suffix: "m13", intervals: [0,3,7,10,14,21], degrees: [1,3,5,7,9,13], formula: ["1","♭3","5","♭7","9","13"] },
  dom13: { name: "Dominant thirteenth", suffix: "13", intervals: [0,4,7,10,14,21], degrees: [1,3,5,7,9,13], formula: ["1","3","5","♭7","9","13"] },
  dom7b9: { name: "Dominant flat ninth", suffix: "7♭9", intervals: [0,4,7,10,13], degrees: [1,3,5,7,9], formula: ["1","3","5","♭7","♭9"] },
  dom7s9: { name: "Dominant sharp ninth", suffix: "7♯9", intervals: [0,4,7,10,15], degrees: [1,3,5,7,9], formula: ["1","3","5","♭7","♯9"] },
  dom7s11: { name: "Dominant sharp eleventh", suffix: "7♯11", intervals: [0,4,7,10,18], degrees: [1,3,5,7,11], formula: ["1","3","5","♭7","♯11"] },
  dom7b13: { name: "Dominant flat thirteenth", suffix: "7♭13", intervals: [0,4,7,10,20], degrees: [1,3,5,7,13], formula: ["1","3","5","♭7","♭13"] },
  dom7sus4: { name: "Dominant suspended fourth", suffix: "7sus4", intervals: [0,5,7,10], degrees: [1,4,5,7], formula: ["1","4","5","♭7"] },
  dom9sus4: { name: "Ninth suspended fourth", suffix: "9sus4", intervals: [0,5,7,10,14], degrees: [1,4,5,7,9], formula: ["1","4","5","♭7","9"] },
  six: { name: "Major sixth", suffix: "6", intervals: [0,4,7,9], degrees: [1,3,5,6], formula: ["1","3","5","6"] },
  min6: { name: "Minor sixth", suffix: "m6", intervals: [0,3,7,9], degrees: [1,3,5,6], formula: ["1","♭3","5","6"] },
  six9: { name: "Six nine", suffix: "6/9", intervals: [0,4,7,9,14], degrees: [1,3,5,6,9], formula: ["1","3","5","6","9"] },
  add9: { name: "Add ninth", suffix: "add9", intervals: [0,4,7,14], degrees: [1,3,5,9], formula: ["1","3","5","9"] },
} satisfies Record<string, ChordDef>;

export function pitchClass(name: string): number { const letter = name[0]?.toUpperCase(); if (!(letter in NATURAL)) throw new Error(`Invalid note ${name}`); const accidentals = [...name.slice(1)].reduce((v,c) => v + (c === "♯" || c === "#" ? 1 : c === "♭" || c === "b" ? -1 : 0), 0); return (NATURAL[letter] + accidentals + 24) % 12; }
export function spell(root: string, degree: number, semitones: number): string { const index = LETTERS.indexOf(root[0].toUpperCase()); const letter = LETTERS[(index + degree - 1) % 7]; const target = (pitchClass(root) + semitones) % 12; let diff = (target - NATURAL[letter] + 12) % 12; if (diff > 6) diff -= 12; return letter + (diff > 0 ? "♯".repeat(diff) : "♭".repeat(-diff)); }
export function scaleNotes(root: string, type: ScaleType): string[] { const degrees = type === "major pentatonic" ? [1,2,3,5,6] : type === "minor pentatonic" ? [1,3,4,5,7] : type === "blues" ? [1,3,4,4,5,7] : [1,2,3,4,5,6,7]; return SCALES[type].map((semitones,i) => i === 3 && type === "blues" ? spell(root,4,semitones) : spell(root,degrees[i],semitones)); }
export function scaleDegreeLabels(type: ScaleType): string[] { const labels:Record<ScaleType,string[]>={major:["1","2","3","4","5","6","7"],"natural minor":["1","2","♭3","4","5","♭6","♭7"],"harmonic minor":["1","2","♭3","4","5","♭6","7"],"melodic minor":["1","2","♭3","4","5","6","7"],"major pentatonic":["1","2","3","5","6"],"minor pentatonic":["1","♭3","4","5","♭7"],blues:["1","♭3","4","♯4","5","♭7"],dorian:["1","2","♭3","4","5","6","♭7"],mixolydian:["1","2","3","4","5","6","♭7"],lydian:["1","2","3","♯4","5","6","7"]};return labels[type]; }
export function makeChord(root: string, quality: Quality): Chord { const def = CHORDS[quality]; const roles = def.degrees.map((d): ToneRole => d === 1 ? "root" : d === 3 ? "third" : d === 5 ? "fifth" : d === 7 ? "seventh" : "extension"); return { root, quality, symbol: root + def.suffix, fullName: `${root} ${def.name}`, notes: def.intervals.map((n,i) => spell(root,def.degrees[i],n)), formula: [...def.formula], intervals: [...def.intervals], roles }; }
export function midiName(midi: number, preferred?: string): string { const defaults = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"]; const name=preferred??defaults[midi%12]; const accidental=[...name.slice(1)].reduce((v,c)=>v+(c==="♯"||c==="#"?1:c==="♭"||c==="b"?-1:0),0); const octave=(midi-NATURAL[name[0]]-accidental)/12-1; return `${name}${octave}`; }
export function keyInfo(tonic: string, mode: Mode) { const index = (mode === "major" ? MAJOR_KEYS : MINOR_KEYS).indexOf(tonic); const relative = mode === "major" ? MINOR_KEYS[index] : MAJOR_KEYS[index]; return { relative, signature: KEY_SIGNATURES[mode === "major" ? tonic : relative], notes: scaleNotes(tonic, mode === "major" ? "major" : "natural minor") }; }
export function diatonicChords(tonic: string, mode: Mode, sevenths = false) { const notes = keyInfo(tonic,mode).notes; const majorTriads: Quality[] = sevenths ? ["maj7","min7","min7","maj7","dom7","min7","halfDim7"] : ["major","minor","minor","major","major","minor","diminished"]; const minorTriads: Quality[] = sevenths ? ["min7","halfDim7","maj7","min7","min7","maj7","dom7"] : ["minor","diminished","major","minor","minor","major","major"]; const numerals = mode === "major" ? ["I","ii","iii","IV","V","vi","vii°"] : ["i","ii°","III","iv","v","VI","VII"]; return notes.map((root,i) => ({ numeral: numerals[i], chord: makeChord(root,(mode === "major" ? majorTriads : minorTriads)[i]) })); }
export function stepChord(step: ProgressionStep, tonic: string, mode: Mode): Chord { const root = step.root ?? keyInfo(tonic,mode).notes[(step.degree - 1) % 7]; return makeChord(root,step.quality); }

type PresetTemplate = { id: string; name: string; mood: string; genre: string; description: string; tempo: number; major: [number,Quality,string?][]; minor: [number,Quality,string?][]; majorNumerals: string[]; minorNumerals: string[] };
const PRESETS: PresetTemplate[] = [
  { id: "dreamy", name: "Afterglow", mood: "Dreamy", genre: "Ambient", description: "Warm seventh chords and a gentle return home.", tempo: 78, major: [[4,"maj7"],[1,"maj7"],[2,"min7"],[5,"dom9"]], minor: [[4,"min7"],[1,"min7"],[6,"maj7"],[5,"dom7"]], majorNumerals: ["IVmaj7","Imaj7","ii7","V9"], minorNumerals: ["iv7","i7","VImaj7","V7 · harmonic minor"] },
  { id: "jazz", name: "Blue Hour", mood: "Jazz", genre: "Jazz", description: "A classic ii–V–I with room to hear each resolution.", tempo: 104, major: [[2,"min7"],[5,"dom7"],[1,"maj7"]], minor: [[2,"halfDim7"],[5,"dom7"],[1,"minMaj7"]], majorNumerals: ["ii7","V7","Imaj7"], minorNumerals: ["iiø7","V7 · harmonic minor","i(maj7)"] },
  { id: "soulful", name: "Golden Thread", mood: "Soulful", genre: "Neo-soul", description: "Rich ninths and a dominant thirteenth make each change glow.", tempo: 88, major: [[1,"maj9"],[6,"min9"],[4,"maj9"],[5,"dom13"]], minor: [[1,"min9"],[6,"maj9"],[4,"min9"],[5,"dom7b9"]], majorNumerals: ["Imaj9","vi9","IVmaj9","V13"], minorNumerals: ["i9","VImaj9","iv9","V7♭9 · harmonic minor"] },
  { id: "uplifting", name: "Open Skies", mood: "Uplifting", genre: "Pop", description: "A familiar open-hearted pop cycle.", tempo: 112, major: [[1,"major"],[5,"major"],[6,"minor"],[4,"major"]], minor: [[6,"major"],[3,"major"],[7,"major"],[1,"minor"]], majorNumerals: ["I","V","vi","IV"], minorNumerals: ["VI","III","VII","i"] },
  { id: "bittersweet", name: "Passing Clouds", mood: "Nostalgic", genre: "Cinematic", description: "A borrowed minor subdominant adds a tender shadow.", tempo: 72, major: [[1,"major"],[4,"major"],[4,"minor"],[1,"major"]], minor: [[1,"minor"],[6,"major"],[4,"minor"],[1,"minor"]], majorNumerals: ["I","IV","iv · borrowed from minor","I"], minorNumerals: ["i","VI","iv","i"] },
];
export function makePresets(mode: Mode): Progression[] { return PRESETS.map(p => ({ id:p.id, name:p.name, mood:p.mood, genre:p.genre, description:p.description, tempo:p.tempo, numerals:mode === "major" ? p.majorNumerals : p.minorNumerals, steps:(mode === "major" ? p.major : p.minor).map(([degree,quality,root],i) => ({ id:`${p.id}-${i}`, degree, quality, root, beats:4 })) })); }

function noteAt(root: string, octave: number) { return 12 * (octave + 1) + pitchClass(root); }
function fingers(notes: VoicedNote[]): VoicedNote[] { const sorted = [...notes].sort((a,b)=>a.midi-b.midi); const range = sorted.at(-1)!.midi - sorted[0].midi; if (range > 12 || sorted.length > 5) return sorted; const pattern = sorted[0].hand === "right" ? ({1:[1],2:[1,5],3:[1,3,5],4:[1,2,3,5],5:[1,2,3,4,5]} as Record<number,number[]>) : ({1:[5],2:[5,1],3:[5,3,1],4:[5,3,2,1],5:[5,4,3,2,1]} as Record<number,number[]>); return sorted.map((n,i)=>({ ...n, finger:pattern[sorted.length]?.[i] })); }
function buildVoicing(chord: Chord, id: string, label: string, rh: VoicedNote[], lh: VoicedNote[], description: string): Voicing { return { id,label,description,notes:[...fingers(lh),...fingers(rh)] }; }
export function makeVoicings(chord: Chord): Voicing[] {
  const count = chord.notes.length; const basic = chord.intervals.map((_,i)=>i); const root = noteAt(chord.root,2); const bass: VoicedNote[] = [{midi:root,name:chord.root,hand:"left",role:"root",finger:5}];
  const rightBase = noteAt(chord.root,4); const fitRight = (midi:number, interval:number) => { if(interval>=20)midi-=12; while(midi>83)midi-=12; return midi; }; const compact = basic.filter(i => count <= 4 || (i !== 0 && i !== 2)).slice(0,5);
  const voices: Voicing[] = [];
  const close = compact.map(i=>({ midi:fitRight(rightBase+chord.intervals[i],chord.intervals[i]), name:chord.notes[i], hand:"right" as Hand, role:chord.roles[i] }));
  voices.push(buildVoicing(chord,"root","Root position",close,bass,"The root anchors the left hand while the right hand carries the harmony."));
  const inversionCount = Math.min(count,4);
  for (let turn=1;turn<inversionCount;turn++) { const idx = count>4 ? basic.slice(0,4) : compact; const shifted = idx.map((index,i)=>({ midi:fitRight(rightBase+chord.intervals[index]+(i<turn?12:0),chord.intervals[index]), name:chord.notes[index], hand:"right" as Hand, role:chord.roles[index] })).sort((a,b)=>a.midi-b.midi); voices.push(buildVoicing(chord,`inv${turn}`,`${["","1st","2nd","3rd"][turn]} inversion`,shifted,bass,`${chord.notes[turn]} becomes the lowest right-hand tone. Extensions are omitted for this compact inversion.`)); }
  if (count >= 4) {
    const open = compact.map((i,n)=>({ midi:fitRight(rightBase+chord.intervals[i]+(n%2?12:0),chord.intervals[i]), name:chord.notes[i], hand:"right" as Hand, role:chord.roles[i] })).sort((a,b)=>a.midi-b.midi);
    voices.push(buildVoicing(chord,"open","Open spread",open,bass,"Space between voices gives the chord a wider sound."));
    const seventhIndex = chord.roles.indexOf("seventh"); const thirdIndex = chord.roles.indexOf("third");
    if (seventhIndex >= 0 && thirdIndex >= 0) {
      const shellLeft = [{midi:root,name:chord.root,hand:"left" as Hand,role:"root" as ToneRole},{midi:noteAt(chord.root,3)+chord.intervals[seventhIndex],name:chord.notes[seventhIndex],hand:"left" as Hand,role:"seventh" as ToneRole}];
      const shellRight = [thirdIndex,...basic.filter(i=>chord.roles[i]==="extension").slice(0,2)].map(i=>({ midi:fitRight(rightBase+chord.intervals[i],chord.intervals[i]),name:chord.notes[i],hand:"right" as Hand,role:chord.roles[i] }));
      voices.push(buildVoicing(chord,"shell","Shell + color",shellRight,shellLeft,"The left hand plays root and seventh; the right adds the third and color tones."));
      const guide = [thirdIndex,seventhIndex,...basic.filter(i=>chord.roles[i]==="extension").slice(0,2)];
      voices.push(buildVoicing(chord,"rootless","Rootless jazz",guide.map(i=>({midi:fitRight(rightBase+chord.intervals[i],chord.intervals[i]),name:chord.notes[i],hand:"right",role:chord.roles[i]})),[{midi:noteAt(chord.root,3)+chord.intervals[thirdIndex],name:chord.notes[thirdIndex],hand:"left",role:"third"}],"Guide tones define the quality; a bassist can supply the root."));
    }
    if (compact.length === 4) { const ordered=[...close].sort((a,b)=>a.midi-b.midi); const drop=ordered.map((n,i)=>i===ordered.length-2?{...n,midi:n.midi-12}:n); voices.push(buildVoicing(chord,"drop2","Drop 2",drop.filter(n=>n.midi>=60),[...bass,...drop.filter(n=>n.midi<60).map(n=>({...n,hand:"left" as Hand}))],"The second-highest note drops an octave for a transparent jazz shape.")); }
  }
  return voices;
}
export function voiceLeadingCost(previous: Voicing, next: Voicing): number { const a = previous.notes.filter(n=>n.hand==="right").map(n=>n.midi).sort((x,y)=>x-y); const b = next.notes.filter(n=>n.hand==="right").map(n=>n.midi).sort((x,y)=>x-y); const len = Math.min(a.length,b.length); let cost = 0; for(let i=0;i<len;i++) cost += Math.abs(a[Math.round(i*(a.length-1)/Math.max(1,len-1))]-b[Math.round(i*(b.length-1)/Math.max(1,len-1))]); cost += 4*Math.abs(a.length-b.length); const right = next.notes.filter(n=>n.hand==="right"); if(right.length && Math.max(...right.map(n=>n.midi))-Math.min(...right.map(n=>n.midi))>12) cost+=20; const left = next.notes.filter(n=>n.hand==="left"); if(left.length && right.length && Math.max(...left.map(n=>n.midi))>=Math.min(...right.map(n=>n.midi))) cost+=30; return cost; }
export function nearestVoicing(previous: Voicing, chord: Chord): Voicing { return makeVoicings(chord).reduce((best,v)=>voiceLeadingCost(previous,v)<voiceLeadingCost(previous,best)?v:best); }
export function optimizeProgression(steps: ProgressionStep[], tonic: string, mode: Mode): ProgressionStep[] { if(!steps.length) return []; const choices = steps.map(s=>makeVoicings(stepChord(s,tonic,mode))); const costs: number[][] = choices.map(()=>[]); const paths: number[][] = choices.map(()=>[]); choices[0].forEach((v,j)=>{costs[0][j]=v.id==="root"?0:2;paths[0][j]=-1;}); for(let i=1;i<choices.length;i++) choices[i].forEach((v,j)=>{ let best=Infinity,which=0; choices[i-1].forEach((p,k)=>{const c=costs[i-1][k]+voiceLeadingCost(p,v)+(v.id==="open"?4:0);if(c<best){best=c;which=k;}});costs[i][j]=best;paths[i][j]=which;}); let index=costs.at(-1)!.indexOf(Math.min(...costs.at(-1)!)); const selected=new Array(steps.length); for(let i=steps.length-1;i>=0;i--){selected[i]=choices[i][index].id;index=paths[i][index];} return steps.map((s,i)=>({...s,voicingId:selected[i]})); }
