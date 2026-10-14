'use client';
import Link from 'next/link';
export default function ErrorBoundary({reset}:{reset:()=>void}){return <section className="narrow card"><h1>This page could not be loaded</h1><p>Your saved work is still there. Try again, or return to your dashboard.</p><div className="actions"><button className="button button-primary" onClick={reset}>Try again</button><Link href="/dashboard">Back to dashboard</Link></div></section>;}
