'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
export function SignInForm({returnTo}:{returnTo:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const db=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  async function password(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('');
    const values=new FormData(event.currentTarget);
    try{
      const {error}=await db.auth.signInWithPassword({email:String(values.get('email')),password:String(values.get('password'))});
      if(error){setError('The email or password was not accepted. Check your details and try again.');setBusy(false);}else window.location.assign(returnTo);
    }catch{setError('Sign-in could not reach the authentication service. Please try again.');setBusy(false);}
  }
  async function github() {
    setBusy(true);setError('');
    try{
      const {error}=await db.auth.signInWithOAuth({provider:'github',options:{redirectTo:window.location.origin+'/auth/callback?returnTo='+encodeURIComponent(returnTo)}});
      if(error){setError('GitHub sign-in is unavailable. Try your provisioned demo account.');setBusy(false);}
    }catch{setError('GitHub sign-in could not start. Please try again.');setBusy(false);}
  }
  return <div className="stack"><Button type="button" onClick={github} disabled={busy}>Continue with GitHub</Button>
    <form onSubmit={password}><h2>Have a demo account?</h2><p className="muted">Use your provisioned account credentials. Demo mode uses real authentication.</p>
      {error&&<div className="error" role="alert">{error}</div>}
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username"/></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password"/></div>
      <Button type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</Button>
    </form></div>;
}
