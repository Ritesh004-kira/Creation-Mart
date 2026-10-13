import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadCredentials} from './secure-store.mjs';
process.loadEnvFile('.env.local');
const apply=process.argv.includes('--apply'),protect=process.argv.includes('--protect-recent'),summary=[];
for(const record of loadCredentials()){
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 assert(!(await db.auth.signInWithPassword({email:record.email,password:record.password})).error);
 const {data,error}=await db.from('assets').select('id,state,upload_blocked_until,object_deleted_at,created_at').eq('owner_id',record.userId).eq('state','rejected');assert(!error);
 const selected=data.filter(a=>a.upload_blocked_until?Date.parse(a.upload_blocked_until)<=Date.now()&&!a.object_deleted_at:protect&&Date.parse(a.created_at)>Date.now()-2*60*60*1000);
 for(const asset of selected)if(apply){const {error}=await db.functions.invoke('finalize-asset',{body:{assetId:asset.id,operation:'cleanup'}});assert(!error,'Scoped cleanup failed for '+asset.id);}
 summary.push({alias:record.name,eligible:selected.length,applied:apply});
 await db.auth.signOut();
}
console.log(JSON.stringify({scope:'only run-owned demo users; rejected uploads',summary}));
