'use client';
import { useEffect,useState } from 'react';
import type { Contact } from '@/domain/contact';
import { trackedFetch } from '@/lib/tracked-fetch';
import { LoadingState } from '@/components/ui/spinner';
export function CollaboratorContact({engagementId}:{engagementId:string}) {
  const [contact,setContact]=useState<Contact|null|undefined>(undefined),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();setContact(undefined);setError('');void (async()=>{try{const r=await trackedFetch('/api/v1/engagements/'+engagementId+'/contact',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30_000)])});const b=await r.json();if(!r.ok)throw new Error(b.error?.message??'Contact information unavailable.');setContact(b.data?.payload??null);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Contact information unavailable.');}})();return()=>controller.abort();},[engagementId,attempt]);
  return <section className="card"><h2>Creator contact information</h2>{error?<div className="error" role="alert">{error}<button type="button" className="button button-secondary" onClick={()=>setAttempt(x=>x+1)}>Retry contact details</button></div>:contact===undefined?<LoadingState label="Loading collaborator contact…" compact/>:contact&&Object.values(contact).some(Boolean)?<dl className="contact-summary">{Object.entries(contact).filter(([,value])=>value).map(([key,value])=><div key={key}><dt>{key.replace(/([A-Z])/g,' $1')}</dt><dd>{key==='email'||key==='alternateEmail'?<a href={'mailto:'+value}>{value}</a>:key==='phone'||key==='whatsapp'?<a href={'tel:'+value.replace(/[^+0-9]/g,'')}>{value}</a>:['website','linkedin','instagram'].includes(key)?<a href={value} target="_blank" rel="noopener noreferrer">{value}</a>:value}</dd></div>)}</dl>:<p className="muted">Your collaborator has not shared contact details. They can enable sharing in contact settings.</p>}</section>;
}
