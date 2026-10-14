import Link from 'next/link';
import { requireUser } from '@/server/auth/require-user';
export default async function Briefs(){const {db,account}=await requireUser('/briefs');let items:{id:string;state:string;payload?:{title?:string};safe_payload?:{title?:string;objective?:string}}[];
 if(account?.role==='brand'){const {data,error}=await db.rpc('owned_briefs',{p_id:null});if(error)throw new Error('Briefs unavailable.');items=data??[];}
 else{const {data,error}=await db.from('briefs').select('id,state,safe_payload').eq('state','published').order('updated_at',{ascending:false});if(error)throw new Error('Briefs unavailable.');items=data??[];}
 return <div className="stack"><Link href="/dashboard">← Back to dashboard</Link><h1>{account?.role==='brand'?'Your briefs':'Available production briefs'}</h1>{account?.role==='brand'&&<Link className="button button-primary" href="/briefs/new">Start a brief</Link>}{items.length?<div className="grid">{items.map(b=><article className="card" key={b.id}><span className="pill">{b.state}</span><h2>{b.payload?.title??b.safe_payload?.title??'Draft brief'}</h2><p>{b.safe_payload?.objective}</p><Link href={'/briefs/'+b.id}>View brief →</Link></article>)}</div>:<div className="card">No briefs in this view yet. Refresh after a brand publishes a valid production brief.</div>}</div>;
}
