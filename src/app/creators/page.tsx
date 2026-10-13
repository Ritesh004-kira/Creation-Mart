import { z } from 'zod';
import { serverSupabase } from '@/server/supabase';
import { parseDiscoveryParams } from '@/domain/contracts/discovery';
import { discover } from '@/server/services/discovery';
import { DiscoveryView } from '@/components/discovery/discovery-view';
export default async function Creators({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const source=await searchParams,params=new URLSearchParams();for(const [key,value] of Object.entries(source))for(const entry of Array.isArray(value)?value:value?[value]:[])params.append(key,entry);
 let filters;try{filters=parseDiscoveryParams(params);}catch{return <section className="card"><h1>These filters are invalid</h1><a href="/creators">Reset search</a></section>;}
 const briefId=params.get('briefId'),page=Number(params.get('page')??1);if(briefId&&!z.uuid().safeParse(briefId).success||!Number.isInteger(page)||page<1||page>100)return <section className="card"><h1>That search context is invalid</h1><a href="/creators">Reset search</a></section>;
 const db=await serverSupabase();const [{data:catalog,error},{data:auth}]=await Promise.all([db.from('catalog_terms').select('kind,slug,label').order('label'),db.auth.getUser()]);if(error)throw new Error('Search catalog unavailable.');
 const {data:account}=auth.user?await db.from('accounts').select('role').eq('id',auth.user.id).single():{data:null};
 const data=await discover(filters,briefId,page);
 const {data:saved}=briefId&&account?.role==='brand'?await db.from('shortlists').select('creator_id').eq('brief_id',briefId):{data:[]};
 return <div className="stack"><div><div className="eyebrow">Explainable creator discovery</div><h1>Find a production fit</h1><p className="muted">Every result comes from published records. Brief fit explains declared capabilities and evidence completeness.</p></div><DiscoveryView key={params.toString()} data={data} catalog={catalog??[]} queryString={params.toString()} briefId={briefId} brand={account?.role==='brand'} page={page} initialSaved={saved?.map(s=>s.creator_id)??[]}/></div>;
}
