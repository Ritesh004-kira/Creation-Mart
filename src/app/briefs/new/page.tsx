import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
import { NewBrief } from './new-brief';
import { WorkspaceHero } from '@/components/ui/workspace';
export default async function NewBriefPage(){await requireRole('brand','/briefs/new');return <div className="workspace-page"><WorkspaceHero eyebrow="YOUR NEXT CREATIVE PROJECT" title="Start a production brief" description="Great work starts with a clear idea. Name your project, then build the scope, deliverables, and usage requirements at your own pace."><Link className="button button-secondary" href="/brand">← Back to brand dashboard</Link></WorkspaceHero><section className="narrow card new-brief-card"><div className="eyebrow">01 / Make it yours</div><h2>Give your idea a name.</h2><p className="muted">Save a private draft, define exact outputs and answer usage questions before publishing.</p><NewBrief/></section></div>;}
