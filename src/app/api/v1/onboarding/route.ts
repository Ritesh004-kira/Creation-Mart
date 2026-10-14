import { z } from 'zod';
import { serverSupabase } from '@/server/supabase';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { readJsonBody } from '@/server/http/body';
const input=z.strictObject({role:z.enum(['creator','brand']),displayName:z.string().trim().min(2).max(80)});
export async function POST(request:Request) {
  const requestId=crypto.randomUUID();
  try{
    sameOrigin(request);
    const parsed=input.safeParse(await readJsonBody(request));if(!parsed.success)throw new HttpError('VALIDATION_FAILED',400,'Check the account fields.',parsed.error.flatten());
    const key=z.uuid().safeParse(request.headers.get('Idempotency-Key'));if(!key.success)throw new HttpError('VALIDATION_FAILED',400,'An action key is required.');
    const db=await serverSupabase(),{data:user,error:authError}=await db.auth.getUser();if(authError||!user.user)throw new HttpError('NOT_AUTHENTICATED',401,'Sign in to continue.');
    const {data,error}=await db.rpc('onboard_account',{p_role:parsed.data.role,p_display_name:parsed.data.displayName,p_key:key.data});
    if(error)throw new HttpError('INVALID_TRANSITION',409,'Your role is already assigned or this request conflicts with an earlier action.');
    return Response.json({data,requestId});
  }catch(e){return errorResponse(e,requestId);}
}
