import { z } from 'zod';
import { briefDraftSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),{id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'That brief is unavailable.');
 const body=z.strictObject({input:briefDraftSchema,expectedVersion:z.number().int().positive(),startRevision:z.boolean().default(false)}).safeParse(await readJsonBody(request));if(!body.success)throw new HttpError('VALIDATION_FAILED',400,'Check the draft fields.',body.error.flatten());
 const {data,error}=await db.rpc('save_brief',{p_id:id,p_input:body.data.input,p_expected_version:body.data.expectedVersion,p_start_revision:body.data.startRevision});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
