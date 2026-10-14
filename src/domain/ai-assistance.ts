import { z } from 'zod';
import { briefDraftSchema, rightsRequestSchema, type BriefDraftV1 } from './contracts';
import { compileBrief } from './brief-compiler';
import { reducedRatio } from './capability-fit';

const tags=z.array(z.string().min(1).max(80)).max(20);
export const generatedBriefSchema=z.strictObject({
  title:z.string().min(2).max(80),objective:z.string().min(1).max(2000),audience:z.string().min(1).max(2000),brandContext:z.string().min(1).max(2000),
  outcomes:tags,styles:tags,preferredWorkflows:tags,requiredSkills:tags,requiredTools:tags,requiredModels:tags,languages:tags,
  outputs:z.array(z.strictObject({label:z.string().min(1).max(80),kind:z.enum(['image','video','audio','text']),format:z.enum(['png','jpeg','webp','mp4','wav','mp3','txt']),quantity:z.number().int().min(1).max(50),widthPx:z.number().int().min(1).max(4096).nullable(),heightPx:z.number().int().min(1).max(4096).nullable(),durationSec:z.number().min(1).max(60).nullable(),maxBytes:z.number().int().min(1).max(25000000),contentRequirements:z.string().min(1).max(2000)})).min(1).max(10),
  budgetMinMinor:z.number().int().positive().max(1000000000).nullable(),budgetMaxMinor:z.number().int().positive().max(1000000000).nullable(),currency:z.string().regex(/^[A-Z]{3}$/).nullable(),dueAt:z.iso.datetime({offset:true}).nullable(),revisionRounds:z.number().int().min(0).max(3).nullable(),
  mustInclude:z.array(z.string().min(1).max(2000)).max(20),mustAvoid:z.array(z.string().min(1).max(2000)).max(20),referenceLinks:z.array(z.url({protocol:/^https$/})).max(20),referenceRightsDeclaration:z.string().max(2000),rightsRequest:rightsRequestSchema.nullable(),
  summary:z.string().min(1).max(1000),questions:z.array(z.string().min(1).max(300)).max(12),warnings:z.array(z.string().min(1).max(300)).max(12),
});
export const profileAnalysisSchema=z.strictObject({
  score:z.number().int().min(0).max(100),summary:z.string().min(1).max(1000),
  strengths:z.array(z.string().min(1).max(300)).max(8),
  suggestions:z.array(z.strictObject({field:z.enum(['headline','bio','portfolio','capabilities','skills','workflow']),priority:z.enum(['high','medium','low']),reason:z.string().min(1).max(300),action:z.string().min(1).max(500)})).max(10),
  rewrite:z.strictObject({headline:z.string().min(10).max(120),bio:z.string().min(30).max(1500)}),
  warnings:z.array(z.string().min(1).max(300)).max(8),
});
export type ProfileAnalysis=z.infer<typeof profileAnalysisSchema>;
export function generatedBriefDraft(value:z.infer<typeof generatedBriefSchema>,existing:BriefDraftV1,catalog:{kind:string;slug:string}[]) {
  const {summary,questions,warnings,outputs,...fields}=value;
  const draft:Record<string,unknown>={schemaVersion:1};
  for(const [key,item] of Object.entries(fields))if(item!==null)draft[key]=item;
  const kinds:Record<string,string>={outcomes:'outcome',styles:'style',preferredWorkflows:'workflow',requiredSkills:'skill',requiredTools:'tool',requiredModels:'model',languages:'language'};
  for(const [key,kind] of Object.entries(kinds)){const known=new Set(catalog.filter(t=>t.kind===kind).map(t=>t.slug));if((draft[key] as string[]).some(t=>!known.has(t)))throw new Error('Model returned an unsupported catalog value.');}
  draft.outputs=outputs.map((output,index)=>{
    const {widthPx,heightPx,durationSec,...rest}=output;
    return {...rest,id:existing.outputs?.[index]?.id??crypto.randomUUID(),...(output.kind==='image'||output.kind==='video'?{...(widthPx&&heightPx?{widthPx,heightPx,aspectRatio:reducedRatio(widthPx,heightPx)}:{})}:{}),...(durationSec&&(output.kind==='video'||output.kind==='audio')?{durationSec}:{})};
  });
  // Existing financial, scheduling and rights choices require deliberate manual edits.
  for(const key of ['budgetMinMinor','budgetMaxMinor','currency','dueAt','revisionRounds','rightsRequest','referenceLinks','referenceRightsDeclaration'] as const)if(existing[key]!==undefined)draft[key]=existing[key];
  const parsed=briefDraftSchema.parse(draft);const compiled=compileBrief('',parsed);
  return {draft:parsed,readiness:compiled.readiness,questions:[...questions,...compiled.questions].slice(0,32),warnings,summary,mode:'ai' as const};
}
