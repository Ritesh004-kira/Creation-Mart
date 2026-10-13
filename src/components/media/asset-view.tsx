'use client';
import { useEffect,useState } from 'react';
export function AssetView({assetId,kind,title}:{assetId:string;kind:string;title:string}){
 const [url,setUrl]=useState(''),[text,setText]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();setUrl('');setError('');setText('');
   async function load(){try{const response=await fetch('/api/v1/assets/'+assetId+'/read-url',{method:'POST',signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'The preview could not be loaded.');setUrl(body.data.url);
     if(kind==='text'){const content=await fetch(body.data.url,{signal:controller.signal});if(!content.ok)throw new Error('The text preview could not be loaded.');setText(await content.text());}
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'The preview could not be loaded.');}}
   load();return()=>controller.abort();
 },[assetId,kind]);
 if(error)return <div className="error" role="alert">{error}<button type="button" className="button button-secondary" onClick={()=>window.location.reload()}>Reload preview</button></div>;
 if(!url)return <div role="status" className="card">Loading preview…</div>;
 if(kind==='video')return <video controls preload="metadata" src={url} aria-label={title} onError={()=>setError('The preview expired or could not play. Reload to create a fresh link.')} style={{width:'100%',maxHeight:480,borderRadius:8}}/>;
 if(kind==='audio')return <audio controls preload="metadata" src={url} aria-label={title} onError={()=>setError('The audio preview expired or could not play. Reload to create a fresh link.')} style={{width:'100%'}}/>;
 if(kind==='text')return <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{text||'Loading text…'}</pre>;
 // Signed media is served directly; it never passes through an image optimizer.
 return <img src={url} alt={title} onError={()=>setError('The image preview expired or could not load. Reload to create a fresh link.')} style={{width:'100%',maxHeight:480,objectFit:'contain',borderRadius:8}}/>;
}
