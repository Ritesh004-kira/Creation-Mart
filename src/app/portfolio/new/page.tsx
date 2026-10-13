import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
import { NewWork } from './new-work';
export default async function NewPortfolio(){await requireRole('creator','/portfolio/new');return <section className="narrow card"><Link href="/creator">← Back to creator dashboard</Link><h1>Add a work item</h1><p className="muted">Start privately. Upload a preview and document your process before publishing.</p><NewWork/></section>;}
