'use client';
import { trackedFetch } from '@/lib/tracked-fetch';
import { useState } from 'react';
export function DownloadFile({id}:{id:string}){const [error,setError]=useState('');return <div><button className="button button-secondary" onClick={async()=>{try{const response=await trackedFetch('/api/v1/assets/'+id+'/read-url?download=true',{method:'POST'});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'Download link unavailable.');const link=document.createElement('a');link.href=body.data.url;link.download=id;link.rel='noopener';link.click();}catch(e){setError(e instanceof Error?e.message:'Try again.');}}}>Download accepted file</button>{error&&<p className="error" role="alert">{error}</p>}</div>;}
