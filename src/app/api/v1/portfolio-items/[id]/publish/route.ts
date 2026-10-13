import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
const schema=z.strictObject({expectedVersion:z.number().int().positive(),published:z.boolean().default(true)});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('creator'),{id}=await params,key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));if(!key.success||!z.uuid().safeParse(id).success)throw new HttpError('VALIDATION_FAILED',400,'Send a valid action key and work ID.');
 const body=schema.safeParse(await readJsonBody(request));if(!body.success)throw new HttpError('VALIDATION_FAILED',400,'Send the saved work version.');
 const {data,error}=await db.rpc('publish_portfolio_item',{p_id:id,p_expected_version:body.data.expectedVersion,p_key:key.data,p_published:body.data.published});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
