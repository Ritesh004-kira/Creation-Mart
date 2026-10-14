import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function POST(request:Request){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('creator'),key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));
 const body=z.strictObject({expectedVersion:z.number().int().positive(),published:z.boolean().default(true)}).safeParse(await readJsonBody(request));
 if(!key.success||!body.success)throw new HttpError('VALIDATION_FAILED',400,'Send the saved profile version and action key.');
 const {data,error}=await db.rpc('publish_creator',{p_expected_version:body.data.expectedVersion,p_key:key.data,p_published:body.data.published});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
