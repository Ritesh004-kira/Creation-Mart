'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { boundedFetch } from '@/lib/bounded-fetch';
export function PasswordForm(){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
  async function save(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');const f=new FormData(event.currentTarget),password=String(f.get('password'));
    if(password!==f.get('confirmPassword')){setError('Your passwords do not match.');return;}
    setBusy(true);
    try{const db=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{global:{fetch:boundedFetch}});const {error}=await db.auth.updateUser({password});if(error)throw error;setDone(true);}
    catch{setError('The password could not be updated. Your link may have expired; request a fresh reset link and try again.');}
    finally{setBusy(false);}
  }
  if(done)return <p role="status" className="success notice">Your password has been updated. You can now use it to sign in.</p>;
  return <form onSubmit={save} aria-busy={busy}>{error&&<p className="error" role="alert">{error}</p>}<div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required/></div><div className="field"><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required/></div><Button loading={busy} disabled={busy}>{busy?'Updating…':'Update password'}</Button></form>;
}
