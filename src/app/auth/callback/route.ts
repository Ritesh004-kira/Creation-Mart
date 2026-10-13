import { NextResponse, type NextRequest } from 'next/server';
import { serverSupabase } from '@/server/supabase';
import { safeReturnTo } from '@/server/http/return-to';
export async function GET(request:NextRequest) {
  const code=request.nextUrl.searchParams.get('code');
  if(code){const db=await serverSupabase();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safeReturnTo(request.nextUrl.searchParams.get('returnTo')),request.url));}
  return NextResponse.redirect(new URL('/sign-in?error=callback',request.url));
}
