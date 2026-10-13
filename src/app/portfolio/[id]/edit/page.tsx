import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/server/auth/require-user';
import { portfolioInput } from '@/server/services/portfolio';
import { PortfolioForm } from './portfolio-form';
export default async function EditPortfolio({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const {db,user}=await requireRole('creator','/portfolio/'+id+'/edit');
 const [{data:item,error},{data:catalog},{data:profile}]=await Promise.all([db.from('portfolio_items').select('*').eq('id',id).eq('creator_id',user.id).maybeSingle(),db.from('catalog_terms').select('kind,slug,label').order('label'),db.from('creator_profiles').select('rights_offer').eq('user_id',user.id).single()]);
 if(error)throw new Error('Work could not be loaded.');if(!item)notFound();
 return <div className="stack"><Link href="/creator">← Back to creator dashboard</Link><div><div className="eyebrow">Production passport</div><h1>Edit {item.title}</h1><p className="muted">Save before publishing. A checked preview and complete production declarations are required.</p></div><PortfolioForm id={id} initial={portfolioInput(item)} initialVersion={item.version} initialPublished={item.published} catalog={catalog??[]} profileOffer={profile?.rights_offer??null}/></div>;
}
