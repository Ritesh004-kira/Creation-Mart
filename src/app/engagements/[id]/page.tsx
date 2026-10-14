import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/server/auth/require-user';
import { AssetView } from '@/components/media/asset-view';
import { RightsReceipt } from '@/components/rights/rights-receipt';
import { DeliveryActions } from '@/components/engagements/delivery-actions';
import { CustomerCard } from '@/components/contact/customer-card';
import { CollaboratorContact } from '@/components/contact/collaborator-contact';
import { DownloadFile } from '@/components/engagements/download-file';
export default async function Engagement({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const {db,user}=await requireUser('/engagements/'+id);const {data:e,error}=await db.from('engagements').select('*').eq('id',id).maybeSingle();if(error)throw new Error('Engagement unavailable.');if(!e)notFound();
 const [{data:versions,error:ve},{data:events,error:ee}]=await Promise.all([db.from('submissions').select('*').eq('engagement_id',id).order('sequence',{ascending:false}),db.from('workflow_events').select('*').eq('engagement_id',id).order('created_at')]);if(ve||ee)throw new Error('Delivery history unavailable.');const latest=versions?.[0]??null,ids=versions?.flatMap(v=>v.asset_ids)??[];const {data:assets}=ids.length?await db.from('assets').select('id,kind,format,actual_bytes,checked_at').in('id',ids):{data:[]};
 const creator=e.creator_id===user.id,state={active:'In progress',submitted:'Awaiting brand review',revision_requested:'Changes requested',accepted:'Accepted'}[e.state as 'active'];
 return <div className="stack"><div className="actions"><Link href="/dashboard">← Back to dashboard</Link><Link href={'/briefs/'+e.brief_id}>Original brief</Link></div><section className="card"><span className="pill">{state}</span><h1>{e.brief_snapshot.title}</h1><p>{e.brief_snapshot.objective}</p><p className="muted">Frozen brief revision · Included revisions: {e.brief_snapshot.revisionRounds} · Used: {e.revision_count}</p></section>
 {creator?<CustomerCard briefId={e.brief_id}/>:<CollaboratorContact engagementId={id}/>}
 <section className="card"><h2>Frozen production requirements</h2><ul>{e.brief_snapshot.outputs.map((o:{id:string;label:string;quantity:number;format:string;widthPx?:number;heightPx?:number;durationSec?:number})=><li key={o.id}>{o.label}: {o.quantity} × {o.format.toUpperCase()}{o.widthPx?' · '+o.widthPx+' × '+o.heightPx:''}{o.durationSec?' · '+o.durationSec+' seconds':''}</li>)}</ul></section>
 <RightsReceipt receipt={e.selection_receipt}/>{latest?.feedback&&<section className="card"><h2>Latest revision feedback</h2><p>{latest.feedback.notes}</p><ul>{latest.feedback.requirementIds.map((id:string)=><li key={id}>{id}</li>)}</ul></section>}
 <DeliveryActions engagement={e} creator={creator} latest={latest}/>
 <section className="stack"><h2>Delivered versions</h2>{versions?.length?versions.map(v=><article className="card stack" key={v.id}><h3>Version {v.sequence}{latest?.id===v.id?' · latest':''}</h3><p className="muted">Submitted {new Date(v.submitted_at).toISOString().slice(0,19).replace('T',' ')} UTC</p><div className="grid">{v.asset_ids.map((id:string)=>{const a=assets?.find(a=>a.id===id);return a?<div key={id} className="stack"><AssetView assetId={id} kind={a.kind} title={'Delivery version '+v.sequence}/><p className="muted">File checked · {a.format.toUpperCase()} · {a.actual_bytes.toLocaleString()} bytes</p>{e.state==='accepted'&&latest?.id===v.id&&<DownloadFile id={id}/>}</div>:null;})}</div><RightsReceipt receipt={v.rights_receipt}/>{v.feedback&&<p><strong>Feedback:</strong> {v.feedback.notes}</p>}{v.brand_review&&<p><strong>Brand review:</strong> {v.brand_review.rightsResolutionNote}</p>}</article>):<div className="card">No delivered versions yet.</div>}</section>
 <section className="card"><h2>Activity history</h2><ol>{events?.map(event=><li key={event.id}>{event.event_type.replaceAll('_',' ')} · {new Date(event.created_at).toISOString().slice(0,19).replace('T',' ')} UTC</li>)}</ol></section></div>;
}
