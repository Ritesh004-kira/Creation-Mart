'use client';
import { useState } from 'react';
export function CopyBriefLink({id}:{id:string}){const [status,setStatus]=useState('');return <div><button className="button button-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.origin+'/briefs/'+id);setStatus('Brief link copied.');}catch{setStatus('Copy this page URL from your address bar.');}}}>Copy brief link</button><span role="status">{status}</span></div>;}
