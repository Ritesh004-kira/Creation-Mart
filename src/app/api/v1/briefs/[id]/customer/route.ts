import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { errorResponse, HttpError } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const requestId=crypto.randomUUID();
  try {const {id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'Brief unavailable.');const {db}=await apiUser();const {data,error}=await db.rpc('brief_customer',{p_brief:id});if(error)rpcError(error);return Response.json({data,requestId},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e,requestId);}
}
