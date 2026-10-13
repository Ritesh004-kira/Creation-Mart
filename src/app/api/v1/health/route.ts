import { serverSupabase } from '@/server/supabase';
export async function GET() {
  const db=await serverSupabase();const {error}=await db.from('catalog_terms').select('slug').limit(1);
  return Response.json({baseline:'CM-2.0',product:'Creation Mart',database:error?'unavailable':'reachable',features:{optionalInference:false,assistanceMode:'template'},readiness:'implementation_in_progress'},{status:error?503:200,headers:{'Cache-Control':'no-store'}});
}
