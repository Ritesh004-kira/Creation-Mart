import { z } from 'zod';
import { briefDraftSchema } from '@/domain/contracts';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function GET(request:Request){const requestId=crypto.randomUUID();try{
 const {db,account}=await apiUser(),page=z.coerce.number().int().min(1).max(1000).safeParse(new URL(request.url).searchParams.get('page')??1);if(!page.success)throw new HttpError('VALIDATION_FAILED',400,'Choose a valid page.');
 if(account.role==='brand'){const {data,error}=await db.rpc('owned_briefs',{p_id:null});if(error)rpcError(error);return Response.json({data:(data??[]).slice((page.data-1)*20,page.data*20),page:page.data,total:data?.length??0,requestId});}
 const {data,error,count}=await db.from('briefs').select('id,brand_id,state,safe_payload,requirements,revision,published_revision,version,updated_at',{count:'exact'}).eq('state','published').order('updated_at',{ascending:false}).order('id').range((page.data-1)*20,page.data*20-1);if(error)rpcError(error);return Response.json({data,page:page.data,total:count??0,requestId});
}catch(e){return errorResponse(e,requestId);}}
export async function POST(request:Request){const requestId=crypto.randomUUID();try{
 sameOrigin(request);const {db}=await apiUser('brand'),key=z.uuid().safeParse(request.headers.get('Idempotency-Key')),input=briefDraftSchema.safeParse(await readJsonBody(request));
 if(!key.success||!input.success)throw new HttpError('VALIDATION_FAILED',400,'Check the draft fields.');
 const {data,error}=await db.rpc('create_brief',{p_input:input.data,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});
}catch(e){return errorResponse(e,requestId);}}
