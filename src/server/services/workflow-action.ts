import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function workflowAction(request:Request,id:string,role:'creator'|'brand',schema:z.ZodType,rpc:string){
 const requestId=crypto.randomUUID();try{sameOrigin(request);const {db}=await apiUser(role),key=z.uuid().safeParse(request.headers.get('Idempotency-Key')),body=schema.safeParse(await readJsonBody(request));if(!key.success||!body.success||!z.uuid().safeParse(id).success)throw new HttpError('VALIDATION_FAILED',400,'Check the workflow fields.',body.success?undefined:body.error.flatten());const {data,error}=await db.rpc(rpc,{p_id:id,p_input:body.data,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});}catch(e){return errorResponse(e,requestId);}
}
