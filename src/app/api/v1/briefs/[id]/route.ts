import { z } from 'zod';
import { briefDraftSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 const {db,account}=await apiUser(),{id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'That brief is unavailable.');let brief;
 if(account.role==='brand'){const {data,error}=await db.rpc('owned_briefs',{p_id:id});if(error)rpcError(error);brief=data?.[0];}
 else{const {data,error}=await db.from('briefs').select('id,brand_id,state,safe_payload,requirements,revision,published_revision,version,created_at,updated_at').eq('id',id).maybeSingle();if(error)rpcError(error);brief=data;}
 if(!brief)throw new HttpError('NOT_FOUND',404,'That brief is unavailable.');return Response.json({data:brief,requestId});
}catch(e){return errorResponse(e,requestId);}}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),{id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'That brief is unavailable.');
 const body=z.strictObject({input:briefDraftSchema,expectedVersion:z.number().int().positive(),startRevision:z.boolean().default(false)}).safeParse(await readJsonBody(request));if(!body.success)throw new HttpError('VALIDATION_FAILED',400,'Check the draft fields.',body.error.flatten());
 const {data,error}=await db.rpc('save_brief',{p_id:id,p_input:body.data.input,p_expected_version:body.data.expectedVersion,p_start_revision:body.data.startRevision});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
