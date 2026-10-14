import type { BriefV1, CapabilityV1, CreatorInputV1, RightsOfferV1, RightsRequestV1 } from '../../src/domain/contracts';
export const now=new Date('2026-10-13T00:00:00Z');
export const offer:RightsOfferV1={schemaVersion:1,commercial:true,paidAds:true,modifications:true,sourceFiles:false,exclusiveArrangement:false,trainingUse:false,attribution:'not_required',territories:['WORLD'],maxTermDays:365,thirdPartyStatus:'clear_declared',restrictions:[],declarationText:'Original procedural demo, usage permissions declared.',declaredAt:now.toISOString()};
export const request:RightsRequestV1={schemaVersion:1,commercial:true,paidAds:true,modifications:true,sourceFiles:false,exclusiveArrangement:false,trainingUse:false,attributionAccepted:false,territories:['WORLD'],termDays:365,jurisdictionNotes:'Declared demonstration permissions.'};
export const video:CapabilityV1={kind:'video',formats:['mp4'],aspectRatios:['9:16'],maxWidthPx:1080,maxHeightPx:1920,maxDurationSec:30};
export const image:CapabilityV1={kind:'image',formats:['png'],aspectRatios:['9:16'],maxWidthPx:1080,maxHeightPx:1920,maxDurationSec:null};
export const brief:BriefV1={schemaVersion:1,title:'LumaLeaf launch',objective:'Show the travel bottle in a clean product launch.',audience:'Travelers seeking refillable products',brandContext:'Fictional demo brand',
  outcomes:['product-ad'],styles:['cinematic','clean'],preferredWorkflows:['editing','export'],requiredSkills:['video-editing'],requiredTools:['comfyui','blender','ffmpeg'],requiredModels:[],languages:['en'],
  outputs:[{id:'10000000-0000-4000-8000-000000000001',label:'Product film',kind:'video',quantity:1,format:'mp4',widthPx:1080,heightPx:1920,aspectRatio:'9:16',durationSec:20,maxBytes:25_000_000,contentRequirements:'Show bottle and logo.'},
  {id:'10000000-0000-4000-8000-000000000002',label:'Cover',kind:'image',quantity:1,format:'png',widthPx:1080,heightPx:1920,aspectRatio:'9:16',maxBytes:8_000_000,contentRequirements:'Include bottle and approved text.'}],
  budgetMinMinor:1500000,budgetMaxMinor:2000000,currency:'INR',dueAt:'2026-10-23T00:00:00Z',revisionRounds:1,mustInclude:[],mustAvoid:[],referenceLinks:[],referenceRightsDeclaration:'No external references.',rightsRequest:request};
export const creator:CreatorInputV1={displayName:'Asha Demo',headline:'Product film and launch images',bio:'Fictional demo profile showing an original procedural production process.',
 country:'IN',timezone:'Asia/Kolkata',languages:['en'],specialties:['product-film'],skills:['video-editing'],outcomes:['product-ad'],styles:['cinematic','clean'],
 toolSlugs:['comfyui','blender','ffmpeg'],modelSlugs:[],capabilities:[video,image],minimumPriceMinor:1500000,currency:'INR',available:true,deliveryDays:5,rightsOffer:offer};
