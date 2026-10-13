import { serverSupabase } from '../supabase';
import { HttpError } from '../http/errors';
export async function apiUser(role?:'creator'|'brand'){
  const db=await serverSupabase(),{data,error}=await db.auth.getUser();
  if(error||!data.user)throw new HttpError('NOT_AUTHENTICATED',401,'Sign in to continue.');
  const {data:account,error:accountError}=await db.from('accounts').select('role').eq('id',data.user.id).single();
  if(accountError)throw new HttpError('FORBIDDEN',403,'Complete your account setup first.');
  if(role&&account.role!==role)throw new HttpError('FORBIDDEN',403,'This action is unavailable for your role.');
  return {db,user:data.user,account};
}
