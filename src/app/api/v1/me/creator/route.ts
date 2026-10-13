import { z } from 'zod';
import { creatorSchema } from '@/domain/contracts';
import { serverSupabase } from '@/server/supabase';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { readJsonBody } from '@/server/http/body';
import { apiUser } from '@/server/auth/api-user';
export async function GET(){const requestId=crypto.randomUUID();try{const {db,user}=await apiUser('creator');const {data,error}=await db.from('creator_profiles').select('*').eq('user_id',user.id).maybeSingle();if(error)throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'Your profile could not be loaded.');if(!data)throw new HttpError('NOT_FOUND',404,'Your profile is unavailable.');return Response.json({data,requestId});}catch(e){return errorResponse(e,requestId);}}
const schema=z.strictObject({input:creatorSchema,expectedVersion:z.number().int().positive()});
export async function PATCH(request:Request){
  const requestId=crypto.randomUUID();
  try{sameOrigin(request);
    const result=schema.safeParse(await readJsonBody(request));if(!result.success)throw new HttpError('VALIDATION_FAILED',400,'Check the profile fields.',result.error.flatten());
    const db=await serverSupabase();const {data:auth,error:authError}=await db.auth.getUser();if(authError||!auth.user)throw new HttpError('NOT_AUTHENTICATED',401,'Sign in to continue.');
    const {data:account}=await db.from('accounts').select('role').eq('id',auth.user.id).single();if(account?.role!=='creator')throw new HttpError('FORBIDDEN',403,'Only creators can edit this profile.');
    const {data,error}=await db.rpc('save_creator',{p_input:result.data.input,p_expected_version:result.data.expectedVersion});
    if(error)throw new HttpError(error.message.includes('VERSION_CONFLICT')?'VERSION_CONFLICT':'VALIDATION_FAILED',error.message.includes('VERSION_CONFLICT')?409:400,error.message.includes('VERSION_CONFLICT')?'Your profile changed. Reload it before saving.':'Your profile could not be saved. Check your fields.');
    return Response.json({data,requestId});
  }catch(e){return errorResponse(e,requestId);}
}
