import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
export default async function Creator(){
  const {db,user,account}=await requireRole('creator','/creator');
  const [{data:p,error},{data:items,error:itemError}]=await Promise.all([db.from('creator_profiles').select('headline,published,slug').eq('user_id',user.id).single(),db.from('portfolio_items').select('id,title,media_kind,published').eq('creator_id',user.id).order('created_at',{ascending:false})]);
  if(error)throw new Error('Creator workspace unavailable.');
  if(itemError)throw new Error('Your work could not be loaded.');
  return <div className="stack"><div className="eyebrow">Creator workspace</div><h1>Welcome, {account.display_name}</h1><section className="card"><span className="pill">{p.published?'Published':'Draft'}</span><h2>Your production profile</h2><p>{p.headline||'Tell brands about the work you can produce.'}</p><div className="actions"><Link className="button button-primary" href="/creator/profile">Edit profile</Link><Link className="button button-secondary" href="/creator/preview">Preview and publish profile</Link></div></section>
  <section className="stack"><div className="actions"><h2>Your portfolio</h2><Link className="button button-primary" href="/portfolio/new">Add work</Link></div>{items?.length?<div className="grid">{items.map(i=><article className="card" key={i.id}><span className="pill">{i.published?'Published':'Draft'}</span><h3>{i.title}</h3><p className="muted">{i.media_kind==='three_d'?'3D poster metadata':i.media_kind}</p><Link href={'/portfolio/'+i.id+'/edit'}>Edit work and process →</Link></article>)}</div>:<div className="card">Add your first work item, upload a checked preview and describe how it was made.</div>}</section></div>;
}
