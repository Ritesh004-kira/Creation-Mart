import { z } from 'zod';
import { portfolioSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
const schema=z.strictObject({input:z.strictObject(portfolioSchema.shape).partial(),expectedVersion:z.number().int().positive()});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
  sameOrigin(request);const {db}=await apiUser('creator'),{id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'That work is unavailable.');
  const parsed=schema.safeParse(await readJsonBody(request));if(!parsed.success)throw new HttpError('VALIDATION_FAILED',400,'Check the work fields.',parsed.error.flatten());
  const {data,error}=await db.rpc('save_portfolio_item',{p_id:id,p_input:parsed.data.input,p_expected_version:parsed.data.expectedVersion});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
