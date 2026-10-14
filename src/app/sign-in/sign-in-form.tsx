'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { boundedFetch } from '@/lib/bounded-fetch';
type Mode = 'signin' | 'signup' | 'recovery';
export function SignInForm({returnTo,initialMode='signin'}:{returnTo:string;initialMode?:Mode}) {
  const [mode,setMode]=useState<Mode>(initialMode);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[showPassword,setShowPassword]=useState(false);
  const [db]=useState(()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{global:{fetch:boundedFetch}}));
  function changeMode(next:Mode){setMode(next);setError('');setNotice('');setShowPassword(false);}
  async function github(){
    setBusy(true);setError('');setNotice('');
    try{const {error}=await db.auth.signInWithOAuth({provider:'github',options:{redirectTo:window.location.origin+'/auth/callback?returnTo='+encodeURIComponent(returnTo)}});if(error)throw error;}
    catch{setError('GitHub sign-in could not start. Continue with email or try again later.');setBusy(false);}
  }
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('');setNotice('');
    const values=new FormData(event.currentTarget),email=String(values.get('email')).trim(),password=String(values.get('password')??'');
    const callback=window.location.origin+'/auth/callback?returnTo='+encodeURIComponent(returnTo);
    try{
      if(mode==='recovery'){
        const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/auth/callback?returnTo=%2Faccount%2Fpassword'});
        if(error)throw error;
        setNotice('If an account exists for this email, a password reset link will arrive shortly. Open it in this browser.');
      }else if(mode==='signup'){
        if(password!==values.get('confirmPassword')){setError('Your passwords do not match.');return;}
        const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:callback}});
        if(error)throw error;
        if(data.session)window.location.assign(returnTo);
        else setNotice('Check your email to confirm your account, then sign in. Open the confirmation link in this browser.');
      }else{
        const {error}=await db.auth.signInWithPassword({email,password});
        if(error)throw error;
        window.location.assign(returnTo);
      }
    }catch(cause){
      const code=(cause as {code?:string})?.code;
      setError(code==='invalid_credentials'?'The email or password was not accepted. Check your details and try again.':code==='email_not_confirmed'?'Confirm your email before signing in. Check your inbox for the confirmation link.':code==='over_email_send_rate_limit'||code==='over_request_rate_limit'?'Too many attempts. Please wait a few minutes before trying again.':code==='email_address_not_authorized'?'Email delivery is not configured for this address. Contact the workspace owner to enable email delivery.':mode==='signup'?'Your account could not be created. Check your email and use a stronger password, then try again.':mode==='recovery'?'The reset email could not be sent. Please try again later.':'Sign-in could not reach the authentication service. Please try again.');
    }finally{setBusy(false);}
  }
  return <div className="stack auth-form">
    <div className="auth-tabs" aria-label="Account access">
      <button type="button" aria-label="Use email sign-in" aria-pressed={mode==='signin'} onClick={()=>changeMode('signin')} disabled={busy}>Sign in</button>
      <button type="button" aria-label="Register with email" aria-pressed={mode==='signup'} onClick={()=>changeMode('signup')} disabled={busy}>Create account</button>
    </div>
    <form onSubmit={submit} aria-busy={busy}>
      <h2>{mode==='signup'?'Create your account':mode==='recovery'?'Reset your password':'Welcome back'}</h2>
      <p className="muted">{mode==='signup'?'Join as a creator or brand after confirming your email.':mode==='recovery'?'We’ll send a secure link to your account email.':'Continue to your creative workspace.'}</p>
      {error&&<div className="error" role="alert">{error}</div>}
      {notice&&<div className="success notice" role="status">{notice}</div>}
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false}/></div>
      {mode!=='recovery'&&<><div className="field"><div className="password-label"><label htmlFor="password">Password</label><button type="button" className="text-action" aria-pressed={showPassword} onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide password':'Show password'}</button></div><input id="password" name="password" type={showPassword?'text':'password'} required minLength={mode==='signup'?8:undefined} maxLength={128} autoComplete={mode==='signup'?'new-password':'current-password'}/>{mode==='signup'&&<small>Use at least 8 characters. A longer, unique password is best.</small>}</div>
      {mode==='signup'&&<div className="field"><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type={showPassword?'text':'password'} required minLength={8} maxLength={128} autoComplete="new-password"/></div>}</>}
      <Button type="submit" loading={busy} disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':mode==='recovery'?'Send reset link':'Sign in'}</Button>
      <div className="auth-help"><button type="button" className="text-action" aria-busy={busy} disabled={busy} onClick={()=>changeMode(mode==='recovery'?'signin':'recovery')}>{mode==='recovery'?'Back to sign in':'Forgot your password?'}</button></div>
    </form>
    {mode!=='recovery'&&<div className="auth-alternative"><p className="muted">Or use your GitHub account</p><Button type="button" variant="secondary" loading={busy} disabled={busy} onClick={github}>Continue with GitHub</Button></div>}
  </div>;
}
