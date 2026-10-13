import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 const {db}=await apiUser('brand'),{id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'That brief is unavailable.');
 const {data:brief,error:briefError}=await db.rpc('owned_briefs',{p_id:id});if(briefError)rpcError(briefError);if(!brief?.length)throw new HttpError('NOT_FOUND',404,'That shortlist is unavailable.');
 const {data,error}=await db.from('shortlists').select('id,brief_id,creator_id,created_at').eq('brief_id',id).order('created_at');if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),{id}=await params,key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));
 const body=z.strictObject({creatorId:z.uuid(),remove:z.boolean().default(false)}).safeParse(await readJsonBody(request));if(!key.success||!body.success||!z.uuid().safeParse(id).success)throw new HttpError('VALIDATION_FAILED',400,'Send a creator and brief action key.');
 const {data,error}=await db.rpc('shortlist_mutation',{p_brief:id,p_creator:body.data.creatorId,p_remove:body.data.remove,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
