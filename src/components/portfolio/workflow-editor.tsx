'use client';
import { useState } from 'react';
import type { PortfolioInputV1 } from '@/domain/contracts';
import type { CatalogTerm } from '@/components/catalog-multi-select';
type Step=PortfolioInputV1['workflow'][number];
export function WorkflowEditor({initial,tools,onChange}:{initial:Step[];tools:CatalogTerm[];onChange:(steps:Step[])=>void}){
 const [steps,setSteps]=useState(initial);
 const commit=(next:Step[])=>{const ordered=next.map((s,i)=>({...s,ordinal:i+1}));setSteps(ordered);onChange(ordered);};
 const update=(index:number,patch:Partial<Step>)=>commit(steps.map((s,i)=>i===index?{...s,...patch}:s));
 return <fieldset id="workflow" className="stack"><legend>Production workflow *</legend><p className="muted">Use public summaries. Keep full prompts, releases and raw inputs in private evidence. At least one step is needed per item; your profile needs one item with three complete steps.</p>
  {steps.map((s,i)=><div className="card" key={s.id}><h3>Step {i+1}</h3><div className="grid"><div className="field"><label htmlFor={'stage-'+s.id}>Stage *</label><select id={'stage-'+s.id} value={s.stage} onChange={e=>update(i,{stage:e.target.value as Step['stage']})}>{['input','generation','editing','quality_check','export'].map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></div>
  <div className="field"><label htmlFor={'tool-'+s.id}>Tool *</label><select id={'tool-'+s.id} value={s.toolSlug} onChange={e=>update(i,{toolSlug:e.target.value})}><option value="">Choose a tool</option>{tools.map(t=><option value={t.slug} key={t.slug}>{t.label}</option>)}</select></div><div className="field"><label htmlFor={'version-'+s.id}>Tool version</label><input id={'version-'+s.id} value={s.toolVersion??''} maxLength={80} onChange={e=>update(i,{toolVersion:e.target.value})}/></div></div>
  {([['description','What happened'],['humanAction','What you did'],['inputDeclaration','Inputs and permissions']] as const).map(([key,label])=><div className="field" key={key}><label htmlFor={key+s.id}>{label} *</label><textarea id={key+s.id} value={s[key]} required maxLength={2000} onChange={e=>update(i,{[key]:e.target.value})}/></div>)}
  <div className="field"><label htmlFor={'excerpt-'+s.id}>Public prompt excerpt</label><textarea id={'excerpt-'+s.id} maxLength={500} value={s.promptExcerpt??''} onChange={e=>update(i,{promptExcerpt:e.target.value})}/></div>
  <div className="actions"><button type="button" className="button button-secondary" disabled={i===0} onClick={()=>{const next=[...steps];[next[i-1],next[i]]=[next[i],next[i-1]];commit(next);}}>Move step {i+1} up</button><button type="button" className="button button-secondary" onClick={()=>commit(steps.filter((_,n)=>n!==i))}>Remove step {i+1}</button></div></div>)}
  <button type="button" className="button button-secondary" disabled={steps.length>=12} onClick={()=>commit([...steps,{id:crypto.randomUUID(),ordinal:steps.length+1,stage:'input',toolSlug:'',description:'',humanAction:'',inputDeclaration:''}])}>Add workflow step</button>
 </fieldset>;
}
