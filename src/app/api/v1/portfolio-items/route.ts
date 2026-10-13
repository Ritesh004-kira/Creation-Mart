import { z } from 'zod';
import { portfolioSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
const draft=z.strictObject(portfolioSchema.shape).partial();
export async function POST(request:Request){const requestId=crypto.randomUUID();try{
  sameOrigin(request);const {db}=await apiUser('creator');const input=draft.safeParse(await readJsonBody(request));if(!input.success)throw new HttpError('VALIDATION_FAILED',400,'Check the work fields.',input.error.flatten());
  const key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));if(!key.success)throw new HttpError('VALIDATION_FAILED',400,'An action key is required.');
  const {data,error}=await db.rpc('create_portfolio_item',{p_input:input.data,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
