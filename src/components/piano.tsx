"use client";
import { useMemo } from "react";
import { midiName, type VoicedNote } from "@/lib/music";

type Props = { notes: VoicedNote[]; scale: string[]; octaves: number; showLabels: boolean; showDegrees: boolean; split: boolean; startMidi?: number; activeMidi: number | null; onNote: (midi:number)=>void };
const BLACK = new Set([1,3,6,8,10]);
const DEGREES: Record<string,string> = { root:"R", third:"3", fifth:"5", seventh:"7", extension:"9+" };
const ROLE_COLORS: Record<string,string> = { root:"#e8b47a",third:"#8ed1b9",fifth:"#d2e1eb",seventh:"#c4a8e5",extension:"#d4ca8d" };
const KEY_WIDTH = 40;
export function Piano({ notes, scale, octaves, showLabels, showDegrees, split, startMidi, activeMidi, onNote }: Props) {
  const start = startMidi ?? (octaves===2?48:octaves===5?24:36);
  const total = octaves*12;
  const layout = useMemo(()=>{
    let whites=0;
    const keys = Array.from({length:total},(_,i)=>{
      const midi=start+i; const black=BLACK.has(midi%12); const x=black ? whites*KEY_WIDTH-KEY_WIDTH*0.34 : whites++*KEY_WIDTH;
      return { midi,black,x };
    });
    return { keys,width:whites*KEY_WIDTH };
  },[total]);
  const voiced = new Map(notes.map(n=>[n.midi,n]));
  const scaleClasses = new Set(scale.map(n=>{ const base = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n[0] as "C"]; const a = [...n.slice(1)].reduce((v,c)=>v+(c==="♯"?1:c==="♭"?-1:0),0); return (base+a+12)%12; }));
  function renderKey(k: {midi:number;black:boolean;x:number}) {
    const n=voiced.get(k.midi); const isScale=scaleClasses.has(k.midi%12); const active=activeMidi===k.midi;
    const w=k.black?25:KEY_WIDTH-1.5; const h=k.black?136:224; const x=k.black?k.x-0.3:k.x;
    const fill=n ? (n.hand==="left" ? (k.black?"#d89c5d":"#efbd79") : (k.black?"#528bc2":"#9ccaf0")) : active ? "#83c6b1" : k.black ? "#20282e" : "#e5e9e8";
    const label=n ? (showDegrees ? DEGREES[n.role] : n.name) : showLabels ? midiName(k.midi).replace(/\d+$/,"") : "";
    return <g key={k.midi} className="piano-key" onPointerDown={e=>{e.preventDefault();onNote(k.midi);}} role="button" aria-label={`Play ${midiName(k.midi)}`} tabIndex={-1}>
      <rect x={x} y={0} width={w} height={h} rx={k.black?4:5} fill={fill} stroke={k.black?"#11191d":"#9aa4a7"} strokeWidth="1" />
      {!k.black && <path d={`M ${x+3} 202 H ${x+w-3}`} stroke={n?"#5c7c8a":"#c7cccb"} strokeWidth="1" />}
      {isScale && !n && <circle cx={x+w/2} cy={k.black?102:180} r={k.black?2.5:3} fill={k.black?"#7599b4":"#99a7ae"} opacity=".9" />}
      {n && <><circle cx={x+w/2} cy={k.black?73:137} r={k.black?13:15} fill={n.hand==="left"?"#9b6538":"#3b709c"} opacity=".95"/><circle cx={x+w/2+11} cy={k.black?62:126} r="3.6" fill={ROLE_COLORS[n.role]} stroke="#28404b" strokeWidth="1"/><text x={x+w/2} y={k.black?78:142} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{n.finger??"·"}</text></>}
      {label && <text x={x+w/2} y={k.black?121:216} textAnchor="middle" fontSize={k.black?9:10} fontWeight={n?"700":"500"} fill={k.black?(n?"#e8f3fa":"#83939b"):(n?"#183243":"#68777d")}>{label}</text>}
      {!k.black && (k.midi%12===0) && <text x={x+w/2} y="198" textAnchor="middle" fontSize="9" fill="#93a0a4">C{Math.floor(k.midi/12)-1}</text>}
    </g>;
  }
  return <div className={`piano-shell ${split?"piano-split":""}`}><div className="piano-scroll"><svg className="piano-svg" viewBox={`0 0 ${layout.width} 225`} width={layout.width} height="225" aria-label="Interactive piano keyboard" role="group">{layout.keys.filter(k=>!k.black).map(renderKey)}{layout.keys.filter(k=>k.black).map(renderKey)}</svg></div></div>;
}
