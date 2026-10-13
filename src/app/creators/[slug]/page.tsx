import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/server/supabase';
import { AssetView } from '@/components/media/asset-view';
import { PassportCard } from '@/components/passport/passport-card';
import { ClaimSignals } from '@/components/passport/claim-signals';
import { portfolioInput } from '@/server/services/portfolio';
import type { PortfolioInputV1 } from '@/domain/contracts';
export default async function PublicCreator({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{from?:string}>}){
 const {slug}=await params;if(!/^[a-z0-9-]{1,80}$/.test(slug))notFound();const db=await serverSupabase();
 const {data:p,error}=await db.from('creator_profiles').select('*').eq('slug',slug).eq('published',true).maybeSingle();if(error)throw new Error('Creator could not be loaded.');if(!p)notFound();
 const {data:items,error:ie}=await db.from('portfolio_items').select('*').eq('creator_id',p.user_id).eq('published',true).order('created_at');if(ie)throw new Error('Work could not be loaded.');
 const ids=(items??[]).map(i=>i.preview_asset_id).filter(Boolean),{data:assets}=ids.length?await db.from('assets').select('id,checked_at,sha256,checks').in('id',ids):{data:[]};
 const {data:signals,error:signalError}=items?.length?await db.from('claim_signals').select('id,item_id,status,assertion,stale,simulated,method,checked_at,limitations').in('item_id',items.map(item=>item.id)).neq('claim_code','file_metadata'):{data:[],error:null};if(signalError)throw new Error('Claim evidence could not be loaded.');
 const search=await searchParams,back=search.from?.startsWith('/creators?')&&!search.from.includes('\\')?search.from:'/creators';
 return <div className="stack"><Link href={back}>← Back to creators</Link><section className="card"><div className="eyebrow">Creator production profile</div><h1>{p.display_name}</h1><p>{p.headline}</p><p>{p.bio}</p><div className="actions"><span className="pill">Capabilities are creator declared</span><span className="pill">{p.available?'Available for new briefs':'Currently unavailable'}</span>{p.is_demo&&<span className="pill">Fictional demo creator</span>}</div><p className="muted">Starting project quote: {p.currency} {(p.minimum_price_minor/100).toLocaleString()} · Typical delivery: {p.delivery_days} days</p></section>
 <section className="card"><h2>Declared deliverables</h2><div className="grid">{p.capabilities.map((c:{kind:string;formats:string[];aspectRatios:string[];maxWidthPx:number|null;maxHeightPx:number|null;maxDurationSec:number|null},i:number)=><div key={i}><h3>{c.kind==='three_d'?'3D poster metadata':c.kind}</h3><p>{c.formats.join(', ').toUpperCase()}{c.aspectRatios.length?' · '+c.aspectRatios.join(', '):''}</p><p className="muted">Max dimensions: {c.maxWidthPx&&c.maxHeightPx?c.maxWidthPx+' × '+c.maxHeightPx:'unknown'}{c.kind==='video'||c.kind==='audio'?' · Max duration: '+(c.maxDurationSec??'unknown')+' sec':''}</p></div>)}</div></section>
 <section className="stack"><h2>Work and production passports</h2>{items?.map(item=><article className="stack" key={item.id}><h3>{item.title}</h3><p>{item.objective}</p>{item.media_kind==='three_d'&&<p className="pill">Poster and declared source metadata · no interactive 3D viewer</p>}<AssetView assetId={item.preview_asset_id} kind={item.media_kind} title={item.title}/><PassportCard item={portfolioInput(item) as PortfolioInputV1} checks={assets?.find(a=>a.id===item.preview_asset_id)}/><ClaimSignals signals={(signals??[]).filter(signal=>signal.item_id===item.id)}/></article>)}</section></div>;
}
