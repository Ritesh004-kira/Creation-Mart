import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadCredentials } from './secure-store.mjs';
import { brief } from '../tests/unit/fixtures.ts';
import { compileRequirements } from '../src/domain/brief-compiler.ts';
process.loadEnvFile('.env.local');
const credentials=loadCredentials(),url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
async function login(name){const record=credentials.find(r=>r.name===name),db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});assert(record);const {error}=await db.auth.signInWithPassword({email:record.email,password:record.password});assert(!error);return db;}
const brand=await login('lumaleaf'),creator=await login('asha'),results=[];
const complete={...brief,dueAt:new Date(Date.now()+10*86400000).toISOString(),referenceLinks:['https://example.com/private-brief-reference']};
async function check(name,fn){await fn();results.push({name,status:'passed'});console.log('PASS '+name);}
const k=randomUUID(),{data:draft,error:createError}=await brand.rpc('create_brief',{p_input:{schemaVersion:1,title:'Live LumaLeaf brief'},p_key:k});assert(!createError,'Create failed: '+(createError?.message??''));
await check('owner creates persistent partial draft and replays action key',async()=>{const {data,error}=await brand.rpc('create_brief',{p_input:{schemaVersion:1,title:'Live LumaLeaf brief'},p_key:k});assert(!error);assert.equal(data.id,draft.id);const {data:owned,error:read}=await brand.rpc('owned_briefs',{p_id:draft.id});assert(!read);assert.equal(owned[0].payload.title,'Live LumaLeaf brief');});
await check('creator cannot read draft or private owner payload',async()=>{const {data,error}=await creator.from('briefs').select('id,safe_payload').eq('id',draft.id);assert(!error);assert.equal(data.length,0);const {error:privateRead}=await creator.from('briefs').select('payload').eq('id',draft.id);assert(privateRead);});
await check('direct invalid publication fails without mutating draft state',async()=>{const {error}=await brand.rpc('publish_brief',{p_id:draft.id,p_expected_version:1,p_key:randomUUID()});assert(error);const {data:owned}=await brand.rpc('owned_briefs',{p_id:draft.id});assert.equal(owned[0].state,'draft');});
const {data:saved,error:saveError}=await brand.rpc('save_brief',{p_id:draft.id,p_input:complete,p_expected_version:1,p_start_revision:false});assert(!saveError,'Save failed: '+(saveError?.message??''));
await check('stale draft version and protected requirements cannot be written',async()=>{const {error}=await brand.rpc('save_brief',{p_id:draft.id,p_input:complete,p_expected_version:1,p_start_revision:false});assert(error);const {error:tamper}=await brand.from('briefs').update({requirements:[{id:'fake'}],published_revision:99}).eq('id',draft.id);assert(tamper);});
const {data:published,error:pubError}=await brand.rpc('publish_brief',{p_id:draft.id,p_expected_version:saved.version,p_key:randomUUID()});assert(!pubError,'Publish failed: '+(pubError?.message??''));
await check('SQL requirements match the canonical compiler and hide private reference links',async()=>{assert.deepEqual(published.requirements,compileRequirements(complete));const {data,error}=await creator.from('briefs').select('safe_payload,published_revision').eq('id',draft.id).single();assert(!error);assert.equal(data.published_revision,1);assert.equal(data.safe_payload.referenceLinks,undefined);});
const {data:profile}=await creator.from('creator_profiles').select('user_id').single();
await check('brand shortlist is persisted, deduplicated and private',async()=>{const key=randomUUID(),args={p_brief:draft.id,p_creator:profile.user_id,p_remove:false,p_key:key};const {error}=await brand.rpc('shortlist_mutation',args);assert(!error);const {error:replay}=await brand.rpc('shortlist_mutation',args);assert(!replay);const {data}=await brand.from('shortlists').select('id').eq('brief_id',draft.id);assert.equal(data.length,1);const {data:hidden}=await creator.from('shortlists').select('id').eq('brief_id',draft.id);assert.equal(hidden.length,0);});
console.log(JSON.stringify({scope:'brief publication/requirements/shortlist only',briefId:draft.id,results}));
