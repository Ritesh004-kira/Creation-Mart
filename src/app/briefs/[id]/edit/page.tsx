import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/server/auth/require-user';
import { BriefBuilder } from './brief-builder';
export default async function EditBrief({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const {db}=await requireRole('brand','/briefs/'+id+'/edit');
 const [{data:owned,error},{data:catalog}]=await Promise.all([db.rpc('owned_briefs',{p_id:id}),db.from('catalog_terms').select('kind,slug,label').order('label')]);if(error)throw new Error('Brief unavailable.');const brief=owned?.[0];if(!brief)notFound();
 if(['engaged','completed','archived'].includes(brief.state))return <section className="card"><h1>This scope is frozen</h1><p>Selection preserves the brief and its requirements for delivery.</p><Link href={'/briefs/'+id}>Back to brief</Link></section>;
 return <div className="stack"><Link href={'/briefs/'+id}>← Back to brief</Link><h1>Edit {brief.payload.title??'production brief'}</h1><BriefBuilder id={id} initial={brief.payload} initialVersion={brief.version} initialState={brief.state} catalog={catalog??[]}/></div>;
}
