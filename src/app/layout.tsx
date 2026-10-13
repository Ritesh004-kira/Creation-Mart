import type { Metadata } from 'next';
import Link from 'next/link';
import { serverSupabase } from '@/server/supabase';
import './globals.css';
export const metadata:Metadata={title:{default:'Creation Mart — Creative work, with the process behind it',template:'%s | Creation Mart'},description:'Find creators by production capabilities, inspect their process, and turn a precise brief into a reviewed delivery.'};
export const dynamic='force-dynamic';
export default async function RootLayout({children}:{children:React.ReactNode}) {
  const db=await serverSupabase(),{data}=await db.auth.getUser();
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>
    <div className="demo-banner">Hackathon demo · Fictional demo profiles are labeled · No payments or social integrations</div>
    <nav className="nav" aria-label="Main navigation"><Link className="logo" href="/">Creation Mart<span style={{color:'#6d28d9'}}> ●</span></Link>
      <Link href="/creators">Browse creators</Link><Link href="/#how-it-works">How it works</Link>
      {data.user?<><Link href="/dashboard">Dashboard</Link><form action="/api/v1/sign-out" method="post"><button className="button button-secondary" type="submit">Sign out</button></form></>:<Link className="button button-primary" href="/sign-in">Sign in</Link>}
    </nav><main id="main" className="container">{children}</main>
    <footer className="footer"><div className="container">Creation Mart · Process is declared. File checks describe the bytes. Rights receipts compare declarations and references.</div></footer>
  </body></html>;
}
