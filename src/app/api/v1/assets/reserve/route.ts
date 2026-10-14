import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
const schema=z.strictObject({purpose:z.enum(['portfolio_preview','portfolio_source','evidence','brief_reference','submission']),kind:z.enum(['image','video','audio','text']),format:z.enum(['png','jpeg','webp','mp4','wav','mp3','txt','json']),parentId:z.uuid(),declaredBytes:z.number().int().positive(),durationSec:z.number().positive().nullable().default(null)});
export async function POST(request:Request){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser();const body=schema.safeParse(await readJsonBody(request)),key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));if(!body.success||!key.success)throw new HttpError('VALIDATION_FAILED',400,'Check the upload details.');
 const b=body.data,{data:reserved,error}=await db.rpc('reserve_asset',{p_purpose:b.purpose,p_kind:b.kind,p_format:b.format,p_parent:b.parentId,p_declared_bytes:b.declaredBytes,p_duration:b.durationSec,p_key:key.data});if(error)rpcError(error);
 const {data:asset,error:assetError}=await db.from('assets').select('*').eq('id',reserved.id).single();if(assetError)rpcError(assetError);
 if(asset.state==='ready')return Response.json({data:{asset,upload:null},requestId});
 if(asset.state!=='pending')throw new HttpError('INVALID_TRANSITION',409,'Create a new upload after removing the rejected one.');
 const {data:upload,error:uploadError}=await db.storage.from(asset.bucket).createSignedUploadUrl(asset.path,{upsert:false});if(uploadError)throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'Upload authorization could not be created. Retry the same action.');
 return Response.json({data:{asset,upload},requestId},{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e,requestId);}}
