import { NextResponse, type NextRequest } from 'next/server';
import { serverSupabase } from '@/server/supabase';
import { safeReturnTo } from '@/server/http/return-to';
import { appOrigin } from '@/server/http/app-origin';
export async function GET(request:NextRequest) {
  const origin=appOrigin(request.url);
  const code=request.nextUrl.searchParams.get('code');
  if(code){const db=await serverSupabase();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safeReturnTo(request.nextUrl.searchParams.get('returnTo')),origin));}
  return NextResponse.redirect(new URL('/sign-in?error=callback',origin));
}
