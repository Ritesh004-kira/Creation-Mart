'use client';
import { useId,useRef,useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
export type UploadedAsset={id:string;state:string;kind:string;format:string;actual_bytes:number;sha256:string;checked_at:string;width_px:number|null;height_px:number|null;checks:Record<string,unknown>};
export function AssetUploader({parentId,purpose,kind,onReady}:{parentId:string;purpose:'portfolio_preview'|'portfolio_source'|'evidence'|'submission'|'brief_reference';kind:string;onReady:(asset:UploadedAsset)=>void}){
 const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');const input=useRef<HTMLInputElement>(null),action=useRef<{file:File;key:string;uploaded?:boolean}|null>(null);
 const inputId=useId(); const db=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 async function upload(){
  const file=input.current?.files?.[0];if(!file){setError('Choose a file first.');return;}setBusy(true);setError('');
  const ext=file.name.split('.').pop()?.toLowerCase(),format=ext==='jpg'?'jpeg':ext;
  if(!action.current||action.current.file!==file)action.current={file,key:crypto.randomUUID()};
  const actualKind=purpose==='evidence'?(format==='json'||format==='txt'?'text':'image'):kind==='three_d'?'image':kind;
  try{
    setStatus('Reserving upload space…');const response=await fetch('/api/v1/assets/reserve',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':action.current.key},body:JSON.stringify({purpose,kind:actualKind,format,parentId,declaredBytes:file.size})});
    const body=await response.json();if(!response.ok)throw new Error(body.error?.message??'The upload could not be reserved.');
    const {asset,upload:authorization}=body.data;
    if(asset.state==='ready'){onReady(asset);setStatus('File ready.');return;}
    setStatus('Uploading file…');const {error:uploadError}=await db.storage.from(asset.bucket).uploadToSignedUrl(asset.path,authorization.token,file,{contentType:file.type||'application/octet-stream',upsert:false});if(uploadError&&!/already exists|duplicate/i.test(uploadError.message))throw new Error('The upload could not finish. Retry the same file.');action.current.uploaded=true;
    setStatus('Checking actual file bytes…');const {data:checked,error:checkError}=await db.functions.invoke('finalize-asset',{body:{assetId:asset.id}});
    if(checkError){if(checkError.context instanceof Response){const problem=await checkError.context.json();throw new Error(problem.error?.message??'The file check failed.');}throw new Error('The file check is unavailable. Try again.');}
    onReady(checked.data);setStatus('File checked and ready.');action.current=null;
  }catch(e){setError(e instanceof Error?e.message:'Upload failed. Try again.');setStatus('');}finally{setBusy(false);}
 }
 return <div className="stack"><div><label htmlFor={inputId}>Choose {purpose==='portfolio_preview'?'a public preview':purpose==='evidence'?'private evidence':'a file'}</label><input id={inputId} ref={input} type="file" disabled={busy} accept={purpose==='evidence'?'.png,.jpg,.jpeg,.webp,.json,.txt':kind==='image'||kind==='three_d'?'.png,.jpg,.jpeg,.webp':kind==='video'?'.mp4':kind==='audio'?'.wav,.mp3':'.txt'}/><small>{purpose==='portfolio_preview'?'Preview limit: 2 MB. ':purpose==='evidence'?'Private evidence limit: 2 MB. ':''}Supported files are checked after upload; raw inputs stay private.</small></div>
 <Button type="button" disabled={busy} onClick={upload}>{busy?'Working…':'Upload and check file'}</Button><p role="status">{status}</p>{error&&<div className="error" role="alert">{error}</div>}</div>;
}


