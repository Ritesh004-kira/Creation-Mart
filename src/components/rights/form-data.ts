import type { RightsOfferV1 } from '@/domain/contracts';
export function readRightsOffer(f:FormData):RightsOfferV1 {
 const text=(k:string)=>String(f.get('rights.'+k)??'').trim(),offer:Record<string,unknown>={schemaVersion:1,declaredAt:new Date().toISOString()};
 for(const k of ['commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse'])offer[k]=text(k)==='unknown'?null:text(k)==='true';
 for(const k of ['attribution','thirdPartyStatus','declarationText'])offer[k]=text(k);
 offer.territories=text('territories').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);offer.maxTermDays=text('maxTermDays')?Number(text('maxTermDays')):null;offer.restrictions=text('restrictions').split('\n').map(s=>s.trim()).filter(Boolean);return offer as RightsOfferV1;
}
