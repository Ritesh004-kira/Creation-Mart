'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function NewWork(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function create(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const values=new FormData(e.currentTarget);try{const r=await fetch('/api/v1/portfolio-items',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({title:values.get('title'),kind:values.get('kind')})});const body=await r.json();if(!r.ok)throw new Error(body.error?.message??'The draft could not be created.');window.location.assign('/portfolio/'+body.data.id+'/edit');}catch(e){setError(e instanceof Error?e.message:'Try again.');setBusy(false);}}
 return <form onSubmit={create}>{error&&<div className="error" role="alert">{error}</div>}<div className="field"><label htmlFor="title">Work title *</label><input id="title" name="title" required minLength={2} maxLength={80}/></div><div className="field"><label htmlFor="kind">Work type *</label><select id="kind" name="kind"><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="text">Text</option><option value="three_d">3D poster — metadata only</option></select></div><Button disabled={busy}>{busy?'Creating draft…':'Create private draft'}</Button></form>;
}
