import type { Metadata } from 'next';
import Link from 'next/link';
import overview from '@/content/project-overview.json';

export const metadata: Metadata = {
  title: 'Project overview, features and architecture',
  description: 'Complete Creation Mart evaluation guide: production passports, explainable brief fit, rights receipts, executable briefs, architecture and delivery workflow.',
  alternates: { canonical: 'https://creation-mart.vercel.app/project-overview' },
};

function Sources({ paths }: { paths: string[] }) {
  return <p className="muted text-sm">Implementation: {paths.map((path, i) => <span key={path}>{i > 0 ? ' · ' : ''}<a href={`${overview.repository}/blob/main/${path}`}>{path}</a></span>)}</p>;
}

export default function ProjectOverview() {
  return <article className="stack mx-auto max-w-5xl">
    <header>
      <p className="eyebrow">CM-2.0 · Project documentation · 14 October 2026</p>
      <h1>Every feature. The complete workflow. The architecture behind it.</h1>
      <p className="text-lg">{overview.summary}</p>
      <div className="actions"><Link href="/creators" className="button button-primary">Explore creators</Link><a href={`${overview.repository}/tree/main`} className="button button-secondary">View source on GitHub</a><a href="/llms.txt" className="button button-secondary">Plain-text guide</a><a href="/project-overview.json" className="button button-secondary">Feature catalog JSON</a></div>
    </header>
    <nav aria-label="Project documentation sections" className="card actions">
      {[['usps', 'Four core USPs'], ['features', 'All features'], ['walkthrough', 'Try the workflow'], ['architecture', 'Architecture'], ['routes', 'Routes & API'], ['evidence', 'Evidence'], ['scope', 'Implementation scope']].map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
    </nav>
    <section id="usps" className="stack"><h2>Four implemented USPs</h2>{overview.usps.map(usp => <section key={usp.id} id={usp.id} className="card"><h3>{usp.title}</h3><p>{usp.description}</p><Sources paths={usp.sources}/><Link href={usp.route}>Explore this capability →</Link></section>)}</section>
    <section id="features" className="stack"><h2>Complete feature inventory</h2>{overview.features.map(feature => <section key={feature.title} className="card"><h3>{feature.title}</h3><p>{feature.description}</p><Sources paths={feature.sources}/></section>)}</section>
    <section id="walkthrough" className="card"><h2>From creator portfolio to accepted delivery</h2><ol className="space-y-4 pl-6">{overview.journey.map(step => <li key={step}>{step}</li>)}</ol><p>Public creator browsing is available without signing in. Use separate creator and brand accounts for the complete workflow; each role has its own permanent workspace. Private evidence and deliveries require the appropriate owner or participant session.</p><Link href="/sign-in?mode=signup">Create your account →</Link></section>
    <section id="architecture" className="stack"><h2>Architecture and data flow</h2><p>Browser → Next.js pages and forms → validated server routes and domain functions → authenticated PostgreSQL RPC transactions and row-level security. Media follows a separate private reserve → upload → Edge finalization path before publication or delivery.</p>{overview.architecture.map(layer => <section className="card" key={layer.layer}><h3>{layer.layer}</h3><p><strong>{layer.technology}</strong></p><p>{layer.responsibility}</p><a href={`${overview.repository}/tree/main/${layer.source}`}>Inspect {layer.source} →</a></section>)}<section className="card"><h3>Data model</h3><p>{overview.dataModel}</p></section></section>
    <section id="routes" className="card"><h2>Routes, access and API contracts</h2><table><caption className="mb-4 text-left">Implemented application entry points</caption><thead><tr><th scope="col">Route</th><th scope="col">Access</th><th scope="col">Purpose</th></tr></thead><tbody>{overview.routes.map(route => <tr key={route.path}><th scope="row">{route.path}</th><td>{route.access}</td><td>{route.purpose}</td></tr>)}</tbody></table><h3 className="mt-8">HTTP API groups</h3><ul className="space-y-3">{overview.apiGroups.map(group => <li key={group}>{group}</li>)}</ul><p>Route handlers are in src/app/api/v1. Zod contracts are in src/domain/contracts; database RPCs and guards are in supabase/migrations.</p></section>
    <section id="evidence" className="card"><h2>Evidence and verification scope</h2><ul className="space-y-4">{overview.verification.map(item => <li key={item}>{item}</li>)}</ul><div className="actions"><a href={`${overview.repository}/blob/main/docs/evaluation-release.md`}>Current release checks</a><a href={`${overview.repository}/tree/main/tests`}>Inspect tests</a><a href={`${overview.repository}/tree/main/docs/evidence`}>Inspect recorded evidence</a></div></section>
    <section id="scope" className="card"><h2>Implementation boundaries</h2><ul className="space-y-4">{overview.limitations.map(item => <li key={item}>{item}</li>)}</ul></section>
  </article>;
}
