'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function OnboardingForm(){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);try{const r=await fetch('/api/v1/onboarding',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({role:f.get('role'),displayName:f.get('displayName')})});const data=await r.json();if(!r.ok)throw new Error(data.error?.message??'Your account could not be saved.');window.location.assign('/dashboard');}catch(e){setError(e instanceof Error?e.message:'Please try again.');setBusy(false);}}
  return <form onSubmit={submit}>{error&&<div role="alert" className="error">{error}</div>}<div className="field"><label htmlFor="displayName">Your name *</label><input id="displayName" name="displayName" required minLength={2} maxLength={80} autoComplete="name"/></div><div className="field"><label htmlFor="role">Your role *</label><select id="role" name="role"><option value="creator">Creator — publish my work and apply to briefs</option><option value="brand">Brand — brief, find and work with creators</option></select></div><Button disabled={busy}>{busy?'Creating your account…':'Create my account'}</Button></form>;
}
