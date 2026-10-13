import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),{id}=await params,key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));
 const body=z.strictObject({creatorId:z.uuid(),remove:z.boolean().default(false)}).safeParse(await readJsonBody(request));if(!key.success||!body.success||!z.uuid().safeParse(id).success)throw new HttpError('VALIDATION_FAILED',400,'Send a creator and brief action key.');
 const {data,error}=await db.rpc('shortlist_mutation',{p_brief:id,p_creator:body.data.creatorId,p_remove:body.data.remove,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
