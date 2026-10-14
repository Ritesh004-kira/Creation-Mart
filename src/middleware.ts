import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { boundedFetch } from '@/lib/bounded-fetch';
export async function middleware(request:NextRequest) {
  const nonce=btoa(crypto.randomUUID());
  const supabaseOrigin=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  const csp=[
    "default-src 'self'", "script-src 'self' 'nonce-"+nonce+"' 'strict-dynamic'"+(process.env.NODE_ENV==='development'?" 'unsafe-eval'":''),
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: "+supabaseOrigin,
    "media-src 'self' blob: "+supabaseOrigin, "connect-src 'self' "+supabaseOrigin+(process.env.NODE_ENV==='development'?' ws://localhost:3000':''),
    "object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'",
  ].join('; ');
  const headers=new Headers(request.headers);headers.set('x-nonce',nonce);headers.set('Content-Security-Policy',csp);
  let response=NextResponse.next({request:{headers}});
  const db=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    global:{fetch:boundedFetch},
    cookies:{getAll:()=>request.cookies.getAll(),setAll(items,cacheHeaders){
      items.forEach(({name,value})=>request.cookies.set(name,value));
      headers.set('cookie',request.cookies.toString());
      response=NextResponse.next({request:{headers}});
      items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      Object.entries(cacheHeaders).forEach(([key,value])=>response.headers.set(key,value));
    }},
  });
  await db.auth.getClaims();
  response.headers.set('Content-Security-Policy',csp);response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
