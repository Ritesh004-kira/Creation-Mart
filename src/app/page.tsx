import { Hero } from '@/components/landing/hero';
import { BriefCopilot } from '@/components/landing/brief-copilot';
import { FitEngine } from '@/components/landing/fit-engine';
import { Trust } from '@/components/landing/trust';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Outcomes } from '@/components/landing/outcomes';
import { RightsPreview } from '@/components/landing/rights-preview';
import { Creators } from '@/components/landing/creators';
import { CtaBanner } from '@/components/landing/cta-banner';
import { discover } from '@/server/services/discovery';
import { serverSupabase } from '@/server/supabase';
export default async function Home(){
  const db=await serverSupabase();
  const [result,{data:catalog}]=await Promise.all([discover({},null,1,5).catch(()=>null),db.from('catalog_terms').select('kind,slug,label').eq('kind','specialty')]);
  return <div className="landing"><Hero/><BriefCopilot/><FitEngine/><Trust/><HowItWorks/><Outcomes/><RightsPreview/><Creators data={result} categories={catalog??[]}/><CtaBanner/></div>;
}
