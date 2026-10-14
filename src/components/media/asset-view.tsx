'use client';
import { useEffect,useState } from 'react';
import { trackedFetch } from '@/lib/tracked-fetch';
import { LoadingState } from '@/components/ui/spinner';
export function AssetView({assetId,kind,title}:{assetId:string;kind:string;title:string}){
 const [url,setUrl]=useState(''),[text,setText]=useState(''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const [ready,setReady]=useState(false);
 useEffect(()=>{const controller=new AbortController();setUrl('');setError('');setText('');setReady(false);
   async function load(){try{const response=await trackedFetch('/api/v1/assets/'+assetId+'/read-url',{method:'POST',signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'The preview could not be loaded.');setUrl(body.data.url);
     if(kind==='text'){const content=await trackedFetch(body.data.url,{signal:controller.signal});if(!content.ok)throw new Error('The text preview could not be loaded.');setText(await content.text());setReady(true);}
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'The preview could not be loaded.');}}
   load();return()=>controller.abort();
 },[assetId,kind,attempt]);
 if(error)return <div className="error" role="alert">{error}<button type="button" className="button button-secondary" onClick={()=>setAttempt(a=>a+1)}>Reload preview</button></div>;
 return <div className="media-preview" aria-busy={!ready}>{!ready&&<LoadingState label="Loading preview…" compact/>}{url&&(kind==='video'?<video controls preload="metadata" src={url} aria-label={title} onLoadedMetadata={()=>setReady(true)} onError={()=>setError('The preview expired or could not play. Reload to create a fresh link.')} style={{width:'100%',maxHeight:480,borderRadius:8}}/>:kind==='audio'?<audio controls preload="metadata" src={url} aria-label={title} onLoadedMetadata={()=>setReady(true)} onError={()=>setError('The audio preview expired or could not play. Reload to create a fresh link.')} style={{width:'100%'}}/>:kind==='text'?<pre>{text}</pre>:<img src={url} alt={title} onLoad={()=>setReady(true)} onError={()=>setError('The image preview expired or could not load. Reload to create a fresh link.')} style={{width:'100%',maxHeight:480,objectFit:'contain',borderRadius:8}}/>)}</div>;
}
