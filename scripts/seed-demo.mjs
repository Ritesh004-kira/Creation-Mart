import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { loadCredentials,saveCredentials } from './secure-store.mjs';
import { makePng,makeWav } from './demo-media.mjs';
import { brief,offer as baseOffer } from '../tests/unit/fixtures.ts';
process.loadEnvFile('.env.local');const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,records=loadCredentials();
assert.equal(records.length,14,'Prepare the fourteen encrypted demo accounts and apply the scoped auth bootstrap first.');
const path='work/seed-manifest.json',manifest=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{runId:'c213484a-0c12-4cd6-a2a0-e4f67ae38db8',users:{},items:{},briefs:{}};
mkdirSync('work',{recursive:true});const checkpoint=()=>writeFileSync(path,JSON.stringify(manifest,null,2));
const caps=(kind,formats,ratios=[],w=null,h=null,duration=null)=>({kind,formats,aspectRatios:ratios,maxWidthPx:w,maxHeightPx:h,maxDurationSec:duration});
const portrait=caps('image',['png','jpeg','webp'],['9:16','1:1','16:9'],1920,1920),video=caps('video',['mp4'],['9:16'],1920,1920,60);
const profiles=[
 ['asha','Product films and clean launch covers',[video,portrait],'product-film',['video-editing','image-editing'],true,'INR'],
 ['bala','Illustrated motion and animation',[caps('video',['mp4'],['1:1'],1080,1080,60),portrait],'animation',['video-editing'],true,'INR'],
 ['chloe','Concept images and visual direction',[portrait],'concept-art',['image-editing'],true,'INR'],
 ['dev','Landscape product films and stills',[caps('video',['mp4'],['16:9'],1920,1080,60),portrait],'product-film',['video-editing'],true,'INR'],
 ['ena','Original audio and sound design',[caps('audio',['wav','mp3'],[],null,null,120)],'audio',['sound-design'],true,'INR'],
 ['farah','Production copy and launch writing',[caps('text',['txt'])],'copywriting',['copywriting'],true,'INR'],
 ['gautam','3D poster concepts and metadata',[caps('three_d',['png'],['1:1'],1080,1080)],'three-d',['image-editing'],true,'INR'],
 ['hana','Retouching and product cover images',[portrait],'concept-art',['image-editing'],true,'INR'],
 ['ivo','Storyboards and illustrated direction',[portrait],'concept-art',['image-editing'],true,'INR'],
 ['jaya','Portrait film and launch cover production',[video,portrait],'product-film',['video-editing','image-editing'],false,'INR'],
 ['kai','Product images and international projects',[portrait],'concept-art',['image-editing'],true,'USD'],
 ['lena','Portrait imagery with declared likeness limits',[portrait],'concept-art',['image-editing'],true,'INR'],
];
async function login(record){const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),{error}=await db.auth.signInWithPassword({email:record.email,password:record.password});assert(!error,'Sign-in failed for '+record.name);return db;}
async function onboard(record,db){const {data:a,error}=await db.from('accounts').select('role').eq('id',record.userId).maybeSingle();assert(!error);
 if(!a?.role){const action=randomUUID(),{error:e}=await db.rpc('onboard_account',{p_role:record.role,p_display_name:record.name[0].toUpperCase()+record.name.slice(1)+' Demo',p_key:action});assert(!e,'Onboarding failed for '+record.name);record.onboardingKey=action;saveCredentials(records);}
 manifest.users[record.name]=record.userId;checkpoint();
}
function workInput(name,index,kind,rights,format,width,height){
 const tool=kind==='video'?'browser-canvas':kind==='audio'?'audacity':'browser-canvas';
 return {title:name[0].toUpperCase()+name.slice(1)+' procedural '+(index+1),objective:'Demonstrate a production output with a precise declared process.',description:'Fictional demo portfolio. The actual file is original procedural media; this production process is illustrative.',
 kind,previewAssetId:null,outputFormats:[format],...(width?{widthPx:width,heightPx:height}:{}),...(['video','audio'].includes(kind)?{durationSec:kind==='video'?20:2}:{}),outcomes:kind==='text'?['launch-copy']:['product-ad'],styles:index?['illustrated']:['clean'],
 modelRefs:[],workflow:['input','editing','export'].map((stage,i)=>({id:randomUUID(),ordinal:i+1,stage,toolSlug:tool,description:'Illustrative '+stage+' step for this original procedural demo.',humanAction:'Chose the original production concept, palette and export settings.',inputDeclaration:'Original procedural code and shapes or synthesized tones; no third-party source media.'})),
 humanContribution:'Selected the procedural design and documented its scope. Fictional creator persona; the bytes are real.',generationDisclosure:'no_ai',modelDisclosureNote:'No model generated these procedural demo bytes. Tool/capability persona declarations are illustrative.',rightsOffer:rights,artifactOrigin:'procedural_demo'};
}
for(const [name,headline,capabilities,specialty,skills,available,currency] of profiles){
 const record=records.find(r=>r.name===name),db=await login(record);await onboard(record,db);
 const rights={...baseOffer,paidAds:name==='chloe'?false:true,thirdPartyStatus:['hana','lena'].includes(name)?'unknown':'clear_declared',declarationText:'Fictional demo declaration for original procedural assets. No independent rights or identity verification.',declaredAt:new Date().toISOString()};
 const {data:current}=await db.from('creator_profiles').select('version').eq('user_id',record.userId).single();
 const input={displayName:name[0].toUpperCase()+name.slice(1)+' Demo',headline,bio:'Fictional demonstration creator for Creation Mart. Capabilities, pricing and workflow descriptions are illustrative declarations; uploaded procedural files receive real technical checks.',
 country:'IN',timezone:'Asia/Kolkata',languages:['en'],specialties:[specialty],skills,outcomes:specialty==='copywriting'?['launch-copy']:['product-ad'],styles:['clean','cinematic','illustrated'],toolSlugs:name==='ena'?['audacity']:name==='farah'?['browser-canvas']:['comfyui','blender','ffmpeg','browser-canvas'],modelSlugs:[],capabilities,minimumPriceMinor:currency==='USD'?5000:1500000,currency,available,deliveryDays:5,rightsOffer:rights};
 const {error:save}=await db.rpc('save_creator',{p_input:input,p_expected_version:current.version});assert(!save,'Profile save failed for '+name+': '+(save?.message??''));
 for(let index=0;index<2;index++){
   const tag=name+':'+index;if(manifest.items[tag]?.published)continue;
   let kind='image',format='png',width=1080,height=1920,bytes;
   if(['asha','bala','dev','jaya'].includes(name)&&index===0){kind='video';format='mp4';const shape=name==='dev'?'landscape':name==='bala'?'square':'portrait';[width,height]=shape==='landscape'?[1920,1080]:shape==='square'?[1080,1080]:[1080,1920];bytes=readFileSync('work/demo-media/'+shape+'.mp4');}
   else if(name==='ena'){kind='audio';format='wav';width=null;height=null;bytes=makeWav(2);}
   else if(name==='farah'){kind='text';format='txt';width=null;height=null;bytes=Buffer.from('Original procedural demo launch copy.\nLumaLeaf: carry less, refill more.\nFictional brand and creator. No model generation.\n');}
   else{if(name==='gautam'){kind='three_d';width=1080;height=1080;}bytes=makePng(width,height,index);}
   let state=manifest.items[tag];const work=state?.input??workInput(name,index,kind,rights,format,width,height);
   if(!state){const action=randomUUID(),{data:item,error}=await db.rpc('create_portfolio_item',{p_input:work,p_key:action});assert(!error,'Work create failed: '+(error?.message??''));state={id:item.id,version:item.version,input:work,reserveKey:randomUUID()};manifest.items[tag]=state;checkpoint();}
   const {data:asset,error:reserve}=await db.rpc('reserve_asset',{p_purpose:'portfolio_preview',p_kind:kind==='three_d'?'image':kind,p_format:format,p_parent:state.id,p_declared_bytes:bytes.length,p_duration:['video','audio'].includes(kind)?kind==='video'?20:2:null,p_key:state.reserveKey});assert(!reserve,'Reserve failed for '+tag+': '+(reserve?.message??''));
   const {data:actual}=await db.from('assets').select('*').eq('id',asset.id).single();let ready=actual;
   if(actual.state!=='ready'){const {data:authorization,error:sign}=await db.storage.from(actual.bucket).createSignedUploadUrl(actual.path,{upsert:false});assert(!sign);const {error:upload}=await db.storage.from(actual.bucket).uploadToSignedUrl(actual.path,authorization.token,bytes,{contentType:format==='mp4'?'video/mp4':format==='wav'?'audio/wav':format==='txt'?'text/plain':'image/png',upsert:false});assert(!upload||/already exists|duplicate/i.test(upload.message));const {data:checked,error:check}=await db.functions.invoke('finalize-asset',{body:{assetId:asset.id}});assert(!check,'Finalizer failed for '+tag);ready=checked.data;}
   const {data:item}=await db.from('portfolio_items').select('version').eq('id',state.id).single();const {data:saved,error:saveWork}=await db.rpc('save_portfolio_item',{p_id:state.id,p_input:{...work,previewAssetId:ready.id},p_expected_version:item.version});assert(!saveWork,'Save work: '+(saveWork?.message??''));const {error:publish}=await db.rpc('publish_portfolio_item',{p_id:state.id,p_expected_version:saved.version,p_key:randomUUID(),p_published:true});assert(!publish,'Publish work: '+(publish?.message??''));state.assetId=ready.id;state.published=true;checkpoint();console.log(JSON.stringify({name,item:index+1,kind,actualBytes:ready.actual_bytes,technicalCheck:'real',creativeOrigin:'procedural_demo'}));
 }
 const {data:profile}=await db.from('creator_profiles').select('version,published').eq('user_id',record.userId).single();if(!profile.published){const {error}=await db.rpc('publish_creator',{p_expected_version:profile.version,p_key:randomUUID(),p_published:true});assert(!error,'Profile publish: '+(error?.message??''));}
}
for(const name of ['lumaleaf','orbitnote']){
 const record=records.find(r=>r.name===name),db=await login(record);await onboard(record,db);
 const {data:p}=await db.from('brand_profiles').select('version').eq('user_id',record.userId).single();const {error}=await db.rpc('save_brand',{p_input:{companyName:name==='lumaleaf'?'LumaLeaf Demo':'OrbitNote Demo',industry:'Fictional demo brand',audience:'Demonstration users',tone:'Clear and production focused',country:'IN'},p_expected_version:p.version});assert(!error);
 const labels=name==='lumaleaf'?['lumaleaf','conflicting']:['orbitnote'];
 for(const label of labels){if(manifest.briefs[label])continue;
  const payload=label==='orbitnote'?{...brief,title:'OrbitNote original launch copy',outputs:[{id:randomUUID(),label:'Launch copy',kind:'text',quantity:1,format:'txt',maxBytes:256000,contentRequirements:'Original concise launch copy for the fictional note app.'}],outcomes:['launch-copy'],requiredSkills:['copywriting'],requiredTools:[],dueAt:new Date(Date.now()+10*86400000).toISOString()}:{...brief,title:label==='lumaleaf'?'LumaLeaf portrait product launch':'Conflicting unsupported draft',dueAt:new Date(Date.now()+10*86400000).toISOString()};
  if(label==='conflicting'){payload.budgetMinMinor=3000000;payload.budgetMaxMinor=2000000;payload.outputs[0]={...payload.outputs[0],format:'glb',aspectRatio:'16:9'};}
  const {data:created,error}=await db.rpc('create_brief',{p_input:payload,p_key:randomUUID()});assert(!error);if(label!=='conflicting'){const {error:publish}=await db.rpc('publish_brief',{p_id:created.id,p_expected_version:1,p_key:randomUUID()});assert(!publish,'Seed brief: '+(publish?.message??''));}
  manifest.briefs[label]=created.id;checkpoint();
 }
}
console.log(JSON.stringify({runId:manifest.runId,seedCreators:12,seedItems:Object.keys(manifest.items).length,seedBrands:2,seedBriefs:manifest.briefs,manifest:path,scope:'known run-tagged identities and tracked rows only'}));
