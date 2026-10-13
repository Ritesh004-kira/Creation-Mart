import { portfolioSchema, type PortfolioInputV1, type ValidationIssue } from './contracts';
export function validatePassport(item:unknown):ValidationIssue[] {
  const result=portfolioSchema.safeParse(item);
  if(!result.success)return result.error.issues.map(i=>({path:i.path.join('.'),message:i.message}));
  return result.data.previewAssetId?[]:[{path:'previewAssetId',message:'Upload a ready preview before publishing.'}];
}
export function summarizePassport(item:PortfolioInputV1) {
  return {origin:item.artifactOrigin,richWorkflow:item.workflow.length>=3,generationDisclosure:item.generationDisclosure,
    humanContribution:item.humanContribution,steps:[...item.workflow].sort((a,b)=>a.ordinal-b.ordinal),
    evidenceLabel:item.artifactOrigin==='simulated'?'Illustrative workflow':'Creator declared'};
}
