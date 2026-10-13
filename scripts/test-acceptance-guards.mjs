import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {loadCredentials} from './secure-store.mjs';
process.loadEnvFile('.env.local');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const credential=loadCredentials().find(r=>r.name==='lumaleaf');assert(!(await db.auth.signInWithPassword({email:credential.email,password:credential.password})).error);
const fixture=JSON.parse(readFileSync('work/security-probes.json','utf8')).fixtures,results=[];
for(const id of [fixture.engagementId,'bc975b92-fdb2-4991-9e0e-80d458a891e8']){
 const {data:e,error}=await db.from('engagements').select('*').eq('id',id).single();assert(!error);
 const {data:s}=await db.from('submissions').select('*').eq('engagement_id',id).order('sequence',{ascending:false}).limit(1).single();
 for(const action of ['accept_engagement','request_revision']){
  const input=action==='accept_engagement'?{expectedVersion:e.version,checks:[],rightsResolutionNote:''}:{expectedVersion:e.version,notes:'A scoped regression probe; no transition should occur.',requirementIds:[e.requirements_snapshot[0].id]};
  const {error:missing}=await db.rpc(action,{p_id:id,p_input:input,p_key:randomUUID()});assert(missing?.message.includes('VALIDATION_FAILED'),'Missing submission reference must fail.');
  results.push({action,missingSubmissionDenied:true});
 }
 if(id!==fixture.engagementId){
  const {error:wrongParent}=await db.rpc('accept_engagement',{p_id:id,p_input:{expectedVersion:e.version,submissionId:s.id,checks:e.requirements_snapshot.filter(r=>r.mode!=='file_check').map(r=>({requirementId:r.id,passed:true,note:'Regression test.'})),rightsResolutionNote:'Scoped guard probe.'},p_key:randomUUID()});
  assert(wrongParent?.message.includes('outside accepted scope'));results.push({legacyWrongParentAcceptanceDenied:true});
 }
}
const {error:privileged}=await db.rpc('record_asset_upload_blocker',{p_id:randomUUID(),p_until:new Date().toISOString(),p_reason:'Forbidden'});assert(privileged);results.push({clientBlockerWriteDenied:true});
writeFileSync('work/acceptance-guard-results.json',JSON.stringify({results},null,2));console.log(JSON.stringify({passed:results.length,results}));
