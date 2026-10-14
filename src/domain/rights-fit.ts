import type { FinalRightsV1, ModelRefV1, RightsOfferV1, RightsRequestV1, RightsResult } from './contracts';
export type CatalogModel = {slug:string;commercial:boolean|null;conditionCodes:string[]};
export type RightsRule = {code:string;expected:string;sourceKind:string;sourceId:string;outcome:RightsResult;explanation:string};
export type RightsReceiptV1 = {schemaVersion:1;overall:RightsResult;basis:'declarations_and_references';rules:RightsRule[];generatedAt:string};
const severity:Record<RightsResult,number>={compatible_declared:0,needs_review:1,blocked:2};
const permissions=['commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse'] as const;
export function evaluateRights(request:RightsRequestV1,offer:RightsOfferV1,pipeline:ModelRefV1[],catalog:CatalogModel[],final?:FinalRightsV1,now=new Date()):RightsReceiptV1 {
  const rules:RightsRule[]=[];
  const add=(code:string,expected:string,sourceKind:string,sourceId:string,outcome:RightsResult,explanation:string)=>rules.push({code,expected,sourceKind,sourceId,outcome,explanation});
  const compare=(o:RightsOfferV1,source:string) => {
    for(const p of permissions) if(request[p]) add(p,'permission allowed','creator_declaration',source,o[p]===false?'blocked':o[p]===null?'needs_review':'compatible_declared',o[p]===false?'Creator explicitly declines this use.':o[p]===null?'Permission is unknown.':'Creator declares this permission.');
    if(o.attribution==='required'&&!request.attributionAccepted) add('attribution','no required attribution','creator_declaration',source,'blocked','Required attribution is not accepted.');
    else if(o.attribution==='unknown') add('attribution','known attribution terms','creator_declaration',source,'needs_review','Attribution terms are unknown.');
    const covers=o.territories.includes('WORLD')||request.territories.every(t=>o.territories.includes(t));
    add('territory',request.territories.join(', '),'creator_declaration',source,!o.territories.length?'needs_review':covers?'compatible_declared':'blocked',!o.territories.length?'Territory is unknown.':covers?'Declared territory covers the requested use.':'Declared territory does not cover the requested use.');
    add('term',request.termDays+' days','creator_declaration',source,o.maxTermDays===null?'needs_review':o.maxTermDays<request.termDays?'blocked':'compatible_declared',o.maxTermDays===null?'Term is unknown.':o.maxTermDays<request.termDays?'Offered term is shorter than requested.':'Declared term covers the request.');
    add('third_party','input permission','creator_declaration',source,o.thirdPartyStatus==='restricted'?'blocked':o.thirdPartyStatus==='unknown'?'needs_review':'compatible_declared',o.thirdPartyStatus==='clear_declared'?'Input clearance is declared, not independently verified.':'Input clearance needs resolution.');
    if(o.restrictions.length) add('restrictions','review stated restrictions','creator_declaration',source,'needs_review',o.restrictions.join('; '));
  };
  const checkModels=(refs:ModelRefV1[],prefix:string) => {
    for(const model of refs) {
      const entry=catalog.find(m=>m.slug===model.catalogSlug);const source=model.catalogSlug??model.customName??'unknown';
      if(!entry) {add('model_conditions','known usage terms','catalog_reference',prefix+source,'needs_review','Model conditions are not cataloged.');continue;}
      if(request.commercial&&entry.commercial!==true) add('model_commercial','commercial use','catalog_reference',prefix+source,entry.commercial===false?'blocked':'needs_review','Publisher commercial conditions need review.');
      for(const code of entry.conditionCodes) {
        const blocked=(code==='no_paid_ads'&&request.paidAds)||(code==='no_training_use'&&request.trainingUse)||(code==='no_modifications'&&request.modifications);
        if(blocked) add(code,'requested use permitted','catalog_reference',prefix+source,'blocked','Publisher explicitly prohibits the requested use.');
        else if(!['no_paid_ads','no_training_use','no_modifications'].includes(code)) add(code,'conditions satisfied','catalog_reference',prefix+source,'needs_review','Document the applicable publisher conditions.');
      }
    }
  };
  compare(offer,'proposed_offer');checkModels(pipeline,'proposed:');
  if(final) {
    compare(final.offer,'final_offer');checkModels(final.modelRefs,'final:');
    final.inputs.forEach((input,i)=>{
      if(request.commercial) add('final_input_commercial','commercial input permission','final_declaration',String(i),input.commercialPermission===false?'blocked':input.commercialPermission===null?'needs_review':'compatible_declared','Input permission is declared for this delivered version.');
      if(input.release==='unknown') add('final_release','required release documented','final_declaration',String(i),'needs_review','Release status is unknown.');
    });
    if(final.limitations.length) add('final_limitations','limitations reviewed','final_declaration','final','needs_review',final.limitations.join('; '));
  }
  return {schemaVersion:1,overall:rules.reduce<RightsResult>((r,x)=>severity[x.outcome]>severity[r]?x.outcome:r,'compatible_declared'),basis:'declarations_and_references',rules,generatedAt:now.toISOString()};
}
