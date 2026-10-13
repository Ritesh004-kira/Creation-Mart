import { z } from 'zod';
import { serverSupabase } from '@/server/supabase';
import { errorResponse,HttpError } from '@/server/http/errors';
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){const requestId=crypto.randomUUID();try{
 const {id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'That file is unavailable.');
 const db=await serverSupabase(),{data,error}=await db.functions.invoke('finalize-asset',{body:{assetId:id,operation:'read'}});
 if(error){const response=error.context instanceof Response?error.context:null;if(response){const body=await response.json();throw new HttpError(body.error?.code??'NOT_FOUND',response.status,body.error?.message??'That file is unavailable.');}throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'The file link could not be created.');}
 return Response.json(data,{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e,requestId);}}
