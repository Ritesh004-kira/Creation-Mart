'use client';
import { useState } from 'react';
import type { RightsRequestV1 } from '@/domain/contracts';
export function RightsRequestEditor({value,onChange}:{value:Partial<RightsRequestV1>;onChange:(v:Partial<RightsRequestV1>)=>void}){
 const [territories,setTerritories]=useState(value.territories?.join(', ')??'');
 const set=(patch:Partial<RightsRequestV1>)=>onChange({...value,schemaVersion:1,jurisdictionNotes:value.jurisdictionNotes??'',...patch});
 return <fieldset id="rightsRequest" className="stack"><legend>Requested usage *</legend><p className="muted">Answer each permission. These requirements are compared with creator declarations before selection and final acceptance.</p><div className="grid">
 {([['commercial','Commercial use'],['paidAds','Paid advertising'],['modifications','Modifications'],['sourceFiles','Source files'],['exclusiveArrangement','Exclusive arrangement'],['trainingUse','Model training use'],['attributionAccepted','Accept required attribution']] as const).map(([key,label])=><div className="field" key={key}><label htmlFor={key}>{label} *</label><select id={key} value={value[key]===undefined?'':String(value[key])} onChange={e=>set({[key]:e.target.value===''?undefined:e.target.value==='true'})}><option value="">Choose an answer</option><option value="true">Yes</option><option value="false">No</option></select></div>)}</div>
 <div className="field"><label htmlFor="territories">Usage territories *</label><input id="territories" value={territories} onChange={e=>{setTerritories(e.target.value);set({territories:e.target.value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean)});}} placeholder="WORLD, or IN, GB"/><small>Use WORLD or country codes.</small></div>
 <div className="field"><label htmlFor="termDays">Usage term in days *</label><input id="termDays" type="number" min={1} max={36500} value={value.termDays??''} onChange={e=>set({termDays:e.target.value?Number(e.target.value):undefined})}/></div>
 <div className="field"><label htmlFor="jurisdictionNotes">Jurisdiction and usage notes</label><textarea id="jurisdictionNotes" maxLength={2000} value={value.jurisdictionNotes??''} onChange={e=>set({jurisdictionNotes:e.target.value})}/></div>
 </fieldset>;
}
