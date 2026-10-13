import type { BriefV1, CapabilityV1, CreatorInputV1, OutputV1 } from './contracts';
export function reducedRatio(width:number,height:number):string {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1) throw new Error('Invalid dimensions');
  let a=width,b=height;while(b){const t=b;b=a%b;a=t;}return width/a+':'+height/a;
}
export function supportsOutput(caps:CapabilityV1[],out:OutputV1):boolean {
  return caps.some(c => c.kind===out.kind && c.formats.includes(out.format)
    && (!out.aspectRatio||c.aspectRatios.includes(out.aspectRatio))
    && (out.widthPx===undefined||(c.maxWidthPx!==null&&c.maxWidthPx>=out.widthPx))
    && (out.heightPx===undefined||(c.maxHeightPx!==null&&c.maxHeightPx>=out.heightPx))
    && (out.durationSec===undefined||(c.maxDurationSec!==null&&c.maxDurationSec>=out.durationSec)));
}
export function supportsBrief(c:CreatorInputV1,b:BriefV1,now=new Date()):boolean {
  return b.outputs.every(o=>supportsOutput(c.capabilities,o))
    && b.requiredSkills.every(t=>c.skills.includes(t)) && b.requiredTools.every(t=>c.toolSlugs.includes(t))
    && b.requiredModels.every(t=>c.modelSlugs.includes(t)) && b.languages.some(t=>c.languages.includes(t))
    && c.currency===b.currency && c.minimumPriceMinor<=b.budgetMaxMinor
    && c.available && now.getTime()+c.deliveryDays*86400000<=Date.parse(b.dueAt);
}
