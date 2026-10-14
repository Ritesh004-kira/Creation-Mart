import Link from 'next/link';
import { requireRole } from '@/server/auth/require-user';
import { ProfileForm } from './profile-form';
import type { CreatorInputV1 } from '@/domain/contracts';
export default async function Profile(){
  const {db,user}=await requireRole('creator','/creator/profile');
  const [{data:p,error},{data:catalog,error:catalogError}]=await Promise.all([db.from('creator_profiles').select('*').eq('user_id',user.id).single(),db.from('catalog_terms').select('kind,slug,label').order('label')]);
  if(error||catalogError)throw new Error('Profile unavailable.');
  const initial={displayName:p.display_name,headline:p.headline,bio:p.bio,country:p.country,timezone:p.timezone,languages:p.languages,specialties:p.specialties,skills:p.skills,outcomes:p.outcomes,styles:p.styles,toolSlugs:p.tool_slugs,modelSlugs:p.model_slugs,capabilities:p.capabilities,minimumPriceMinor:p.minimum_price_minor,currency:p.currency,available:p.available,deliveryDays:p.delivery_days,rightsOffer:p.rights_offer,version:p.version} as CreatorInputV1&{version:number};
  return <div className="stack"><Link href="/creator">← Back to creator dashboard</Link><div><div className="eyebrow">Creator workspace</div><h1>Your production profile</h1><p className="muted">Describe what you can deliver and the usage conditions you offer.</p></div><ProfileForm initial={initial} catalog={catalog??[]}/></div>;
}
