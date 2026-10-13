import { z } from 'zod';
import { applicationSchema } from '@/domain/contracts/engagement';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{sameOrigin(request);const {db}=await apiUser('creator'),{id}=await params,key=z.uuid().safeParse(request.headers.get('Idempotency-Key')),body=applicationSchema.safeParse(await readJsonBody(request));if(!key.success||!body.success||!z.uuid().safeParse(id).success)throw new HttpError('VALIDATION_FAILED',400,'Check your application.');const {data,error}=await db.rpc('create_application',{p_brief:id,p_input:body.data,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});}catch(e){return errorResponse(e,requestId);}}
