import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadCredentials } from './secure-store.mjs';
import { makePng } from './demo-media.mjs';
import { brief,offer } from '../tests/unit/fixtures.ts';
process.loadEnvFile('.env.local');const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,credentials=loadCredentials();
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
async function login(name){const record=credentials.find(r=>r.name===name),db=client();assert(record);const {error}=await db.auth.signInWithPassword({email:record.email,password:record.password});assert(!error);return db;}
const brand=await login('lumaleaf'),creator=await login('asha'),anon=client(),results=[];
async function check(name,run){await run();results.push({name,status:'passed'});console.log('PASS '+name);}
const output={...brief.outputs[1],id:randomUUID(),quantity:1},payload={...brief,title:'Workflow '+Date.now(),outputs:[output],dueAt:new Date(Date.now()+10*86400000).toISOString()};
const {data:draft,error:ce}=await brand.rpc('create_brief',{p_input:payload,p_key:randomUUID()});assert(!ce,'Create brief: '+(ce?.message??''));
const {data:published,error:pe}=await brand.rpc('publish_brief',{p_id:draft.id,p_expected_version:1,p_key:randomUUID()});assert(!pe,'Publish brief: '+(pe?.message??''));
const application={briefRevision:published.revision,quoteMinor:1750000,currency:'INR',deliveryDays:5,note:'Original procedural delivery for the fictional demo.',pipeline:[],rightsOffer:offer};
const {data:app,error:ae}=await creator.rpc('create_application',{p_brief:draft.id,p_input:application,p_key:randomUUID()});assert(!ae,'Apply: '+(ae?.message??''));
await check('creator cannot select or overwrite trusted participant snapshots',async()=>{const {error}=await creator.rpc('select_application',{p_id:app.id,p_expected_application_version:app.version,p_expected_brief_revision:published.revision,p_review_ack:null,p_key:randomUUID()});assert(error);const {error:raw}=await creator.from('engagements').insert({application_id:app.id,brand_id:app.creator_id});assert(raw);});
const selectKey=randomUUID(),selectArgs={p_id:app.id,p_expected_application_version:app.version,p_expected_brief_revision:published.revision,p_review_ack:null,p_key:selectKey};
const {data:selection,error:se}=await brand.rpc('select_application',selectArgs);assert(!se,'Select: '+(se?.message??''));
await check('selection is atomic, snapshots actual scope and replays exact action',async()=>{const {data:replay,error}=await brand.rpc('select_application',selectArgs);assert(!error);assert.equal(replay.id,selection.id);const {data:e}=await brand.from('engagements').select('*').eq('id',selection.id).single();assert.equal(e.creator_id,app.creator_id);assert.equal(e.brief_snapshot.outputs[0].id,output.id);assert.equal(e.requirements_snapshot.length,5);});
await check('engaged scope is frozen and participant data is not anonymous',async()=>{const {error}=await brand.rpc('save_brief',{p_id:draft.id,p_input:{...payload,title:'Changed'},p_expected_version:published.version+1,p_start_revision:true});assert(error);const {data,error:read}=await anon.from('engagements').select('*').eq('id',selection.id);assert(read||data.length===0);});
async function file(style){
 const bytes=makePng(1080,1920,style),{data:asset,error}=await creator.rpc('reserve_asset',{p_purpose:'submission',p_kind:'image',p_format:'png',p_parent:selection.id,p_declared_bytes:bytes.length,p_duration:null,p_key:randomUUID()});assert(!error,'Reserve: '+(error?.message??''));
 const {data:authorization,error:sign}=await creator.storage.from(asset.bucket).createSignedUploadUrl(asset.path,{upsert:false});assert(!sign);
 const {error:upload}=await creator.storage.from(asset.bucket).uploadToSignedUrl(asset.path,authorization.token,bytes,{contentType:'image/png',upsert:false});assert(!upload);
 const {data:checked,error:finalize}=await creator.functions.invoke('finalize-asset',{body:{assetId:asset.id}});assert(!finalize,'Finalize delivery failed.');return checked.data;
}
const v1=await file(0),{data:eng}=await creator.from('engagements').select('*').eq('id',selection.id).single();
const finalRights={schemaVersion:1,offer,modelRefs:[],inputs:[{description:'Original procedural code and shapes.',source:'creator_original',commercialPermission:true,release:'not_applicable'}],limitations:[],declaredAt:new Date().toISOString()};
const input=(version,asset)=>({expectedVersion:version,assetIds:[asset.id],outputMapping:[{outputId:output.id,assetIds:[asset.id]}],creatorChecklist:eng.requirements_snapshot.map(r=>({requirementId:r.id,confirmed:true})),finalRights});
const {data:first,error:submit}=await creator.rpc('submit_delivery',{p_id:selection.id,p_input:input(eng.version,v1),p_key:randomUUID()});assert(!submit,'Submit v1: '+(submit?.message??''));
await check('v1 has actual automatic file checks and separate creator confirmations',async()=>{const {data:s}=await brand.from('submissions').select('*').eq('id',first.id).single();assert.equal(s.sequence,1);assert(s.automatic_checks.every(c=>c.passed));assert.equal(s.brand_review,null);assert.deepEqual(s.asset_ids,[v1.id]);});
const {data:reviewEng}=await brand.from('engagements').select('*').eq('id',selection.id).single(),reqId=output.id+':content';
const {data:revision,error:re}=await brand.rpc('request_revision',{p_id:selection.id,p_input:{expectedVersion:reviewEng.version,submissionId:first.id,notes:'Use the alternate procedural palette for the approved cover.',requirementIds:[reqId]},p_key:randomUUID()});assert(!re,'Revision: '+(re?.message??''));
const v2=await file(1),{data:second,error:secondError}=await creator.rpc('submit_delivery',{p_id:selection.id,p_input:input(revision.version,v2),p_key:randomUUID()});assert(!secondError,'Submit v2: '+(secondError?.message??''));
await check('revision preserves the first delivered files and rejects stale acceptance',async()=>{const {data:versions}=await brand.from('submissions').select('id,sequence,asset_ids').eq('engagement_id',selection.id).order('sequence');assert.equal(versions.length,2);assert.deepEqual(versions[0].asset_ids,[v1.id]);const {error}=await brand.rpc('accept_engagement',{p_id:selection.id,p_input:{expectedVersion:second.engagementVersion,submissionId:first.id,checks:[],rightsResolutionNote:''},p_key:randomUUID()});assert(error);});
const review={expectedVersion:second.engagementVersion,submissionId:second.id,checks:eng.requirements_snapshot.filter(r=>r.mode!=='file_check').map(r=>({requirementId:r.id,passed:true,note:'Reviewed the delivered procedural version.'})),rightsResolutionNote:'Final permissions and original inputs reviewed as declarations.'};
const {data:accepted,error:accept}=await brand.rpc('accept_engagement',{p_id:selection.id,p_input:review,p_key:randomUUID()});assert(!accept,'Accept: '+(accept?.message??''));
await check('latest acceptance completes the brief and preserves participant downloads and events',async()=>{assert.equal(accepted.state,'accepted');const {data:b}=await brand.rpc('owned_briefs',{p_id:draft.id});assert.equal(b[0].state,'completed');const {data:events}=await creator.from('workflow_events').select('event_type').eq('engagement_id',selection.id);assert(events.some(e=>e.event_type==='revision_requested'));assert(events.some(e=>e.event_type==='delivery_accepted'));const {data:link,error}=await brand.functions.invoke('finalize-asset',{body:{assetId:v2.id,operation:'read'}});assert(!error);assert.equal(link.data.expiresIn,60);const response=await fetch(link.data.url);assert.equal(response.status,200);const {error:outside}=await anon.functions.invoke('finalize-asset',{body:{assetId:v2.id,operation:'read'}});assert(outside);});
console.log(JSON.stringify({scope:'actual application-through-v2-acceptance workflow',briefId:draft.id,engagementId:selection.id,results}));

