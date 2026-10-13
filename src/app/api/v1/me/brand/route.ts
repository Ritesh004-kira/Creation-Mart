import { z } from 'zod';
import { brandSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function PATCH(request:Request){const requestId=crypto.randomUUID();try{sameOrigin(request);const {db}=await apiUser('brand');const body=z.strictObject({input:brandSchema,expectedVersion:z.number().int().positive()}).safeParse(await readJsonBody(request));if(!body.success)throw new HttpError('VALIDATION_FAILED',400,'Check your company context.');const {data,error}=await db.rpc('save_brand',{p_input:body.data.input,p_expected_version:body.data.expectedVersion});if(error)rpcError(error);return Response.json({data,requestId});}catch(e){return errorResponse(e,requestId);}}
