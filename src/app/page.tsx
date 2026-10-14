import { Hero } from '@/components/landing/hero';
import { BriefCopilot } from '@/components/landing/brief-copilot';
import { FitEngine } from '@/components/landing/fit-engine';
import { Trust } from '@/components/landing/trust';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Outcomes } from '@/components/landing/outcomes';
import { RightsDemo } from '@/components/landing/rights-demo';
import { Creators } from '@/components/landing/creators';
import { CtaBanner } from '@/components/landing/cta-banner';
import { discover } from '@/server/services/discovery';
import { serverSupabase } from '@/server/supabase';
export default async function Home(){
  const db=await serverSupabase();
  const [result,{data:catalog},{data:items}]=await Promise.all([discover({},null,1,5).catch(()=>null),db.from('catalog_terms').select('kind,slug,label').eq('kind','specialty'),db.from('portfolio_items').select('id,preview_asset_id,media_kind').eq('published',true).limit(100)]);
  const previews=Object.fromEntries((items??[]).filter(i=>i.preview_asset_id).map(i=>[i.id,{id:i.preview_asset_id!,kind:i.media_kind}]));
  return <div className="landing"><Hero/><BriefCopilot/><FitEngine/><Trust/><HowItWorks/><Outcomes/><RightsDemo/><Creators data={result} categories={catalog??[]} previews={previews}/><CtaBanner/></div>;
}
