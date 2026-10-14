'use client';
import { useState } from 'react';
import type { CapabilityV1 } from '@/domain/contracts';
const blank:CapabilityV1={kind:'image',formats:['png'],aspectRatios:['1:1'],maxWidthPx:1080,maxHeightPx:1080,maxDurationSec:null};
export function CapabilityEditor({initial,onChange}:{initial:CapabilityV1[];onChange:(v:CapabilityV1[])=>void}) {
  const [rows,setRows]=useState(initial.length?initial:[blank]);
  function update(index:number,patch:Partial<CapabilityV1>){const next=rows.map((r,i)=>i===index?{...r,...patch}:r);setRows(next);onChange(next);}
  const list=(value:string)=>value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  return <fieldset className="stack"><legend>Deliverable capabilities *</legend><p className="muted">Keep each media type with its own formats, dimensions and duration. An empty limit means unknown.</p>{rows.map((r,i)=><div className="card" key={i}><div className="grid">
    <div className="field"><label htmlFor={'kind-'+i}>Media type</label><select id={'kind-'+i} value={r.kind} onChange={e=>update(i,{kind:e.target.value as CapabilityV1['kind']})}><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="text">Text</option><option value="three_d">3D poster metadata</option></select></div>
    <div className="field"><label htmlFor={'formats-'+i}>Formats *</label><input id={'formats-'+i} value={r.formats.join(', ')} onChange={e=>update(i,{formats:list(e.target.value)})} required placeholder="png, jpeg"/></div>
    <div className="field"><label htmlFor={'ratios-'+i}>Aspect ratios</label><input id={'ratios-'+i} value={r.aspectRatios.join(', ')} onChange={e=>update(i,{aspectRatios:list(e.target.value)})} placeholder="9:16, 16:9"/></div>
    {(['maxWidthPx','maxHeightPx','maxDurationSec'] as const).map((field,n)=><div className="field" key={field}><label htmlFor={field+i}>{['Maximum width (px)','Maximum height (px)','Maximum duration (seconds)'][n]}</label><input id={field+i} type="number" min={1} value={r[field]??''} onChange={e=>update(i,{[field]:e.target.value?Number(e.target.value):null})}/></div>)}
    </div><button className="button button-secondary" type="button" disabled={rows.length===1} onClick={()=>{const next=rows.filter((_,x)=>x!==i);setRows(next);onChange(next);}}>Remove capability {i+1}</button></div>)}
    <button type="button" className="button button-secondary" disabled={rows.length>=12} onClick={()=>{const next=[...rows,{...blank}];setRows(next);onChange(next);}}>Add capability</button></fieldset>;
}
