import { createSupabaseContext } from 'npm:@supabase/server@1.9.2';
import { inspectMedia } from './media-checks.ts';
const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'};
function result(body:unknown,status=200){return Response.json(body,{status,headers});}
export default {fetch:async(req:Request)=>{
  const requestId=crypto.randomUUID();
  if(req.method==='OPTIONS')return new Response(null,{headers});
  if(req.method!=='POST')return result({error:{code:'VALIDATION_FAILED',message:'Use POST.',requestId}},405);
  const context=await createSupabaseContext(req,{auth:['user','publishable']});
  if(context.error)return result({error:{code:'NOT_AUTHENTICATED',message:'Sign in to continue.',requestId}},401);
  const ctx=context.data;
  let input:{assetId:string;operation?:string};
  try{const text=await req.text();if(new TextEncoder().encode(text).length>2048)throw new Error();input=JSON.parse(text);
    if(!input||typeof input.assetId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.assetId)||Object.keys(input).some(k=>!['assetId','operation'].includes(k)))throw new Error();
  }catch{return result({error:{code:'VALIDATION_FAILED',message:'Send an asset ID.',requestId}},400);}
  const {data:asset,error:lookupError}=await ctx.supabase.from('assets').select('*').eq('id',input.assetId).maybeSingle();
  if(lookupError)return result({error:{code:'DEPENDENCY_UNAVAILABLE',message:'The file record could not be loaded.',requestId}},503);
  if(!asset)return result({error:{code:'NOT_FOUND',message:'That file is unavailable.',requestId}},404);
  if(input.operation==='read'){
    if(asset.state!=='ready'||asset.object_deleted_at)return result({error:{code:'NOT_FOUND',message:'That file is not ready.',requestId}},404);
    const ttl=asset.purpose==='portfolio_preview'?120:60;
    const {data,error}=await ctx.supabaseAdmin.storage.from(asset.bucket).createSignedUrl(asset.path,ttl);
    if(error)return result({error:{code:'DEPENDENCY_UNAVAILABLE',message:'The file link could not be created.',requestId}},503);
    return result({data:{url:data.signedUrl,expiresIn:ttl},requestId});
  }
  if(ctx.authMode!=='user'||ctx.userClaims?.id!==asset.owner_id)return result({error:{code:'NOT_FOUND',message:'That file is unavailable.',requestId}},404);
  if(input.operation&&input.operation!=='finalize'&&input.operation!=='cleanup')return result({error:{code:'VALIDATION_FAILED',message:'Unsupported file operation.',requestId}},400);
  if(asset.state==='ready'&&!input.operation?.includes('cleanup'))return result({data:asset,requestId});
  if(asset.state!=='pending'&&!(input.operation==='cleanup'&&asset.state==='rejected'))return result({error:{code:'INVALID_TRANSITION',message:'The file has already been processed.',requestId}},409);
  const reject=async(reason:string)=>{
    const {error:deleteError}=await ctx.supabaseAdmin.storage.from(asset.bucket).remove([asset.path]);
    const {data,error}=await ctx.supabaseAdmin.rpc('reject_asset_after_delete',{p_id:asset.id,p_deleted:!deleteError,p_reason:reason});
    return {data,error};
  };
  if(input.operation==='cleanup'){const done=await reject('Owner removed the rejected upload.');if(done.error)return result({error:{code:'DEPENDENCY_UNAVAILABLE',message:'The upload could not be removed.',requestId}},503);return result({data:done.data,requestId});}
  const {data:blob,error:downloadError}=await ctx.supabaseAdmin.storage.from(asset.bucket).download(asset.path);
  if(downloadError)return result({error:{code:'DEPENDENCY_UNAVAILABLE',message:'Upload the file before checking it. Try again after upload completes.',requestId}},503);
  if(blob.size<1||blob.size>asset.max_bytes){await reject('Actual file size exceeds the reserved limit.');return result({error:{code:'UPLOAD_TOO_LARGE',message:'The uploaded file exceeds its size limit.',requestId}},413);}
  try{
    const bytes=new Uint8Array(await blob.arrayBuffer()),facts=inspectMedia(bytes,asset.format);
    const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
    const {data,error}=await ctx.supabaseAdmin.rpc('record_asset_check',{p_id:asset.id,p_result:{actualBytes:bytes.length,mime:facts.mime,sha256,widthPx:facts.widthPx,heightPx:facts.heightPx,checkedDurationSec:facts.checkedDurationSec,
      checks:{method:'sha256_header_dimensions',scope:'Actual bytes, format header, supported image dimensions and PCM duration when parsed.',limitations:'These checks do not establish authorship, identity, licensing or malware safety.'}}});
    if(error)return result({error:{code:'DEPENDENCY_UNAVAILABLE',message:'The file check could not be saved.',requestId}},503);
    return result({data,requestId});
  }catch(e){await reject('File format or structure rejected.');return result({error:{code:'UNSUPPORTED_MEDIA',message:e instanceof Error?e.message:'This file could not be checked.',requestId}},415);}
}};
