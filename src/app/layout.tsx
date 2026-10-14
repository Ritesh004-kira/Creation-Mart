import type { Metadata } from 'next';
import { serverSupabase } from '@/server/supabase';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { NavigationProgress } from '@/components/ui/navigation-progress';
import './globals.css';
import './design.css';
import './workspace.css';
export const metadata:Metadata={title:{default:'Creation Mart — Creative work, with the process behind it',template:'%s | Creation Mart'},description:'Find creators by production capabilities, inspect their process, and turn a precise brief into a reviewed delivery.'};
export const dynamic='force-dynamic';
export default async function RootLayout({children}:{children:React.ReactNode}) {
  const db=await serverSupabase(),{data}=await db.auth.getUser();
  const {data:account}=data.user?await db.from('accounts').select('role').eq('id',data.user.id).maybeSingle():{data:null};
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>
    <NavigationProgress/><Navbar signedIn={Boolean(data.user)} role={account?.role}/><main id="main" tabIndex={-1} className="app-main">{children}</main><Footer/>
  </body></html>;
}
