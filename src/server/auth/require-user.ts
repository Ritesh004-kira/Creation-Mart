import { redirect } from 'next/navigation';
import { serverSupabase } from '../supabase';
export async function requireUser(returnTo='/dashboard') {
  const db=await serverSupabase(),{data,error}=await db.auth.getUser();
  if(error&&(error.status===0||(error.status??0)>=500||error.name==='AuthRetryableFetchError'))throw new Error('Authentication is temporarily unavailable. Please retry.');
  if(error||!data.user)redirect('/sign-in?returnTo='+encodeURIComponent(returnTo));
  const {data:account,error:accountError}=await db.from('accounts').select('id,display_name,role,version').eq('id',data.user.id).maybeSingle();
  if(accountError)throw new Error('Your account could not be loaded. Try again.');
  return {db,user:data.user,account};
}
export async function requireRole(role:'creator'|'brand',returnTo='/dashboard') {
  const ctx=await requireUser(returnTo);
  if(!ctx.account?.role)redirect('/onboarding?returnTo='+encodeURIComponent(returnTo));
  if(ctx.account.role!==role)redirect('/dashboard');
  return {...ctx,account:ctx.account!};
}
