import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/server/auth/require-user';
import { portfolioInput } from '@/server/services/portfolio';
import { PortfolioForm } from './portfolio-form';
import { EvidenceManager } from '@/components/portfolio/evidence-manager';
export default async function EditPortfolio({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const {db,user}=await requireRole('creator','/portfolio/'+id+'/edit');
 const [{data:item,error},{data:catalog},{data:profile}]=await Promise.all([db.from('portfolio_items').select('*').eq('id',id).eq('creator_id',user.id).maybeSingle(),db.from('catalog_terms').select('kind,slug,label').order('label'),db.from('creator_profiles').select('rights_offer').eq('user_id',user.id).single()]);
 if(error)throw new Error('Work could not be loaded.');if(!item)notFound();
 const [{data:evidence,error:evidenceError},{data:signals,error:signalError}]=await Promise.all([db.from('assets').select('id,format,checked_at').eq('portfolio_item_id',id).eq('owner_id',user.id).eq('purpose','evidence').eq('state','ready').is('object_deleted_at',null),db.from('claim_signals').select('id,status,assertion,stale,simulated,method,checked_at,limitations').eq('item_id',id).order('created_at')]);if(evidenceError||signalError)throw new Error('Evidence could not be loaded.');
 return <div className="stack"><Link href="/creator">← Back to creator dashboard</Link><div><div className="eyebrow">Production passport</div><h1>Edit {item.title}</h1><p className="muted">Save before publishing. A checked preview and complete production declarations are required.</p></div><PortfolioForm id={id} initial={portfolioInput(item)} initialVersion={item.version} initialPublished={item.published} catalog={catalog??[]} profileOffer={profile?.rights_offer??null}/><EvidenceManager itemId={id} initialAssets={evidence??[]} initialSignals={signals??[]}/></div>;
}
