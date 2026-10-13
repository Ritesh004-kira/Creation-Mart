import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { loadCredentials } from './secure-store.mjs';
import { evaluateRights } from '../src/domain/rights-fit.ts';
import { offer,request } from '../tests/unit/fixtures.ts';
process.loadEnvFile('.env.local');const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),anon=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const credential=loadCredentials().find(c=>c.name==='lumaleaf');const {error:login}=await db.auth.signInWithPassword({email:credential.email,password:credential.password});assert(!login);
const {data:owned,error:ownedError}=await db.rpc('owned_briefs',{p_id:null});assert(!ownedError);const b=owned.find(x=>x.state==='published');assert(b,'A published demo brief is required.');
const results=[];async function check(name,run){await run();results.push({name,status:'passed'});console.log('PASS '+name);}
for(const patch of [{},{paidAds:false},{paidAds:null},{attribution:'required'},{territories:['IN']},{territories:[]},{maxTermDays:30},{maxTermDays:null},{thirdPartyStatus:'restricted'},{thirdPartyStatus:'unknown'}]){
 const proposed={...offer,...patch},{data,error}=await db.rpc('evaluate_rights',{p_request:request,p_offer:proposed,p_pipeline:[],p_final:null});assert(!error,'Rights SQL failed: '+(error?.message??''));const expected=evaluateRights(request,proposed,[],[]);assert.equal(data.overall,expected.overall);assert.deepEqual(data.rules,expected.rules);
}
console.log('PASS ten actual SQL/TypeScript rights parity cases');
await check('brief search returns real eligible IDs, counts and explained components',async()=>{const {data,error}=await db.rpc('search_creators',{p_filters:{mediaKinds:['video'],formats:['mp4'],aspectRatios:['9:16'],tools:['comfyui','blender','ffmpeg'],availableOnly:true},p_brief:b.id,p_page:1,p_page_size:12});assert(!error,'Search failed: '+(error?.message??''));assert(data.total>=1);assert(data.items.some(x=>x.displayName==='Asha Demo'));assert(data.items.every(x=>x.fit!==null&&x.terms.length===6&&x.rightsReceipt.overall));assert.equal(data.rankingVersion,'fit-v1');});
await check('impossible kind/format tuple has exact zero count',async()=>{const {data,error}=await db.rpc('search_creators',{p_filters:{mediaKinds:['video'],formats:['png']},p_brief:null,p_page:1,p_page_size:12});assert(!error);assert.equal(data.total,0);assert.deepEqual(data.items,[]);});
await check('currency and missing required tool never silently relax',async()=>{for(const filters of [{currency:'USD',budgetMaxMinor:2000000},{tools:['missing-tool']}]){const {data,error}=await db.rpc('search_creators',{p_filters:filters,p_brief:b.id,p_page:1,p_page_size:12});assert(!error);assert.equal(data.total,0);}});
await check('anonymous browse has no invented percentage and brief access is denied',async()=>{const {data,error}=await anon.rpc('search_creators',{p_filters:{},p_brief:null,p_page:1,p_page_size:12});assert(!error,'Anonymous browse failed: '+(error?.message??''));assert(data.items.every(x=>x.fit===null));const {error:privateError}=await anon.rpc('search_creators',{p_filters:{},p_brief:b.id,p_page:1,p_page_size:12});assert(privateError);});
await check('controlled alias is explicit and repeated ranking is stable',async()=>{const args={p_filters:{q:'vertical'},p_brief:null,p_page:1,p_page_size:12};const {data:a,error}=await anon.rpc('search_creators',args);assert(!error);const {data:c}=await anon.rpc('search_creators',args);assert.deepEqual(a.items.map(x=>x.id),c.items.map(x=>x.id));assert(a.matchedAliases.some(x=>x.slug==='9:16'));});
console.log(JSON.stringify({scope:'discovery and rights parity',rightsParityCases:10,results}));

