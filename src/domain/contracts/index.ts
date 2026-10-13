import { z } from 'zod';

export const mediaKind = z.enum(['image','video','audio','text','three_d']);
const shortText = z.string().trim().min(1).max(2000);
const slug = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,79}$/);
const tags = z.array(slug).max(20).refine(v => new Set(v).size === v.length, 'Duplicate values');
const stamp = z.iso.datetime({offset:true});
const minor = z.number().int().min(1).max(1_000_000_000);
const permission = z.boolean().nullable();
export const rightsOfferSchema = z.strictObject({
  schemaVersion:z.literal(1), commercial:permission, paidAds:permission, modifications:permission,
  sourceFiles:permission, exclusiveArrangement:permission, trainingUse:permission,
  attribution:z.enum(['required','not_required','unknown']),
  territories:z.array(z.string().regex(/^(WORLD|[A-Z]{2})$/)).max(20),
  maxTermDays:z.number().int().min(1).max(36500).nullable(),
  thirdPartyStatus:z.enum(['clear_declared','unknown','restricted']),
  restrictions:z.array(shortText).max(20), declarationText:shortText, declaredAt:stamp,
});
export const rightsRequestSchema = z.strictObject({
  schemaVersion:z.literal(1),commercial:z.boolean(),paidAds:z.boolean(),modifications:z.boolean(),
  sourceFiles:z.boolean(),exclusiveArrangement:z.boolean(),trainingUse:z.boolean(),
  attributionAccepted:z.boolean(),territories:z.array(z.string().regex(/^(WORLD|[A-Z]{2})$/)).min(1).max(20),
  termDays:z.number().int().min(1).max(36500),jurisdictionNotes:z.string().max(2000),
});
export const modelRefSchema = z.strictObject({
  catalogSlug:slug.nullable(),customName:z.string().min(1).max(80).optional(),version:z.string().min(1).max(80),
  termsUrl:z.url({protocol:/^https$/}).optional(),entitlementDeclaration:shortText.optional(),
}).refine(v => !!v.catalogSlug || !!v.customName,'Name the custom model');
export const capabilitySchema = z.strictObject({
  kind:mediaKind,formats:z.array(slug).min(1).max(20),aspectRatios:z.array(z.string().regex(/^[1-9]\d*:[1-9]\d*$/)).max(20),
  maxWidthPx:z.number().int().min(1).max(16384).nullable(),maxHeightPx:z.number().int().min(1).max(16384).nullable(),
  maxDurationSec:z.number().min(1).max(3600).nullable(),
}).superRefine((v,c) => {
  const kinds:Record<string,string[]>={image:['png','jpeg','webp'],video:['mp4'],audio:['wav','mp3'],text:['txt'],three_d:['png','jpeg','webp']};
  if(v.formats.some(f=>!kinds[v.kind].includes(f)))c.addIssue({code:'custom',path:['formats'],message:'Choose formats for this media type'});
  if((v.kind==='text'||v.kind==='audio')&&v.aspectRatios.length)c.addIssue({code:'custom',path:['aspectRatios'],message:'Text and audio do not have aspect ratios'});
});
export const creatorSchema = z.strictObject({
  displayName:z.string().trim().min(2).max(80),headline:z.string().trim().min(10).max(120),bio:z.string().trim().min(30).max(1500),
  country:z.string().regex(/^[A-Z]{2}$/),timezone:z.string().min(1).max(80),languages:tags.min(1),
  specialties:tags.min(1),skills:tags,outcomes:tags,styles:tags,toolSlugs:tags,modelSlugs:tags,
  capabilities:z.array(capabilitySchema).min(1).max(12),minimumPriceMinor:minor,currency:z.string().regex(/^[A-Z]{3}$/),
  available:z.boolean(),deliveryDays:z.number().int().min(1).max(90),rightsOffer:rightsOfferSchema,
});
export const brandSchema = z.strictObject({
  companyName:z.string().trim().min(2).max(80),industry:z.string().max(80),audience:z.string().max(2000),
  tone:z.string().max(120),country:z.string().regex(/^[A-Z]{2}$/),
});
export const workflowStepSchema = z.strictObject({
  id:z.uuid(),ordinal:z.number().int().min(1).max(12),stage:z.enum(['input','generation','editing','quality_check','export']),
  toolSlug:slug,toolVersion:z.string().max(80).optional(),model:modelRefSchema.optional(),
  description:shortText,humanAction:shortText,inputDeclaration:shortText,
  promptExcerpt:z.string().max(500).optional(),usedAt:stamp.optional(),termsUrl:z.url({protocol:/^https$/}).optional(),
});
export const portfolioSchema = z.strictObject({
  title:z.string().trim().min(2).max(80),objective:shortText,description:shortText,kind:mediaKind,
  previewAssetId:z.uuid().nullable(),outputFormats:tags.min(1),widthPx:z.number().int().min(1).max(4096).optional(),
  heightPx:z.number().int().min(1).max(4096).optional(),durationSec:z.number().min(1).max(120).optional(),
  outcomes:tags,styles:tags,modelRefs:z.array(modelRefSchema).max(20),workflow:z.array(workflowStepSchema).min(1).max(12),
  humanContribution:shortText,generationDisclosure:z.enum(['ai_generated','ai_assisted','no_ai','unknown']),
  modelDisclosureNote:z.string().max(2000),rightsOffer:rightsOfferSchema,
  artifactOrigin:z.enum(['creator_supplied','procedural_demo','simulated']),
}).superRefine((v,c) => {
  if(new Set(v.workflow.map(s=>s.id)).size!==v.workflow.length || new Set(v.workflow.map(s=>s.ordinal)).size!==v.workflow.length)
    c.addIssue({code:'custom',path:['workflow'],message:'Step IDs and order must be unique'});
  if(!v.modelRefs.length && !v.modelDisclosureNote.trim())
    c.addIssue({code:'custom',path:['modelDisclosureNote'],message:'Declare models or explain that none were used'});
  if(v.artifactOrigin==='procedural_demo' && v.generationDisclosure!=='no_ai')
    c.addIssue({code:'custom',path:['generationDisclosure'],message:'Procedural demo files must be labeled no AI'});
});
export const formatKinds: Record<string,string[]> = {image:['png','jpeg','webp'],video:['mp4'],audio:['wav','mp3'],text:['txt'],three_d:[]};
export const outputSchema = z.strictObject({
  id:z.uuid(),label:z.string().trim().min(1).max(80),kind:mediaKind,quantity:z.number().int().min(1).max(50),
  format:slug,widthPx:z.number().int().min(1).max(4096).optional(),heightPx:z.number().int().min(1).max(4096).optional(),
  aspectRatio:z.string().regex(/^[1-9]\d*:[1-9]\d*$/).optional(),durationSec:z.number().min(1).max(120).optional(),
  maxBytes:z.number().int().min(1).max(25_000_000),contentRequirements:shortText,
});
export const briefSchema = z.strictObject({
  schemaVersion:z.literal(1),title:z.string().trim().min(2).max(80),objective:shortText,audience:shortText,brandContext:shortText,
  outcomes:tags.min(1),styles:tags,preferredWorkflows:tags,requiredSkills:tags,requiredTools:tags,requiredModels:tags,languages:tags.min(1),
  outputs:z.array(outputSchema).min(1).max(10),budgetMinMinor:minor,budgetMaxMinor:minor,currency:z.string().regex(/^[A-Z]{3}$/),
  dueAt:stamp,revisionRounds:z.number().int().min(0).max(3),mustInclude:z.array(shortText).max(20),
  mustAvoid:z.array(shortText).max(20),referenceLinks:z.array(z.url({protocol:/^https$/})).max(20),
  referenceRightsDeclaration:shortText,rightsRequest:rightsRequestSchema,
});
export const briefDraftSchema=briefSchema.partial().extend({
 title:z.string().max(80).optional(),objective:z.string().max(2000).optional(),audience:z.string().max(2000).optional(),brandContext:z.string().max(2000).optional(),referenceRightsDeclaration:z.string().max(2000).optional(),
 outputs:z.array(outputSchema.partial().extend({label:z.string().max(80).optional(),contentRequirements:z.string().max(2000).optional()})).max(10).optional(),rightsRequest:rightsRequestSchema.partial().optional(),
});
export type BriefDraftV1=Partial<Omit<BriefV1,'outputs'|'rightsRequest'>>&{outputs?:Partial<OutputV1>[];rightsRequest?:Partial<RightsRequestV1>};
export const aiPatchSchema = z.strictObject({
  schemaVersion:z.literal(1),objectiveSuggestion:z.string().max(400),conceptSuggestion:z.string().max(400),
  questions:z.array(z.string().min(1).max(120)).max(3),
});
export const finalRightsSchema = z.strictObject({
  schemaVersion:z.literal(1),offer:rightsOfferSchema,modelRefs:z.array(modelRefSchema).max(20),
  inputs:z.array(z.strictObject({
    description:shortText,source:z.enum(['brand_provided','creator_original','third_party','generated']),
    commercialPermission:permission,release:z.enum(['not_applicable','declared_obtained','unknown']),evidenceAssetId:z.uuid().optional(),
  })).max(20),limitations:z.array(shortText).max(20),declaredAt:stamp,
});
export type CreatorInputV1 = z.infer<typeof creatorSchema>;
export type CapabilityV1 = z.infer<typeof capabilitySchema>;
export type PortfolioInputV1 = z.infer<typeof portfolioSchema>;
export type RightsOfferV1 = z.infer<typeof rightsOfferSchema>;
export type RightsRequestV1 = z.infer<typeof rightsRequestSchema>;
export type ModelRefV1 = z.infer<typeof modelRefSchema>;
export type BriefV1 = z.infer<typeof briefSchema>;
export type OutputV1 = z.infer<typeof outputSchema>;
export type AiBriefPatchV1 = z.infer<typeof aiPatchSchema>;
export type FinalRightsV1 = z.infer<typeof finalRightsSchema>;
export type RightsResult = 'compatible_declared'|'needs_review'|'blocked';
export type RequirementV1 = {id:string;outputId?:string;kind:'quantity'|'format'|'dimensions'|'duration'|'content'|'rights';expected:unknown;mode:'file_check'|'brand_review'|'declaration_review';required:boolean};
export type ValidationIssue = {path:string;message:string};
