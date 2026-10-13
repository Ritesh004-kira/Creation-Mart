import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {loadCredentials} from './secure-store.mjs';
import {makePng} from './demo-media.mjs';
process.loadEnvFile('.env.local');
const record=loadCredentials().find(record=>record.name==='bala'),seed=JSON.parse(readFileSync('work/seed-manifest.json','utf8'));
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
assert(!(await db.auth.signInWithPassword({email:record.email,password:record.password})).error);
const bytes=makePng(64,64),{data:asset,error}=await db.rpc('reserve_asset',{p_purpose:'evidence',p_kind:'image',p_format:'png',p_parent:seed.items['bala:1'].id,p_declared_bytes:bytes.length,p_duration:null,p_key:randomUUID()});assert(!error);
const {data:authorization,error:signError}=await db.storage.from(asset.bucket).createSignedUploadUrl(asset.path,{upsert:false});assert(!signError);
try{
 const {data:removed,error:cleanup}=await db.functions.invoke('finalize-asset',{body:{assetId:asset.id,operation:'cleanup'}});assert(!cleanup);
 assert.equal(removed.data.reserved_bytes,1);assert(Date.parse(removed.data.upload_blocked_until)>Date.now());
 for(const upsert of [false,true]){
  const {error:replay}=await db.storage.from(asset.bucket).uploadToSignedUrl(asset.path,authorization.token,bytes,{contentType:'image/png',upsert});
  assert(replay,'A cancelled upload authorization must not recreate or overwrite an unreserved object.');
 }
 const {error:mint}=await db.storage.from(asset.bucket).createSignedUploadUrl(asset.path,{upsert:false});assert(mint);
 const {error:privateRead}=await db.functions.invoke('finalize-asset',{body:{assetId:asset.id,operation:'read'}});assert(privateRead&&privateRead.context.status===404);
 console.log(JSON.stringify({assetId:asset.id,cancelledUploadReplayDenied:true,upsertOverrideDenied:true,newAuthorizationDenied:true,privateReadDenied:true,retainedBytes:1}));
}finally{assert(!(await db.functions.invoke('finalize-asset',{body:{assetId:asset.id,operation:'cleanup'}})).error);}
