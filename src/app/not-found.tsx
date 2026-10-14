import Link from 'next/link';
export default function NotFound(){return <section className="narrow card"><h1>That page is unavailable</h1><p>It may be private, moved, or no longer published.</p><Link href="/creators" className="button button-primary">Browse creators</Link></section>;}
