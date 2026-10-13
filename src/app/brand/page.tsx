import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
export default async function Brand(){const {account}=await requireRole('brand','/brand');return <div className="stack"><div className="eyebrow">Brand workspace</div><h1>Welcome, {account.display_name}</h1><section className="card"><h2>Build a precise production brief</h2><p>Describe your outputs, production needs and usage permissions to find eligible creators.</p><Link className="button button-primary" href="/briefs/new">Start a brief</Link></section></div>;}
