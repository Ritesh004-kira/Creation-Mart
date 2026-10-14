import type { Metadata } from 'next';
import { serverSupabase } from '@/server/supabase';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import './globals.css';
import './design.css';
export const metadata:Metadata={title:{default:'Creation Mart — Creative work, with the process behind it',template:'%s | Creation Mart'},description:'Find creators by production capabilities, inspect their process, and turn a precise brief into a reviewed delivery.'};
export const dynamic='force-dynamic';
export default async function RootLayout({children}:{children:React.ReactNode}) {
  const db=await serverSupabase(),{data}=await db.auth.getUser();
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>
    <Navbar signedIn={Boolean(data.user)}/><main id="main" tabIndex={-1} className="app-main">{children}</main><Footer/>
  </body></html>;
}
