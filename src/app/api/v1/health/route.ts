import { serverSupabase } from '@/server/supabase';
export async function GET() {
  let reachable=false;
  try{const db=await serverSupabase();const {data,error}=await db.from('catalog_terms').select('slug').limit(1);reachable=!error&&Boolean(data?.length);}catch{/* Report dependency readiness without exposing provider errors. */}
  return Response.json({baseline:'CM-2.0',schemaVersion:'20261013174930',runId:'c213484a-0c12-4cd6-a2a0-e4f67ae38db8',product:'Creation Mart',database:reachable?'reachable':'unavailable',features:{optionalInference:false,assistanceMode:'template'},readiness:reachable?'ready':'degraded'},{status:reachable?200:503,headers:{'Cache-Control':'no-store'}});
}
