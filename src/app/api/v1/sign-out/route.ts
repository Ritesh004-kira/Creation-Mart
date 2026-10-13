import { NextResponse } from 'next/server';
import { serverSupabase } from '@/server/supabase';
import { sameOrigin,errorResponse } from '@/server/http/errors';
export async function POST(request:Request){try{sameOrigin(request);const db=await serverSupabase();await db.auth.signOut();return NextResponse.redirect(new URL('/',request.url),303);}catch(e){return errorResponse(e,crypto.randomUUID());}}
