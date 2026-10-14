'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function NewBrief(){const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);try{const response=await fetch('/api/v1/briefs',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({schemaVersion:1,title:form.get('title')})});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'The draft could not be created.');window.location.assign('/briefs/'+body.data.id+'/edit');}catch(e){setError(e instanceof Error?e.message:'Try again.');setBusy(false);}}
 return <form onSubmit={submit}>{error&&<div className="error" role="alert">{error}</div>}<div className="field"><label htmlFor="title">Brief title *</label><input id="title" name="title" required minLength={2} maxLength={80} placeholder="LumaLeaf launch film"/></div><Button disabled={busy}>{busy?'Creating draft…':'Create brief draft'}</Button></form>;
}
