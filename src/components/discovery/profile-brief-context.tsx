'use client';
import { trackedFetch } from '@/lib/tracked-fetch';
import {useState} from 'react';
import Link from 'next/link';
import type {CreatorMatch} from '@/server/services/discovery';
import {FitBreakdown} from './fit-breakdown';
import {RightsReceipt} from '@/components/rights/rights-receipt';
export function ProfileBriefContext({briefId,match,saved:initialSaved}:{briefId:string;match:CreatorMatch|null;saved:boolean}){
  const [saved,setSaved]=useState(initialSaved),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function save(){setBusy(true);setError('');try{const r=await trackedFetch('/api/v1/briefs/'+briefId+'/shortlist',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({creatorId:match!.id})});const b=await r.json();if(!r.ok)throw new Error(b.error?.message??'This creator could not be saved.');setSaved(true);}catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}}
  return <section className="card stack"><div><div className="eyebrow">Your brief context</div><h2>Explainable Brief Fit</h2><p className="muted">Review the production fit and requested usage alongside this creator’s work.</p></div>{match?<>{match.fit!==null&&match.terms&&<FitBreakdown score={match.fit} terms={match.terms} reasons={match.reasons}/>}<h2>Rights Fit Receipt</h2>{match.rightsReceipt&&<RightsReceipt receipt={match.rightsReceipt}/>}<button className="button button-primary" aria-busy={busy} disabled={busy||saved} onClick={save}>{saved?'Saved to shortlist':busy?'Saving…':'Save to shortlist'}</button></>:<p>This creator no longer appears in your current brief results. Return to discovery to review the latest capabilities and filters.</p>}{error&&<p className="error" role="alert">{error}</p>}<div className="actions"><Link href={'/briefs/'+briefId}>Back to brief</Link><Link href={'/briefs/'+briefId+'/shortlist'}>Compare saved creators</Link></div></section>;
}
