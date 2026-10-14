import { NextResponse, type NextRequest } from 'next/server';
import { serverSupabase } from '@/server/supabase';
import { safeReturnTo } from '@/server/http/return-to';
import { appOrigin } from '@/server/http/app-origin';
export async function GET(request:NextRequest){
  const origin=appOrigin(request.url),token_hash=request.nextUrl.searchParams.get('token_hash'),type=request.nextUrl.searchParams.get('type');
  if(token_hash&&(type==='email'||type==='signup'||type==='recovery')){
    const db=await serverSupabase();const {error}=await db.auth.verifyOtp({token_hash,type});
    if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/account/password':safeReturnTo(request.nextUrl.searchParams.get('returnTo')),origin));
  }
  return NextResponse.redirect(new URL('/sign-in?error=confirmation',origin));
}
