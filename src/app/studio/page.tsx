"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowLeftRight, ArrowRight, AudioLines, Bookmark, Check, ChevronLeft, ChevronRight, CircleHelp, Copy, Focus, Gauge, Keyboard, Layers3, LayoutGrid, Menu, Minus, Music2, Pause, Piano as PianoIcon, Play, Plus, RotateCcw, Save, Settings2, Shuffle, SlidersHorizontal, Sparkles, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChordLayoutCard } from "@/components/chord-layout-card";
import { Piano } from "@/components/piano";
import { loadInstrument, playMidi, playNotes, preloadPiano, setInstrument, type Instrument } from "@/lib/audio";
import { parseBuilderQuery } from "@/lib/builder";
import { CHORDS, KEY_SIGNATURES, MAJOR_KEYS, MINOR_KEYS, diatonicChords, keyInfo, makeChord, makePresets, makeVoicings, midiName, nearestVoicing, optimizeProgression, scaleDegreeLabels, scaleNotes, stepChord, type Mode, type ProgressionStep, type Quality, type ScaleType } from "@/lib/music";

const SCALE_OPTIONS: ScaleType[] = ["major","natural minor","harmonic minor","melodic minor","major pentatonic","minor pentatonic","blues","dorian","mixolydian","lydian"];
const ROOTS = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const QUALITY_GROUPS: { label:string; values: Quality[] }[] = [
  {label:"Triads",values:["major","minor","diminished","augmented","sus2","sus4","power"]},
  {label:"Sevenths",values:["maj7","dom7","min7","minMaj7","halfDim7","dim7"]},
  {label:"Color & extensions",values:["maj9","min9","dom9","maj11","min11","dom11","maj13","min13","dom13","add9","six","min6","six9"]},
  {label:"Altered & suspended",values:["dom7b9","dom7s9","dom7s11","dom7b13","dom7sus4","dom9sus4"]},
];
type Saved = { name:string; tonic:string; mode:Mode; steps:ProgressionStep[]; tempo:number };
function uid() { return Math.random().toString(36).slice(2,10); }
function numeralFor(index:number, mode:Mode) { return (mode==="major"?["I","ii","iii","IV","V","vi","vii°"]:["i","ii°","III","iv","v","VI","VII"])[index-1] ?? "♭?"; }
function harmonicHint(quality: Quality) { if (["dom7","dom9","dom13","dom7b9","dom7s9","dom7s11","dom7b13"].includes(quality)) return "Dominant color creates motion toward resolution."; if (["maj7","maj9","maj11","maj13"].includes(quality)) return "A major seventh adds a warm, suspended glow."; if (["min7","min9","min11","min13"].includes(quality)) return "Minor seventh tones create a softer, open sound."; return "Listen for how each chord tone shapes the harmony."; }

export default function Home() {
  const [tonic,setTonic] = useState("G");
  const [mode,setMode] = useState<Mode>("major");
  const [scaleType,setScaleType] = useState<ScaleType>("major");
  const [presetId,setPresetId] = useState("dreamy");
  const presets = useMemo(()=>makePresets(mode),[mode]);
  const [steps,setSteps] = useState<ProgressionStep[]>(()=>makePresets("major")[0].steps);
  const [selectedIndex,setSelectedIndex] = useState(0);
  const [tempo,setTempo] = useState(78);
  const [playing,setPlaying] = useState(false);
  const [loop,setLoop] = useState(false);
  const [arpeggiate,setArpeggiate] = useState(false);
  const [instrument,setInstrumentChoice] = useState<Instrument>("synth");
  const [pianoStatus,setPianoStatus] = useState<"idle"|"loading"|"ready"|"failed">("idle");
  const [sustain,setSustain] = useState(false);
  const [octaves,setOctaves] = useState(4);
  const [showLabels,setShowLabels] = useState(true);
  const [showDegrees,setShowDegrees] = useState(false);
  const [split,setSplit] = useState(false);
  const [compareChords,setCompareChords] = useState(false);
  const [focus,setFocus] = useState(false);
  const [activeMidi,setActiveMidi] = useState<number|null>(null);
  const [explore,setExplore] = useState<{root:string;quality:Quality}|null>(null);
  const [exploreRoot,setExploreRoot] = useState("G");
  const [exploreQuality,setExploreQuality] = useState<Quality>("maj7");
  const [exploreVoicing,setExploreVoicing] = useState("root");
  const [saved,setSaved] = useState<Saved[]>([]);
  const [saveOpen,setSaveOpen] = useState(false);
  const [saveName,setSaveName] = useState("");
  const [mobilePanel,setMobilePanel] = useState<"left"|"right"|null>(null);
  const [practice,setPractice] = useState(false);
  const [highlight,setHighlight] = useState<"scale"|"chord"|"guides">("scale");
  const [lastNote,setLastNote] = useState<number|null>(null);
  const [midiStatus,setMidiStatus] = useState("Connect MIDI");
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const runId = useRef(0);
  const loopRef = useRef(loop); loopRef.current=loop;
  const stepsRef = useRef(steps); stepsRef.current=steps;
  const tempoRef = useRef(tempo); tempoRef.current=tempo;
  const tonicRef = useRef(tonic); tonicRef.current=tonic;
  const modeRef = useRef(mode); modeRef.current=mode;
  const arpeggiateRef = useRef(arpeggiate); arpeggiateRef.current=arpeggiate;
  const sustainRef = useRef(sustain); sustainRef.current=sustain;

  useEffect(()=>{ try { const raw=localStorage.getItem("keyframe-saved"); if(raw) setSaved(JSON.parse(raw)); const prefs=localStorage.getItem("keyframe-prefs"); if(prefs){ const p=JSON.parse(prefs); if(p.octaves) setOctaves(p.octaves); if(typeof p.showLabels==="boolean") setShowLabels(p.showLabels); } } catch {} },[]);
  // Sound choice is shared with the reference site (same storage key), so Piano carries over between pages.
  function loadPiano() { setPianoStatus("loading"); preloadPiano().then(ok=>setPianoStatus(ok?"ready":"failed")); }
  useEffect(()=>{ const saved=loadInstrument(); setInstrumentChoice(saved); if(saved==="piano") loadPiano(); },[]);
  function toggleInstrument() { const next:Instrument=instrument==="piano"?"synth":"piano"; setInstrument(next); setInstrumentChoice(next); if(next==="piano"&&pianoStatus!=="ready") loadPiano(); }
  const instrumentLabel = instrument==="synth"?"Synth":pianoStatus==="loading"?"Loading piano…":pianoStatus==="failed"?"Piano unavailable, using synth":"Piano";
  // A progression sent from the site's builder or progression pages: ?key=g-major&p=1-5-6-4&chords=sevenths&inv=smooth
  useEffect(()=>{ const params=new URLSearchParams(window.location.search); if(!params.get("p")) return; const s=parseBuilderQuery(params); const chords=diatonicChords(s.key.tonic,s.key.mode,s.sevenths); const imported=s.degrees.map(degree=>({id:uid(),degree,quality:chords[degree-1].chord.quality,beats:4})); setMode(s.key.mode);setTonic(s.key.tonic);setScaleType(s.key.mode==="major"?"major":"natural minor");setExploreRoot(s.key.tonic);setSteps(s.inversion==="smooth"?optimizeProgression(imported,s.key.tonic,s.key.mode):imported);setPresetId("custom");setSelectedIndex(0); },[]);
  useEffect(()=>{ try { localStorage.setItem("keyframe-prefs",JSON.stringify({octaves,showLabels})); } catch {} },[octaves,showLabels]);

  const info=useMemo(()=>keyInfo(tonic,mode),[tonic,mode]);
  const scale=useMemo(()=>scaleNotes(tonic,scaleType),[tonic,scaleType]);
  const currentStep=steps[Math.min(selectedIndex,steps.length-1)];
  const chord=useMemo(()=>explore?makeChord(explore.root,explore.quality):currentStep?stepChord(currentStep,tonic,mode):makeChord(tonic,mode==="major"?"major":"minor"),[explore,currentStep,tonic,mode]);
  const voicings=useMemo(()=>makeVoicings(chord),[chord]);
  const activeVoicingId=explore?exploreVoicing:currentStep?.voicingId??"root";
  const voicing=voicings.find(v=>v.id===activeVoicingId)??voicings[0];
  const activePreset=presets.find(p=>p.id===presetId);
  const comparisonCards=useMemo(()=>steps.map((step,index)=>{
    const itemChord=stepChord(step,tonic,mode);
    const options=makeVoicings(itemChord);
    return { chord:itemChord, voicing:options.find(option=>option.id===step.voicingId)??options[0], numeral:presetId==="custom"?numeralFor(step.degree,mode):activePreset?.numerals[index]??numeralFor(step.degree,mode) };
  }),[steps,tonic,mode,presetId,activePreset]);
  const selectedNumeral=explore?"CHORD EXPLORER":presetId==="custom"?numeralFor(currentStep?.degree??1,mode):activePreset?.numerals[selectedIndex]??"";
  const theoryNotes=chord.notes.join(" · ");
  const signature=mode==="major"?KEY_SIGNATURES[tonic]:info.signature;

  const stop=useCallback(()=>{runId.current++;if(timer.current)clearTimeout(timer.current);timer.current=null;setPlaying(false);},[]);
  useEffect(()=>()=>{runId.current++;if(timer.current)clearTimeout(timer.current);},[]);
  function choosePreset(id:string) { const p=presets.find(x=>x.id===id); if(!p)return; stop(); setPresetId(id); setSteps(p.steps.map(s=>({...s,id:uid()}))); setTempo(p.tempo); setSelectedIndex(0); setExplore(null); }
  function changeKey(nextMode:Mode,nextTonic:string) { stop(); setMode(nextMode);setTonic(nextTonic);setScaleType(nextMode==="major"?"major":"natural minor");setExploreRoot(nextTonic);setExplore(null); const p=makePresets(nextMode).find(x=>x.id===presetId); if(p){setSteps(p.steps.map(s=>({...s,id:uid()})));setTempo(p.tempo);}setSelectedIndex(0); }
  function selectVoicing(id:string) { if(explore) setExploreVoicing(id); else setSteps(old=>old.map((s,i)=>i===selectedIndex?{...s,voicingId:id}:s)); }
  function playCurrent() { void playNotes(voicing.notes.map(n=>n.midi),arpeggiate,sustain?3:1.45); }
  function playComparison(index:number) { const notes=comparisonCards[index]?.voicing.notes;if(notes) void playNotes(notes.map(note=>note.midi),arpeggiate,sustain?3:1.45); }
  function playSingle(midi:number) { setActiveMidi(midi);setLastNote(midi);void playMidi(midi,sustainRef.current?2.4:.65);window.setTimeout(()=>setActiveMidi(a=>a===midi?null:a),450); }
  function beginProgression() { if(!steps.length)return; stop(); const id=runId.current;setPlaying(true); const advance=(index:number)=>{ if(id!==runId.current)return; const s=stepsRef.current[index]; if(!s){setPlaying(false);return;} setSelectedIndex(index);setExplore(null);const c=stepChord(s,tonicRef.current,modeRef.current);const v=makeVoicings(c).find(x=>x.id===s.voicingId)??makeVoicings(c)[0];void playNotes(v.notes.map(n=>n.midi),arpeggiateRef.current,Math.max(.7,s.beats*60/tempoRef.current*.7));timer.current=setTimeout(()=>{ const next=index+1;if(next<stepsRef.current.length)advance(next);else if(loopRef.current)advance(0);else setPlaying(false); },s.beats*60/tempoRef.current*1000);};advance(0); }
  function updateStep(index:number,patch:Partial<ProgressionStep>) { setPresetId("custom");setSteps(old=>old.map((s,i)=>i===index?{...s,...patch}:s)); }
  function addStep() { const degree=(steps.at(-1)?.degree??0)%7+1;setSteps(old=>[...old,{id:uid(),degree,quality:mode==="major"?"major":"minor",beats:4}]);setPresetId("custom");setExplore(null);setSelectedIndex(steps.length); }
  function removeStep(index:number) { if(steps.length<=1)return;setSteps(old=>old.filter((_,i)=>i!==index));setSelectedIndex(i=>Math.max(0,Math.min(i,steps.length-2)));setPresetId("custom"); }
  function duplicateStep(index:number) { setSteps(old=>[...old.slice(0,index+1),{...old[index],id:uid()},...old.slice(index+1)]);setPresetId("custom"); }
  function moveStep(index:number,direction:number) { const next=index+direction;if(next<0||next>=steps.length)return;const copy=[...steps];[copy[index],copy[next]]=[copy[next],copy[index]];setSteps(copy);setSelectedIndex(next);setPresetId("custom"); }
  function optimize() { setSteps(old=>optimizeProgression(old,tonic,mode));setPresetId("custom"); }
  function nearest() { if(selectedIndex<1||explore)return;const previous=steps[selectedIndex-1];const c=stepChord(previous,tonic,mode);const pv=makeVoicings(c).find(v=>v.id===previous.voicingId)??makeVoicings(c)[0];selectVoicing(nearestVoicing(pv,chord).id); }
  function saveProgression() { const name=saveName.trim()||`${tonic} ${mode} study`;const next=[{name,tonic,mode,steps:steps.map(s=>({...s})),tempo},...saved].slice(0,12);setSaved(next);localStorage.setItem("keyframe-saved",JSON.stringify(next));setSaveName("");setSaveOpen(false); }
  function loadSaved(item:Saved) { stop();setTonic(item.tonic);setMode(item.mode);setScaleType(item.mode==="major"?"major":"natural minor");setSteps(item.steps.map(s=>({...s,id:uid()})));setTempo(item.tempo);setPresetId("custom");setSelectedIndex(0);setExplore(null); }
  async function connectMidi() { try { if(!navigator.requestMIDIAccess){setMidiStatus("MIDI unavailable");return;}const access=await navigator.requestMIDIAccess();access.inputs.forEach(input=>{input.onmidimessage=e=>{if(!e.data)return;const [status,midi,velocity]=e.data;if((status&0xf0)===0x90&&velocity>0)playSingle(midi);};});setMidiStatus(`${access.inputs.size} MIDI input${access.inputs.size===1?"":"s"}`); } catch { setMidiStatus("MIDI permission needed"); } }
  useEffect(()=>{ const map:Record<string,number>={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72,o:73,l:74,p:75,";":76}; const handler=(e:KeyboardEvent)=>{if(e.repeat||e.metaKey||e.ctrlKey||e.altKey||["INPUT","SELECT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName))return;const midi=map[e.key.toLowerCase()];if(midi){e.preventDefault();playSingle(midi);}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);},[]);

  const practicePitch=lastNote===null?null:voicing.notes.some(n=>n.midi%12===lastNote%12);
  const targetNote=lastNote===null?null:voicing.notes.filter(n=>n.hand==="right").sort((a,b)=>Math.abs(a.midi-lastNote)-Math.abs(b.midi-lastNote))[0];
  const displayedScale = highlight==="chord"?chord.notes:highlight==="guides"?chord.notes.filter((_,i)=>["third","seventh"].includes(chord.roles[i])):scale;

  return <div className={`app-shell ${focus?"is-focus":""}`}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><AudioLines size={20} strokeWidth={2.5}/></div><div className="brand-name">keyframe<span>.</span></div><span className="brand-divider"/><span className="brand-subtitle">PIANO PLAYGROUND</span></div>
      <div className="topbar-center"><span className="status-dot"/> <span>STUDIO SESSION</span><span className="topbar-sep">/</span><strong>{tonic} {mode}</strong></div>
      <div className="topbar-actions"><button className="text-control" onClick={()=>{setFocus(!focus);if(!focus)setCompareChords(false)}}><Focus size={16}/><span>{focus?"Exit focus":"Focus mode"}</span></button><button className="mobile-menu" onClick={()=>setMobilePanel(mobilePanel?null:"left")} aria-label="Open menu"><Menu size={20}/></button><div className="avatar">K</div></div>
    </header>

    <div className="workspace">
      <aside className={`sidebar left-sidebar ${mobilePanel==="left"?"mobile-open":""}`}>
        <div className="sidebar-scroll">
          <div className="side-heading"><span>YOUR WORKSPACE</span><button className="mobile-close" onClick={()=>setMobilePanel(null)}><X size={16}/></button></div>
          <section className="side-section"><div className="section-label"><span>01</span> KEY & SCALE</div><div className="key-display"><div className="key-disc"><Music2 size={22}/></div><div><div className="key-title">{tonic} {mode}</div><div className="key-sub">{signature}</div></div></div>
            <div className="field-row"><div className="field"><label>TONIC</label><select value={tonic} onChange={e=>changeKey(mode,e.target.value)}>{(mode==="major"?MAJOR_KEYS:MINOR_KEYS).map(k=><option key={k}>{k}</option>)}</select></div><div className="field"><label>MODE</label><select value={mode} onChange={e=>changeKey(e.target.value as Mode,e.target.value==="major"?(MAJOR_KEYS[MINOR_KEYS.indexOf(tonic)]??"G"):(MINOR_KEYS[MAJOR_KEYS.indexOf(tonic)]??"E"))}><option value="major">Major</option><option value="minor">Minor</option></select></div></div>
            <div className="field"><label>SCALE PALETTE</label><select value={scaleType} onChange={e=>setScaleType(e.target.value as ScaleType)}>{SCALE_OPTIONS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
            <div className="scale-pills">{scale.map((n,i)=><span key={`${n}-${i}`}>{showDegrees?scaleDegreeLabels(scaleType)[i]:n}</span>)}</div><div className="relative-line">Relative {mode==="major"?"minor":"major"} <strong>{info.relative} {mode==="major"?"minor":"major"}</strong></div>
          </section>
          <section className="side-section"><div className="section-label"><span>02</span> PROGRESSION LIBRARY</div><p className="side-description">A starting point for your next idea.</p><div className="preset-list">{presets.map(p=><button key={p.id} className={`preset-card ${presetId===p.id?"selected":""}`} onClick={()=>{choosePreset(p.id);setMobilePanel(null)}}><span className="preset-icon">{p.id==="dreamy"?"✦":p.id==="jazz"?"♬":p.id==="soulful"?"◈":p.id==="uplifting"?"☀":"◒"}</span><span className="preset-content"><strong>{p.name}</strong><small>{p.mood} <span>·</span> {p.genre}</small></span><ChevronRight size={16}/></button>)}</div></section>
          <section className="side-section"><div className="section-label"><span>03</span> CHORD EXPLORER</div><div className="field-row"><div className="field"><label>ROOT</label><select value={exploreRoot} onChange={e=>setExploreRoot(e.target.value)}>{ROOTS.map(r=><option key={r}>{r}</option>)}</select></div><div className="field"><label>QUALITY</label><select value={exploreQuality} onChange={e=>setExploreQuality(e.target.value as Quality)}>{QUALITY_GROUPS.map(g=><optgroup key={g.label} label={g.label}>{g.values.map(q=><option key={q} value={q}>{CHORDS[q].name}</option>)}</optgroup>)}</select></div></div><Button variant="outline" className="full-width" onClick={()=>{setExplore({root:exploreRoot,quality:exploreQuality});setExploreVoicing("root");setMobilePanel(null)}}><Sparkles size={15}/> Explore chord</Button></section>
          <section className="side-section saved-section"><div className="section-label"><span>04</span> SAVED SESSIONS</div>{saved.length? saved.map((s,i)=><button key={`${s.name}-${i}`} className="saved-item" onClick={()=>loadSaved(s)}><Bookmark size={14}/><span>{s.name}</span><ChevronRight size={14}/></button>):<div className="empty-saved">Your saved progressions will live here.</div>}</section>
        </div>
        <div className="side-footer"><Keyboard size={16}/><span>Use A–; keys to play</span><span className="kbd">A</span><span className="kbd">W</span><span className="kbd">S</span></div>
      </aside>

      <main className="main-area">
        <div className="main-scroll">
          <div className="main-intro"><div><div className="eyebrow"><span className="eyebrow-line"/> HARMONY WORKSPACE / {explore?"CHORD STUDY":activePreset?.name.toUpperCase()??"YOUR PROGRESSION"}</div><h1>Make harmony <em>your own.</em></h1><p>Explore a chord. Hear the movement. Find your way around the keys.</p></div><div className="intro-actions"><button className="outline-icon" onClick={()=>setPractice(!practice)} title="Practice mode"><Activity size={17}/></button><button className="outline-icon" onClick={()=>setShowDegrees(!showDegrees)} title="Toggle scale degrees"><span className="degree-icon">1 3 5</span></button><button className="outline-icon" onClick={()=>setMobilePanel("right")} title="Voicing settings"><SlidersHorizontal size={17}/></button></div></div>

          <section className="chord-hero"><div className="chord-hero-top"><div className="chord-context"><span className="live-indicator"/><span>NOW EXPLORING</span><span className="context-divider">/</span><strong>{selectedNumeral}</strong></div><div className="hero-top-right"><span>CHORD {Math.min(selectedIndex+1,steps.length)} OF {steps.length}</span><button onClick={()=>{setExplore(null);setSelectedIndex((selectedIndex-1+steps.length)%steps.length)}} aria-label="Previous chord"><ChevronLeft size={18}/></button><button onClick={()=>{setExplore(null);setSelectedIndex((selectedIndex+1)%steps.length)}} aria-label="Next chord"><ChevronRight size={18}/></button></div></div>
            <div className="chord-hero-body"><div className="chord-main"><div className="chord-symbol">{chord.symbol}<span className="chord-accent">.</span></div><div className="chord-full">{chord.fullName}</div><div className="chord-notes">{chord.notes.map((n,i)=><span key={`${n}-${i}`} className={chord.roles[i]==="root"?"note-root":chord.roles[i]==="third"?"note-third":chord.roles[i]==="seventh"?"note-seventh":""}>{n}</span>)}</div></div><div className="chord-actions"><Button onClick={playCurrent}><Volume2 size={17}/> Hear chord</Button><Button variant="outline" onClick={()=>setArpeggiate(!arpeggiate)} className={arpeggiate?"active-outline":""}><AudioLines size={16}/> {arpeggiate?"Arpeggio on":"Arpeggiate"}</Button></div></div>
            <div className="hero-bottom"><div><span className="micro-label">CHORD FORMULA</span><span className="formula">{chord.formula.join("  ·  ")}</span></div><div><span className="micro-label">IN THIS KEY</span><span className="function-text">{selectedNumeral}</span></div><div className="hero-tip"><CircleHelp size={15}/><span>{harmonicHint(chord.quality)}</span></div></div>
          </section>

          <section className="piano-section"><div className="section-topline"><div><div className="eyebrow small">{compareChords?"PROGRESSION AT A GLANCE":"THE INSTRUMENT"}</div><h2>{compareChords?"Chord layouts":"At the keys"} <span className="section-count">{compareChords?`${steps.length} CHORDS`:`${octaves} OCTAVES`}</span></h2></div><div className="piano-tools"><button className={`tool-toggle compare-toggle ${compareChords?"on":""}`} onClick={()=>setCompareChords(!compareChords)} aria-pressed={compareChords}><LayoutGrid size={14}/>{compareChords?"Single keyboard":"Compare chords"}</button>{!compareChords&&<><button className={`tool-toggle ${showLabels?"on":""}`} onClick={()=>setShowLabels(!showLabels)}>Note labels</button><button className={`tool-toggle ${split?"on":""}`} onClick={()=>setSplit(!split)}><Layers3 size={14}/> Split hands</button><button className={`tool-toggle ${sustain?"on":""}`} onClick={()=>setSustain(!sustain)}><AudioLines size={14}/> Sustain</button><div className="stepper"><button onClick={()=>setOctaves(Math.max(2,octaves-1))} aria-label="Fewer octaves"><Minus size={14}/></button><span>{octaves} oct</span><button onClick={()=>setOctaves(Math.min(5,octaves+1))} aria-label="More octaves"><Plus size={14}/></button></div></>}</div></div>
            {compareChords?<><div className="comparison-grid">{comparisonCards.map((item,index)=><ChordLayoutCard key={steps[index].id} chord={item.chord} voicing={item.voicing} numeral={item.numeral} index={index} active={selectedIndex===index&&!explore} playing={playing&&selectedIndex===index} onSelect={()=>{setSelectedIndex(index);setExplore(null)}} onPlay={()=>playComparison(index)}/>)}</div><div className="comparison-footer"><span><i className="legend-dot left"/> Left hand</span><span><i className="legend-dot right"/> Right hand</span><span>Finger numbers appear beside each hand note.</span></div></>:<><div className="piano-frame">{split?<div className="split-keyboards"><div><div className="split-label"><span className="hand-dot left"/> LEFT HAND</div><Piano notes={voicing.notes.filter(n=>n.hand==="left")} scale={displayedScale} octaves={octaves} startMidi={36} showLabels={showLabels} showDegrees={showDegrees} split={false} activeMidi={activeMidi} onNote={playSingle}/></div><div><div className="split-label"><span className="hand-dot right"/> RIGHT HAND</div><Piano notes={voicing.notes.filter(n=>n.hand==="right")} scale={displayedScale} octaves={octaves} startMidi={octaves===2?60:36} showLabels={showLabels} showDegrees={showDegrees} split={false} activeMidi={activeMidi} onNote={playSingle}/></div></div>:<Piano notes={voicing.notes} scale={displayedScale} octaves={octaves} showLabels={showLabels} showDegrees={showDegrees} split={false} activeMidi={activeMidi} onNote={playSingle}/>}</div><div className="piano-footer"><div className="legend"><span><i className="legend-dot left"/> Left hand</span><span><i className="legend-dot right"/> Right hand</span><span><i className="legend-dot scale"/> Scale tones</span></div><div className="keyboard-note"><Keyboard size={14}/> Click keys or use your computer keyboard</div></div></>}
          </section>

          <div className="lower-grid"><section className="panel hand-panel"><div className="panel-heading"><div><div className="eyebrow small">THE PHYSICAL SHAPE</div><h2>Hand placement</h2></div><span className="panel-badge">{voicing.label}</span></div><div className="hand-rows">{(["left","right"] as const).map(hand=>{const handNotes=voicing.notes.filter(n=>n.hand===hand).sort((a,b)=>a.midi-b.midi);return <div className="hand-row" key={hand}><div className={`hand-symbol ${hand}`}><span>{hand==="left"?"L":"R"}</span></div><div className="hand-info"><strong>{hand==="left"?"Left hand":"Right hand"}</strong><small>{hand==="left"?"Foundation & bass":"Harmony & color"}</small></div><div className="hand-notes">{handNotes.map((n,i)=><span key={`${n.midi}-${i}`} className={hand}>{midiName(n.midi,n.name)}<b>{n.finger??"–"}</b></span>)}</div></div>})}</div><div className="hand-foot"><span>FINGERS <b>1</b> thumb <b>2</b> index <b>3</b> middle <b>4</b> ring <b>5</b> pinky</span><span>– optional for wide spans</span></div></section>
            <section className="panel insight-panel"><div className="panel-heading"><div><div className="eyebrow small">LISTEN & LEARN</div><h2>Harmony insight</h2></div><div className="insight-icon"><Sparkles size={17}/></div></div><p>{voicing.description}</p><div className="insight-divider"/><div className="insight-stat"><span>THEORETICAL NOTES</span><strong>{theoryNotes}</strong></div><div className="insight-stat"><span>PLAYED VOICING</span><strong>{voicing.notes.map(n=>midiName(n.midi,n.name)).join(" · ")}</strong></div></section></div>

          {practice && <section className="practice-strip"><div><span className="practice-icon"><Activity size={18}/></span><div><strong>Practice at your own pace</strong><p>Play a highlighted chord tone on the piano or your MIDI keyboard. {lastNote===null?"Start with the root.":practicePitch?"Nice — that note belongs to this chord.":"That note adds tension. Try a highlighted chord tone."} {targetNote&&`Nearby target: ${midiName(targetNote.midi,targetNote.name)}.`}</p></div></div><button onClick={()=>void connectMidi()}><Keyboard size={15}/>{midiStatus}</button></section>}
        </div>
      </main>

      <aside className={`sidebar right-sidebar ${mobilePanel==="right"?"mobile-open":""}`}><div className="sidebar-scroll"><div className="right-title"><div><div className="eyebrow small">SHAPE YOUR SOUND</div><h2>Voicing lab</h2></div><button className="mobile-close" onClick={()=>setMobilePanel(null)}><X size={16}/></button></div><p className="right-description">The same notes, a different feeling. Choose how this chord sits beneath your fingers.</p>
        <div className="voicing-section-label">INVERSIONS & COLORS <span>{voicings.length} OPTIONS</span></div><div className="voicing-list">{voicings.map((v,i)=><button key={v.id} className={`voicing-card ${voicing.id===v.id?"active":""}`} onClick={()=>{selectVoicing(v.id);setMobilePanel(null)}}><span className="voicing-radio">{voicing.id===v.id&&<span/>}</span><span className="voicing-text"><strong>{v.label}</strong><small>{v.notes.filter(n=>n.hand==="right").map(n=>n.name).join(" · ")}</small></span>{i<4&&<span className="voicing-index">0{i+1}</span>}</button>)}</div>
        <button className="nearest-button" onClick={nearest} disabled={selectedIndex===0||!!explore}><Shuffle size={17}/><span><strong>Find nearest voicing</strong><small>{selectedIndex===0?"Select the next chord to compare":"Minimize the move from the previous chord"}</small></span><ArrowRight size={16}/></button>
        <div className="right-divider"/><div className="right-title compact"><div><div className="eyebrow small">IMPROVISATION LENS</div><h2>What to play</h2></div></div><div className="highlight-switch"><button className={highlight==="scale"?"active":""} onClick={()=>setHighlight("scale")}>Scale</button><button className={highlight==="chord"?"active":""} onClick={()=>setHighlight("chord")}>Chord</button><button className={highlight==="guides"?"active":""} onClick={()=>setHighlight("guides")}>Guide tones</button></div><div className="improv-tip"><span className="tip-star">✦</span><p>{highlight==="guides"?"Aim for the third and seventh. They reveal the chord's quality and lead smoothly into the next one.":highlight==="chord"?"Chord tones sound settled. Try landing on one as the harmony changes.":"Scale tones are your palette. The chord tones are your strongest landing points."}</p></div>
        <div className="right-divider"/><div className="right-title compact"><div><div className="eyebrow small">IN THIS KEY</div><h2>Diatonic family</h2></div></div><div className="diatonic-list">{diatonicChords(tonic,mode,true).map(({numeral,chord:c})=><button key={numeral} onClick={()=>{setExplore({root:c.root,quality:c.quality});setExploreVoicing("root")}}><span>{numeral}</span><strong>{c.symbol}</strong><ChevronRight size={13}/></button>)}</div>
      </div></aside>
    </div>

    <section className={`transport ${focus?"focus-transport":""}`}><div className="transport-top"><div className="transport-heading"><div className="eyebrow small">YOUR ARRANGEMENT</div><h2>Progression timeline <span>{steps.length} CHORDS</span></h2></div><div className="transport-actions"><button className="subtle-button" onClick={optimize}><Sparkles size={15}/> Optimize voice leading</button><button className="subtle-button" onClick={()=>setSaveOpen(true)}><Save size={15}/> Save</button><button className="subtle-button" onClick={addStep}><Plus size={16}/> Add chord</button></div></div>
      <div className="transport-body"><div className="timeline">{steps.map((s,i)=>{const c=stepChord(s,tonic,mode);return <button key={s.id} className={`timeline-card ${selectedIndex===i&&!explore?"active":""} ${playing&&selectedIndex===i?"playing":""}`} onClick={()=>{setSelectedIndex(i);setExplore(null)}}><span className="timeline-top"><span className="timeline-index">{String(i+1).padStart(2,"0")}</span><span className="timeline-numeral">{presetId==="custom"?numeralFor(s.degree,mode):activePreset?.numerals[i]}</span></span><strong>{c.symbol}</strong><span className="timeline-bottom">{s.voicingId&&s.voicingId!=="root"?<span className="timeline-voicing">{makeVoicings(c).find(v=>v.id===s.voicingId)?.label}</span>:"Root position"}<span>{s.beats} beats</span></span><span className="active-rail"/></button>})}<button className="timeline-add" onClick={addStep} aria-label="Add chord"><Plus size={20}/></button></div><div className="playback-controls"><Button size="icon" className="play-main" onClick={playing?stop:beginProgression}>{playing?<Pause size={21} fill="currentColor"/>:<Play size={21} fill="currentColor"/>}</Button><button className={`loop-button ${loop?"active":""}`} onClick={()=>setLoop(!loop)} title="Loop progression"><RotateCcw size={17}/></button><div className="tempo-control"><Gauge size={17}/><input type="number" min="40" max="240" value={tempo} onChange={e=>setTempo(Math.max(40,Math.min(240,Number(e.target.value)||40)))} aria-label="Tempo in BPM"/><span>BPM</span></div><span className="transport-separator"/><button className={`style-switch ${arpeggiate?"active":""}`} onClick={()=>setArpeggiate(!arpeggiate)}><AudioLines size={16}/>{arpeggiate?"Arpeggio":"Block chords"}</button><button className={`style-switch ${instrument==="piano"?"active":""}`} onClick={toggleInstrument} aria-pressed={instrument==="piano"} title="Switch between the synth and the sampled piano">{instrument==="piano"?<PianoIcon size={16}/>:<Activity size={16}/>}{instrumentLabel}</button><span className="transport-spacer"/><div className="now-playing"><span className={playing?"status-dot pulse":"status-dot"}/>{playing?`PLAYING ${stepChord(steps[selectedIndex],tonic,mode).symbol}`:"READY TO PLAY"}</div></div></div>
      <div className="timeline-editor"><div className="editor-heading"><Settings2 size={14}/> EDIT SELECTED CHORD</div><div className="editor-fields"><label>Degree<select value={currentStep?.degree??1} onChange={e=>updateStep(selectedIndex,{degree:Number(e.target.value),voicingId:"root"})}>{Array.from({length:7},(_,i)=><option key={i} value={i+1}>{numeralFor(i+1,mode)} · {info.notes[i]}</option>)}</select></label><label>Quality<select value={currentStep?.quality??"major"} onChange={e=>updateStep(selectedIndex,{quality:e.target.value as Quality,voicingId:"root"})}>{QUALITY_GROUPS.map(g=><optgroup key={g.label} label={g.label}>{g.values.map(q=><option key={q} value={q}>{CHORDS[q].name}</option>)}</optgroup>)}</select></label><label>Duration<select value={currentStep?.beats??4} onChange={e=>updateStep(selectedIndex,{beats:Number(e.target.value)})}><option value="2">2 beats</option><option value="4">1 bar · 4 beats</option><option value="8">2 bars · 8 beats</option></select></label><div className="editor-buttons"><button title="Move left" onClick={()=>moveStep(selectedIndex,-1)}><ArrowLeftRight size={14}/></button><button title="Duplicate chord" onClick={()=>duplicateStep(selectedIndex)}><Copy size={14}/></button><button title="Remove chord" onClick={()=>removeStep(selectedIndex)}><X size={15}/></button></div></div></div>
    </section>

    {saveOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSaveOpen(false)}}><div className="save-modal"><button className="modal-close" onClick={()=>setSaveOpen(false)}><X size={18}/></button><div className="modal-icon"><Bookmark size={22}/></div><h2>Save this progression</h2><p>Keep your chord choices and voicings ready for your next session.</p><label>PROGRESSION NAME</label><input autoFocus placeholder={`${tonic} ${mode} study`} value={saveName} onChange={e=>setSaveName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveProgression()}}/><Button onClick={saveProgression} className="full-width"><Check size={16}/> Save progression</Button></div></div>}
  </div>;
}
