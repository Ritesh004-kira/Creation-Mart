import { aiPatchSchema, briefSchema, formatKinds, type AiBriefPatchV1, type BriefV1, type RequirementV1, type ValidationIssue } from './contracts';
import { reducedRatio } from './capability-fit';
export function validateBriefForPublish(value:unknown,now=new Date()):ValidationIssue[] {
  const parsed=briefSchema.safeParse(value);
  if(!parsed.success) return parsed.error.issues.map(i=>({path:i.path.join('.'),message:i.message}));
  const b=parsed.data,issues:ValidationIssue[]=[];
  const add=(path:string,message:string)=>issues.push({path,message});
  if(b.budgetMinMinor>b.budgetMaxMinor) add('budgetMinMinor','Minimum budget cannot exceed maximum.');
  if(Date.parse(b.dueAt)<=now.getTime()) add('dueAt','Choose a future deadline.');
  if(new Set(b.outputs.map(o=>o.id)).size!==b.outputs.length) add('outputs','Output IDs must be unique.');
  b.outputs.forEach((o,i)=>{
    const path='outputs.'+i;
    if(!formatKinds[o.kind].includes(o.format)) add(path+'.format','Unsupported format for this output. 3D is metadata-only.');
    if(o.kind==='image'||o.kind==='video') {
      if(!o.widthPx||!o.heightPx||!o.aspectRatio) add(path+'.dimensions','Dimensions and aspect ratio are required.');
      else if(reducedRatio(o.widthPx,o.heightPx)!==o.aspectRatio) add(path+'.aspectRatio','Aspect ratio must match the reduced dimensions.');
    } else if(o.widthPx!==undefined||o.heightPx!==undefined||o.aspectRatio!==undefined) add(path+'.dimensions','Audio/text do not have visual dimensions.');
    if((o.kind==='audio'||o.kind==='video')&&!o.durationSec) add(path+'.durationSec','Duration is required.');
    if(o.kind==='video'&&(o.durationSec??0)>60) add(path+'.durationSec','Video delivery is limited to 60 seconds.');
    const caps:Record<string,number>={image:8_000_000,video:25_000_000,audio:10_000_000,text:256_000,three_d:0};
    if(o.maxBytes>caps[o.kind]) add(path+'.maxBytes','File limit exceeds the supported delivery limit.');
  });return issues;
}
export function compileRequirements(b:BriefV1):RequirementV1[] {
  const result:RequirementV1[]=[];
  for(const o of b.outputs) {
    const add=(code:RequirementV1['kind'],expected:unknown,mode:RequirementV1['mode'])=>result.push({id:o.id+':'+code,outputId:o.id,kind:code,expected,mode,required:true});
    add('quantity',o.quantity,'file_check');add('format',{format:o.format,maxBytes:o.maxBytes},'file_check');
    if(o.widthPx&&o.heightPx) add('dimensions',{widthPx:o.widthPx,heightPx:o.heightPx},'file_check');
    if(o.durationSec) add('duration',o.durationSec,'brand_review');
    add('content',{instructions:o.contentRequirements,mustInclude:b.mustInclude,mustAvoid:b.mustAvoid},'brand_review');
  }
  result.push({id:'brief:rights',kind:'rights',expected:b.rightsRequest,mode:'declaration_review',required:true});return result;
}
export function compileBrief(roughIdea:string,existing:Partial<BriefV1>={},now=new Date()) {
  const draft={...existing};
  if(!draft.objective&&roughIdea.trim()) draft.objective=roughIdea.trim().slice(0,2000);
  const issues=validateBriefForPublish(draft,now),fields=Object.keys(briefSchema.shape);
  const failed=new Set(issues.map(i=>i.path.split('.')[0]));
  const passed=fields.filter(f=>!failed.has(f)).length;
  const questions=issues.map(i=>i.path+': '+i.message);
  return {draft,questions,readiness:{passed,total:fields.length,percent:Math.round(passed/fields.length*100),publishable:issues.length===0,issues},mode:'template' as const};
}
export function applySuggestion(draft:Partial<BriefV1>,value:AiBriefPatchV1,acceptedFields:string[]):Partial<BriefV1> {
  const patch=aiPatchSchema.parse(value);
  return acceptedFields.includes('objectiveSuggestion')?{...draft,objective:patch.objectiveSuggestion}:{...draft};
}
