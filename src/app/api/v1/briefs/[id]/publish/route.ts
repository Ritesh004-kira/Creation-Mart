import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),{id}=await params,key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));
 const body=z.strictObject({expectedVersion:z.number().int().positive()}).safeParse(await readJsonBody(request));if(!key.success||!body.success||!z.uuid().safeParse(id).success)throw new HttpError('VALIDATION_FAILED',400,'Send the saved brief version and action key.');
 const {data,error}=await db.rpc('publish_brief',{p_id:id,p_expected_version:body.data.expectedVersion,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
