import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/server/auth/require-user';
import type { BriefDraftV1,RequirementV1 } from '@/domain/contracts';
import { CopyBriefLink } from './copy-link';
import { WithdrawApplication } from './withdraw-application';
export default async function BriefDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const {db,account}=await requireUser('/briefs/'+id);let b;
 if(account?.role==='brand'){const {data,error}=await db.rpc('owned_briefs',{p_id:id});if(error)throw new Error('Brief unavailable.');b=data?.[0];}
 else{const {data,error}=await db.from('briefs').select('id,brand_id,state,safe_payload,requirements,revision,published_revision,version').eq('id',id).maybeSingle();if(error)throw new Error('Brief unavailable.');b=data;}
 if(!b)notFound();
 const {data:application}=account?.role==='creator'?await db.from('applications').select('id,state,version,brief_revision').eq('brief_id',id).maybeSingle():{data:null};
 const {data:selectedEngagement}=await db.from('engagements').select('id').eq('brief_id',id).maybeSingle();
 const p=(b.payload??b.safe_payload) as BriefDraftV1,owner=account?.role==='brand';
 return <div className="stack"><Link href="/briefs">← Back to briefs</Link><section className="card brief-detail-summary"><div className="actions"><span className="pill">{b.state}</span><span className="pill">Revision {b.revision}</span><span className="pill">Production brief</span></div><h1>{p.title??'Draft brief'}</h1><p>{p.objective||'Complete the objective in the brief editor.'}</p><p className="muted">Audience: {p.audience||'not answered'} · {p.currency??'Currency not chosen'} {p.budgetMinMinor!==undefined?p.budgetMinMinor/100:'—'}–{p.budgetMaxMinor!==undefined?p.budgetMaxMinor/100:'—'}</p><p className="muted">Due: {p.dueAt?new Date(p.dueAt).toISOString().slice(0,16).replace('T',' ')+' UTC':'not answered'} · Included revisions: {p.revisionRounds??'not answered'}</p>
 <div className="actions">{owner&&['draft','published'].includes(b.state)&&<Link className="button button-primary" href={'/briefs/'+id+'/edit'}>{b.state==='published'?'Start next revision':'Continue draft'}</Link>}{owner&&b.state==='published'&&<><Link className="button button-primary" href={'/creators?briefId='+id}>Find eligible creators</Link><Link href={'/briefs/'+id+'/shortlist'}>Saved shortlist</Link><Link href={'/briefs/'+id+'/applications'}>View applications</Link></>}{!owner&&b.state==='published'&&<Link className="button button-primary" href={'/briefs/'+id+'/apply'}>Apply to this brief</Link>}<CopyBriefLink id={id}/></div></section>
 {application&&<section className="card"><h2>Your application</h2><span className="pill">{application.state} · Revision {application.brief_revision}</span>{application.state==='submitted'&&<WithdrawApplication id={application.id} version={application.version}/>}</section>}{selectedEngagement&&<Link className="button button-primary" href={'/engagements/'+selectedEngagement.id}>Open selected engagement</Link>}
 <section className="card"><h2>Required outputs</h2>{p.outputs?.length?p.outputs.map((o,i)=><article key={o.id??i}><h3>{o.label??'Output '+(i+1)}</h3><p>{o.quantity??'—'} × {o.kind??'type not chosen'} · {o.format?.toUpperCase()??'format not chosen'}{o.widthPx&&o.heightPx?' · '+o.widthPx+' × '+o.heightPx+' ('+o.aspectRatio+')':''}{o.durationSec?' · '+o.durationSec+' sec':''}</p><p>{o.contentRequirements}</p></article>):<p>No outputs defined yet.</p>}</section>
 <section className="card"><h2>Production and usage</h2><p>Outcomes: {p.outcomes?.join(', ')||'not answered'}</p><p>Styles: {p.styles?.join(', ')||'no preferences'}</p><p>Required tools: {p.requiredTools?.join(', ')||'none'}</p><p>Usage territories: {p.rightsRequest?.territories?.join(', ')||'not answered'} · Term: {p.rightsRequest?.termDays??'—'} days</p><p className="muted">Usage is compared with creator declarations and references. A compatible receipt is not legal clearance.</p></section>
 {b.requirements?.length>0&&<section className="card"><h2>Delivery checks from this published revision</h2><ol>{(b.requirements as RequirementV1[]).map(r=><li key={r.id}>{r.kind} · {r.mode==='file_check'?'file check':r.mode==='brand_review'?'brand review':'declaration review'}<details><summary>Requirement detail</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(r.expected,null,2)}</pre></details></li>)}</ol></section>}
 </div>;
}
