import { z } from 'zod';
import { briefDraftSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function POST(request:Request){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),key=z.uuid().safeParse(request.headers.get('Idempotency-Key')),input=briefDraftSchema.safeParse(await readJsonBody(request));
 if(!key.success||!input.success)throw new HttpError('VALIDATION_FAILED',400,'Check the draft fields.');
 const {data,error}=await db.rpc('create_brief',{p_input:input.data,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
