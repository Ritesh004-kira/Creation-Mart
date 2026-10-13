import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/server/auth/require-user';
import { discover } from '@/server/services/discovery';
import { ShortlistView } from './shortlist-view';
export default async function Shortlist({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const {db}=await requireRole('brand','/briefs/'+id+'/shortlist');const {data:owned,error}=await db.rpc('owned_briefs',{p_id:id});if(error)throw new Error('Brief unavailable.');const brief=owned?.[0];if(!brief)notFound();
 const {data:rows,error:se}=await db.from('shortlists').select('id,creator_id').eq('brief_id',id).order('created_at');if(se)throw new Error('Shortlist unavailable.');const ids=rows?.map(r=>r.creator_id)??[];
 const {data:profiles,error:pe}=ids.length?await db.from('creator_profiles').select('user_id,display_name,slug,available,currency,minimum_price_minor,capabilities').in('user_id',ids).eq('published',true):{data:[],error:null};if(pe)throw new Error('Saved creators unavailable.');
 const match=brief.state==='published'?await discover({},id,1,24):null;
 return <div className="stack"><Link href={'/briefs/'+id}>← Back to brief</Link><h1>{brief.payload.title??'Brief'} shortlist</h1><Link className="button button-secondary" href={'/creators?briefId='+id}>Return to discovery</Link><ShortlistView briefId={id} candidates={(rows??[]).map(r=>({id:r.id,creatorId:r.creator_id,profile:profiles?.find(p=>p.user_id===r.creator_id)??null,match:match?.items.find(c=>c.id===r.creator_id)??null}))}/></div>;
}
