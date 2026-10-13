import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
import { CompanyForm } from './company-form';
export default async function Brand(){
 const {account,db,user}=await requireRole('brand','/brand');const [{data:briefs,error},{data:company,error:ce},{data:engagements,error:ee}]=await Promise.all([
 db.rpc('owned_briefs',{p_id:null}),db.from('brand_profiles').select('*').eq('user_id',user.id).single(),db.from('engagements').select('id,state,brief_snapshot').eq('brand_id',user.id).order('selected_at',{ascending:false})]);
 if(error||ce||ee)throw new Error('Brand workspace unavailable.');
 return <div className="stack"><div className="eyebrow">Brand workspace</div><h1>Welcome, {account.display_name}</h1><section className="card"><h2>Build a precise production brief</h2><p>Describe your outputs, production needs and usage permissions to find eligible creators.</p><Link className="button button-primary" href="/briefs/new">Start a brief</Link></section><CompanyForm initial={company}/>
 <section className="stack"><h2>Delivery and review</h2>{engagements?.length?<div className="grid">{engagements.map(e=><article key={e.id} className="card"><span className="pill">{e.state.replaceAll('_',' ')}</span><h3>{e.brief_snapshot.title}</h3><Link className="button button-primary" href={'/engagements/'+e.id}>Open review workspace</Link></article>)}</div>:<div className="card">Select a submitted application to start an engagement.</div>}</section>
 <section className="stack"><h2>Your saved briefs</h2>{briefs?.length?<div className="grid">{briefs.map((b:{id:string;state:string;payload:{title?:string}})=><article className="card" key={b.id}><span className="pill">{b.state}</span><h3>{b.payload.title??'Draft brief'}</h3><div className="actions"><Link href={'/briefs/'+b.id}>Open brief →</Link>{b.state==='published'&&<><Link href={'/briefs/'+b.id+'/applications'}>Review applicants</Link><Link href={'/briefs/'+b.id+'/shortlist'}>Saved shortlist</Link></>}</div></article>)}</div>:<div className="card">Your private drafts and published briefs appear here after you save them.</div>}</section></div>;
}
