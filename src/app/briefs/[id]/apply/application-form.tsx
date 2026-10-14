'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RightsEditor } from '@/components/rights/rights-editor';
import { readRightsOffer } from '@/components/rights/form-data';
import { ModelEditor } from '@/components/portfolio/model-editor';
import type { ModelRefV1,RightsOfferV1 } from '@/domain/contracts';
import { applicationSchema } from '@/domain/contracts/engagement';
export function ApplicationForm({briefId,revision,currency,offer}:{briefId:string;revision:number;currency:string;offer:RightsOfferV1}){
 const [pipeline,setPipeline]=useState<ModelRefV1[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget),parsed=applicationSchema.safeParse({briefRevision:revision,quoteMinor:Math.round(Number(f.get('quote'))*100),currency,deliveryDays:Number(f.get('deliveryDays')),note:String(f.get('note')),pipeline,rightsOffer:readRightsOffer(f)});
 if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join(' · '));setBusy(false);return;}try{const response=await fetch('/api/v1/briefs/'+briefId+'/applications',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(parsed.data)});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'The application could not be submitted.');window.location.assign('/briefs/'+briefId);}catch(e){setError(e instanceof Error?e.message:'Try again.');setBusy(false);}}
 return <form onSubmit={submit} className="stack">{error&&<div role="alert" className="error">{error}</div>}<section className="card"><h2>Your proposal</h2><p>Applying to published revision {revision}. Selection checks the current quote, schedule, capabilities and usage.</p><div className="field"><label htmlFor="quote">Project quote in {currency} *</label><input id="quote" name="quote" type="number" min={0.01} step={0.01} required/></div><div className="field"><label htmlFor="deliveryDays">Delivery days *</label><input id="deliveryDays" name="deliveryDays" type="number" min={1} max={90} required/></div><div className="field"><label htmlFor="note">Production proposal *</label><textarea id="note" name="note" minLength={10} maxLength={2000} required placeholder="Describe the production plan and human contribution."/></div><ModelEditor value={pipeline} onChange={setPipeline}/></section><section className="card"><RightsEditor offer={offer}/></section><Button disabled={busy}>{busy?'Submitting…':'Submit application'}</Button></form>;
}
