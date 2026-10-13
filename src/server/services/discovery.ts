import { serverSupabase } from '@/server/supabase';
import type { DiscoveryFilters } from '@/domain/contracts/discovery';
import { rpcError } from '@/server/http/rpc-error';
export type DiscoveryResult={items:CreatorMatch[];total:number;appliedFilters:DiscoveryFilters;matchedAliases:{alias:string;kind:string;slug:string}[];rankingVersion:string;requestId:string};
export type CreatorMatch={id:string;slug:string;displayName:string;headline:string;available:boolean;currency:string;minimumPriceMinor:number;isDemo:boolean;fit:number|null;terms:import('@/domain/fit-score').ScoreTerm[]|null;rightsReceipt:import('@/domain/rights-fit').RightsReceiptV1|null;reasons:string[];portfolioIds:string[]};
export async function discover(filters:DiscoveryFilters,briefId:string|null,page=1,pageSize=12):Promise<DiscoveryResult>{
 const db=await serverSupabase(),{data,error}=await db.rpc('search_creators',{p_filters:filters,p_brief:briefId,p_page:page,p_page_size:pageSize});if(error)rpcError(error);return data;
}
