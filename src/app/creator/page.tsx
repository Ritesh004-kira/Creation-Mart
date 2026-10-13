import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
export default async function Creator(){
  const {db,user,account}=await requireRole('creator','/creator');
  const {data:p,error}=await db.from('creator_profiles').select('headline,published,slug').eq('user_id',user.id).single();
  if(error)throw new Error('Creator workspace unavailable.');
  return <div className="stack"><div className="eyebrow">Creator workspace</div><h1>Welcome, {account.display_name}</h1><section className="card"><span className="pill">{p.published?'Published':'Draft'}</span><h2>Your production profile</h2><p>{p.headline||'Tell brands about the work you can produce.'}</p><Link className="button button-primary" href="/creator/profile">Edit profile</Link></section></div>;
}
