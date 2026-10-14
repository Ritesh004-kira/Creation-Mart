import { describe,it,expect } from 'vitest';
import { contactSchema } from '../../src/domain/contact';
import { generatedBriefDraft,generatedBriefSchema } from '../../src/domain/ai-assistance';
import { brief } from './fixtures';
describe('Contact validation',()=>{
  it('allows cleared fields while rejecting ownership, unsafe links and bad email',()=>{expect(contactSchema.parse({}).email).toBe('');expect(contactSchema.safeParse({user_id:'other'}).success).toBe(false);expect(contactSchema.safeParse({website:'javascript:alert(1)'}).success).toBe(false);expect(contactSchema.safeParse({email:'broken'}).success).toBe(false);expect(contactSchema.safeParse({phone:'+91 9000000000'}).success).toBe(true);});
});
const generated={...brief,outputs:brief.outputs.map(o=>({label:o.label,kind:o.kind,format:o.format,quantity:o.quantity,widthPx:o.widthPx??null,heightPx:o.heightPx??null,durationSec:o.durationSec??null,maxBytes:o.maxBytes,contentRequirements:o.contentRequirements})),summary:'Production suggestion.',questions:[],warnings:[]};
const catalog=Object.entries({outcomes:'outcome',styles:'style',preferredWorkflows:'workflow',requiredSkills:'skill',requiredTools:'tool',requiredModels:'model',languages:'language'}).flatMap(([field,kind])=>(brief[field as keyof typeof brief] as string[]).map(slug=>({kind,slug})));
describe('AI draft safety',()=>{
  it('preserves existing financial, rights and private reference choices and output IDs',()=>{const {schemaVersion:_version,...model}=generated;const value=generatedBriefSchema.parse({...model,budgetMinMinor:5000,rightsRequest:{...brief.rightsRequest,trainingUse:true}});const result=generatedBriefDraft(value,{...brief,referenceLinks:['https://example.test/private']},catalog);expect(result.draft.budgetMinMinor).toBe(brief.budgetMinMinor);expect(result.draft.rightsRequest).toEqual(brief.rightsRequest);expect(result.draft.referenceLinks).toEqual(['https://example.test/private']);expect(result.draft.outputs?.[0].id).toBe(brief.outputs[0].id);});
  it('rejects fabricated catalog entries rather than publishing them',()=>{const {schemaVersion:_version,...model}=generated;const value=generatedBriefSchema.parse({...model,requiredTools:['fictional-tool']});expect(()=>generatedBriefDraft(value,{},catalog)).toThrow('unsupported catalog');});
});
