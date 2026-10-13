import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadCredentials,saveCredentials } from './secure-store.mjs';
process.loadEnvFile('.env.local');
const credentials=loadCredentials(),results=[];
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
async function login(name){
  const c=credentials.find(r=>r.name===name);assert(c,'Provision demo account '+name+' first.');
  const db=client(),{error}=await db.auth.signInWithPassword({email:c.email,password:c.password});assert(!error,'Real password sign-in failed for '+name);return {db,record:c};
}
async function check(name,fn){await fn();results.push({name,status:'passed'});console.log('PASS '+name);}
const creator=await login('asha'),brand=await login('lumaleaf'),anon=client();
const {creator:creatorFixture}=await import('../tests/unit/fixtures.ts');
for(const actor of [creator,brand]){
  const {data:existing}=await actor.db.from('accounts').select('role').eq('id',actor.record.userId).maybeSingle();
  if(!existing?.role){const actionKey=randomUUID();const {error}=await actor.db.rpc('onboard_account',{p_role:actor.record.role,p_display_name:actor.record.name==='asha'?'Asha Demo':'LumaLeaf Demo',p_key:actionKey});assert(!error,'Guarded onboarding failed.');actor.record.onboardingKey=actionKey;saveCredentials(credentials);}
}
await check('real creator and brand sessions persist immutable roles',async()=>{
  for(const actor of [creator,brand]){const {data,error}=await actor.db.from('accounts').select('role').eq('id',actor.record.userId).single();assert(!error);assert.equal(data.role,actor.record.role);}
});
await check('anonymous cannot onboard',async()=>{const {error}=await anon.rpc('onboard_account',{p_role:'creator',p_display_name:'Intruder',p_key:randomUUID()});assert(error);});
await check('creator cannot switch role through RPC',async()=>{const {error}=await creator.db.rpc('onboard_account',{p_role:'brand',p_display_name:'Intruder',p_key:randomUUID()});assert(error);});
await check('direct account role and owner writes are denied',async()=>{
  const {error}=await creator.db.from('accounts').update({role:'brand',id:brand.record.userId}).eq('id',creator.record.userId);assert(error);
});
await check('brand cannot read another account or draft profile',async()=>{
  const {data,error}=await brand.db.from('accounts').select('*').eq('id',creator.record.userId);assert(!error);assert.equal(data.length,0);
  const {data:profiles,error:pe}=await brand.db.from('creator_profiles').select('*').eq('user_id',creator.record.userId);assert(!pe);assert.equal(profiles.length,0);
});
await check('anonymous sees no draft profile',async()=>{const {data,error}=await anon.from('creator_profiles').select('user_id').eq('user_id',creator.record.userId);assert(!error);assert.equal(data.length,0);});
await check('onboarding idempotency replay is stable and body tampering conflicts',async()=>{
  assert(creator.record.onboardingKey,'Exact original action key is required for this replay test.');
  const {data,error}=await creator.db.rpc('onboard_account',{p_role:'creator',p_display_name:'Asha Demo',p_key:creator.record.onboardingKey});assert(!error);assert.equal(data.id,creator.record.userId);
  const {error:conflict}=await creator.db.rpc('onboard_account',{p_role:'brand',p_display_name:'Asha Demo',p_key:creator.record.onboardingKey});assert(conflict);
});
await check('protected publication and technical projection fields cannot be written',async()=>{
  const {error}=await creator.db.from('creator_profiles').update({published:true,search_text:'tampered',version:99}).eq('user_id',creator.record.userId);assert(error);
});
await check('creator saves and reloads a validated profile through the guarded RPC',async()=>{
  const {data:profile,error:readError}=await creator.db.from('creator_profiles').select('version').eq('user_id',creator.record.userId).single();assert(!readError);
  const {data:saved,error}=await creator.db.rpc('save_creator',{p_input:creatorFixture,p_expected_version:profile.version});assert(!error,'Profile save failed: '+(error?.code??''));
  const {data:reloaded,error:reloadError}=await creator.db.from('creator_profiles').select('version,headline,capabilities').eq('user_id',creator.record.userId).single();assert(!reloadError);assert.equal(reloaded.version,saved.version);assert.equal(reloaded.headline,creatorFixture.headline);assert.deepEqual(reloaded.capabilities,creatorFixture.capabilities);
  const {error:stale}=await creator.db.rpc('save_creator',{p_input:creatorFixture,p_expected_version:profile.version});assert(stale);assert(stale.message.includes('VERSION_CONFLICT'));
});
await check('brand cannot call the creator save RPC',async()=>{const {error}=await brand.db.rpc('save_creator',{p_input:creatorFixture,p_expected_version:1});assert(error);});
await check('direct RPC rejects protected fields in JSON input',async()=>{const {data:p}=await creator.db.from('creator_profiles').select('version').eq('user_id',creator.record.userId).single();const {error}=await creator.db.rpc('save_creator',{p_input:{...creatorFixture,published:true},p_expected_version:p.version});assert(error);});
await check('mutable user metadata cannot grant a brand role',async()=>{
  const {error:metadataError}=await creator.db.auth.updateUser({data:{role:'brand',is_admin:true}});assert(!metadataError);
  const {data:account,error}=await creator.db.from('accounts').select('role').eq('id',creator.record.userId).single();assert(!error);assert.equal(account.role,'creator');
  const {error:roleError}=await creator.db.rpc('onboard_account',{p_role:'brand',p_display_name:'Asha Demo',p_key:randomUUID()});assert(roleError);
});
await check('direct profile mutation without guarded version context is denied',async()=>{
  const {error}=await creator.db.from('creator_profiles').update({headline:'Unconditional overwrite attempt'}).eq('user_id',creator.record.userId);assert(error);assert(error.message.includes('VERSION_CONFLICT'));
});
console.log(JSON.stringify({environment:url,scope:'identity foundation only',results}));
