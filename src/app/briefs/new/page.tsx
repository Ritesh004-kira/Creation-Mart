import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
import { NewBrief } from './new-brief';
export default async function NewBriefPage(){await requireRole('brand','/briefs/new');return <section className="narrow card"><Link href="/brand">← Back to brand dashboard</Link><h1>Start a production brief</h1><p className="muted">Save a private draft, define exact outputs and answer usage questions before publishing.</p><NewBrief/></section>;}
