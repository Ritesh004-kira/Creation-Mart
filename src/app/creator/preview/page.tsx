import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
import { AssetView } from '@/components/media/asset-view';
import { PassportCard } from '@/components/passport/passport-card';
import { portfolioInput } from '@/server/services/portfolio';
import type { PortfolioInputV1 } from '@/domain/contracts';
import { PublishProfile } from './publish-profile';
export default async function CreatorPreview(){
 const {db,user}=await requireRole('creator','/creator/preview');const [{data:p},{data:items,error}]=await Promise.all([db.from('creator_profiles').select('*').eq('user_id',user.id).single(),db.from('portfolio_items').select('*').eq('creator_id',user.id).order('created_at')]);if(error||!p)throw new Error('Preview unavailable.');
 const ids=(items??[]).map(i=>i.preview_asset_id).filter(Boolean),{data:assets}=ids.length?await db.from('assets').select('id,checked_at,sha256,checks').in('id',ids):{data:[]};
 const rich=(items??[]).some(i=>i.published&&i.workflow.length>=3);
 return <div className="stack"><Link href="/creator">← Back to creator dashboard</Link><span className="pill">Owner preview · {p.published?'Published profile':'Draft profile'}</span><h1>{p.display_name}</h1><p>{p.headline}</p><p>{p.bio}</p>{!rich&&<div className="card">Publish at least one checked work item with three complete workflow steps before publishing your profile.</div>}<PublishProfile version={p.version} published={p.published}/>{p.published&&<Link href={'/creators/'+p.slug}>Open public profile →</Link>}
 <div className="actions"><Link href="/creator/profile">Edit profile</Link><Link href="/portfolio/new" className="button button-secondary">Add work</Link></div>
 {(items??[]).map(item=><article className="stack profile-work" key={item.id}><div className="actions"><h2>{item.title}</h2><span className="pill">{item.published?'Published':'Draft'}</span><Link href={'/portfolio/'+item.id+'/edit'}>Edit work</Link></div>{item.preview_asset_id&&<AssetView assetId={item.preview_asset_id} kind={item.media_kind} title={item.title}/>}<PassportCard item={portfolioInput(item) as PortfolioInputV1} checks={assets?.find(a=>a.id===item.preview_asset_id)}/></article>)}</div>;
}
