import Link from 'next/link';
import { serverSupabase } from '@/server/supabase';
export default async function Home() {
  const db=await serverSupabase();const {data,error}=await db.from('creator_profiles').select('slug,display_name,headline,specialties').eq('published',true).limit(3);
  return <><section className="hero"><div className="eyebrow">From production brief to final delivery</div>
    <h1>Find the creator.<br/>Understand the craft.</h1><p>Discover creative talent by what they can deliver, see the process behind their work, and review every output against your brief.</p>
    <div className="actions"><Link href="/creators" className="button button-primary">Browse creators →</Link><Link href="/briefs/new" className="button button-secondary">Start a brief</Link></div>
  </section><section aria-labelledby="featured-title" className="stack"><h2 id="featured-title">Meet the creators</h2>
    {error?<div className="error">Creator discovery is temporarily unavailable. <Link href="/">Try again</Link></div>:data?.length?<div className="grid">{data.map(c=><Link className="card" key={c.slug} href={'/creators/'+c.slug}><h3>{c.display_name}</h3><p>{c.headline}</p><span className="pill">Creator declared</span></Link>)}</div>:<div className="card"><h3>The first portfolios are on their way</h3><p className="muted">Creators publish their work and production process here.</p><Link href="/sign-in?returnTo=/onboarding">Create your profile →</Link></div>}
  </section><section id="how-it-works" className="stack" style={{marginTop:64}}><h2>A clear path from idea to acceptance</h2><div className="grid">
    <article className="card"><div className="eyebrow">01 / Inspect the process</div><h3>Production passports</h3><p>Explore tools, inputs and human choices, with precise labels for declarations and file checks.</p></article>
    <article className="card"><div className="eyebrow">02 / Find a fit</div><h3>A brief that means something</h3><p>Define formats, dimensions, deadlines and usage. Understand why each eligible creator fits.</p></article>
    <article className="card"><div className="eyebrow">03 / Review the delivery</div><h3>Requirements that travel with the work</h3><p>Select an applicant, review versions, request revisions and accept the latest files privately.</p></article>
  </div></section></>;
}
