'use client';
import { trackedFetch } from '@/lib/tracked-fetch';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function PublishProfile({version,published}:{version:number;published:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function toggle(){setBusy(true);setError('');try{const response=await trackedFetch('/api/v1/me/creator/publish',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({expectedVersion:version,published:!published})});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'Publication failed.');window.location.reload();}catch(e){setError(e instanceof Error?e.message:'Try again.');setBusy(false);}}
 return <div className="stack"><Button type="button" loading={busy} disabled={busy} onClick={toggle}>{busy?'Updating…':published?'Unpublish profile':'Publish profile'}</Button>{error&&<div className="error" role="alert">{error}</div>}</div>;
}
