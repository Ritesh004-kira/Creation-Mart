import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverSupabase } from '@/server/supabase';
import { AssetView } from '@/components/media/asset-view';
import { PassportCard } from '@/components/passport/passport-card';
import { ClaimSignals } from '@/components/passport/claim-signals';
import { portfolioInput } from '@/server/services/portfolio';
import type { PortfolioInputV1 } from '@/domain/contracts';
import {z} from 'zod';
import {parseDiscoveryParams} from '@/domain/contracts/discovery';
import {discover, type CreatorMatch} from '@/server/services/discovery';
import {ProfileBriefContext} from '@/components/discovery/profile-brief-context';
export default async function PublicCreator({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{from?:string}>}){
 const {slug}=await params;if(!/^[a-z0-9-]{1,80}$/.test(slug))notFound();const db=await serverSupabase();
 const {data:p,error}=await db.from('creator_profiles').select('*').eq('slug',slug).eq('published',true).maybeSingle();if(error)throw new Error('Creator could not be loaded.');if(!p)notFound();
 const {data:items,error:ie}=await db.from('portfolio_items').select('*').eq('creator_id',p.user_id).eq('published',true).order('created_at');if(ie)throw new Error('Work could not be loaded.');
 const ids=(items??[]).map(i=>i.preview_asset_id).filter(Boolean),{data:assets}=ids.length?await db.from('assets').select('id,checked_at,sha256,checks').in('id',ids):{data:[]};
 const {data:signals,error:signalError}=items?.length?await db.from('claim_signals').select('id,item_id,status,assertion,stale,simulated,method,checked_at,limitations').in('item_id',items.map(item=>item.id)).neq('claim_code','file_metadata'):{data:[],error:null};if(signalError)throw new Error('Claim evidence could not be loaded.');
 const search=await searchParams,back=search.from?.startsWith('/creators?')&&!search.from.includes('\\')?search.from:'/creators';
 let context:{briefId:string;match:CreatorMatch|null;saved:boolean}|null=null;
 const query=new URLSearchParams(back.split('?')[1]??''),briefId=query.get('briefId');
 if(briefId&&z.uuid().safeParse(briefId).success){
   const {data:auth}=await db.auth.getUser();
   const {data:account}=auth.user?await db.from('accounts').select('role').eq('id',auth.user.id).maybeSingle():{data:null};
   if(account?.role==='brand'){
     const filters=parseDiscoveryParams(query),page=Number(query.get('page')??1);
     const result=await discover(filters,briefId,Number.isInteger(page)&&page>0&&page<=100?page:1);
     const {data:saved}=await db.from('shortlists').select('id').eq('brief_id',briefId).eq('creator_id',p.user_id).maybeSingle();
     context={briefId,match:result.items.find(c=>c.id===p.user_id)??null,saved:Boolean(saved)};
   }
 }
 return <div className="stack"><Link href={back}>← Back to creators</Link><section className="card profile-intro"><div className="eyebrow">Creator production profile</div><h1>{p.display_name}</h1><p>{p.headline}</p><p>{p.bio}</p><div className="actions"><span className="pill">Capabilities are creator declared</span><span className="pill">{p.available?'Available for new briefs':'Currently unavailable'}</span>{p.is_demo&&<span className="pill">Illustrative creator profile</span>}</div><p className="muted">Starting project quote: {p.currency} {(p.minimum_price_minor/100).toLocaleString()} · Typical delivery: {p.delivery_days} days</p></section>
 {context&&<ProfileBriefContext {...context}/>}<section className="card"><h2>Declared deliverables</h2><div className="grid">{p.capabilities.map((c:{kind:string;formats:string[];aspectRatios:string[];maxWidthPx:number|null;maxHeightPx:number|null;maxDurationSec:number|null},i:number)=><div key={i}><h3>{c.kind==='three_d'?'3D poster metadata':c.kind}</h3><p>{c.formats.join(', ').toUpperCase()}{c.aspectRatios.length?' · '+c.aspectRatios.join(', '):''}</p><p className="muted">Max dimensions: {c.maxWidthPx&&c.maxHeightPx?c.maxWidthPx+' × '+c.maxHeightPx:'unknown'}{c.kind==='video'||c.kind==='audio'?' · Max duration: '+(c.maxDurationSec??'unknown')+' sec':''}</p></div>)}</div></section>
 <section className="stack"><h2>Work and production passports</h2>{items?.map(item=><article className="stack profile-work" key={item.id}><h3>{item.title}</h3><p>{item.objective}</p>{item.media_kind==='three_d'&&<p className="pill">Poster and declared source metadata · no interactive 3D viewer</p>}<AssetView assetId={item.preview_asset_id} kind={item.media_kind} title={item.title}/><PassportCard item={portfolioInput(item) as PortfolioInputV1} checks={assets?.find(a=>a.id===item.preview_asset_id)}/><ClaimSignals signals={(signals??[]).filter(signal=>signal.item_id===item.id)}/></article>)}</section></div>;
}
