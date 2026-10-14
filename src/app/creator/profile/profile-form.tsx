'use client';
import { trackedFetch } from '@/lib/tracked-fetch';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CapabilityEditor } from '@/components/creator/capability-editor';
import { CatalogMultiSelect,type CatalogTerm } from '@/components/catalog-multi-select';
import { RightsEditor } from '@/components/rights/rights-editor';
import { creatorSchema,type CreatorInputV1,type CapabilityV1,type RightsOfferV1 } from '@/domain/contracts';
type Profile=Partial<CreatorInputV1>&{version:number};
export function ProfileForm({initial,catalog}:{initial:Profile;catalog:CatalogTerm[]}) {
  const router=useRouter(),[version,setVersion]=useState(initial.version),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const initialCaps=initial.capabilities?.length?initial.capabilities:[{kind:'image',formats:['png'],aspectRatios:['1:1'],maxWidthPx:1080,maxHeightPx:1080,maxDurationSec:null} as CapabilityV1];
  const [caps,setCaps]=useState(initialCaps);
  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setSaved(false);setError('');const f=new FormData(e.currentTarget);
    const value=(key:string)=>String(f.get(key)??'').trim(),list=(key:string)=>f.getAll(key).map(String);
    const rights:Record<string,unknown>={schemaVersion:1,declaredAt:new Date().toISOString()};
    for(const key of ['commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse'])rights[key]=value('rights.'+key)==='unknown'?null:value('rights.'+key)==='true';
    for(const key of ['attribution','thirdPartyStatus','declarationText'])rights[key]=value('rights.'+key);
    rights.territories=value('rights.territories').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
    rights.maxTermDays=value('rights.maxTermDays')?Number(value('rights.maxTermDays')):null;
    rights.restrictions=value('rights.restrictions').split('\n').map(s=>s.trim()).filter(Boolean);
    const body={displayName:value('displayName'),headline:value('headline'),bio:value('bio'),country:value('country'),timezone:value('timezone'),
      languages:list('languages'),specialties:list('specialties'),skills:list('skills'),outcomes:list('outcomes'),styles:list('styles'),toolSlugs:list('toolSlugs'),modelSlugs:list('modelSlugs'),
      capabilities:caps,minimumPriceMinor:Math.round(Number(value('price'))*100),currency:value('currency'),available:value('available')==='on',deliveryDays:Number(value('deliveryDays')),rightsOffer:rights};
    const parsed=creatorSchema.safeParse(body);
    if(!parsed.success){setError(parsed.error.issues.map(i=>i.path.join('.')+': '+i.message).join(' · '));setBusy(false);return;}
    try{const r=await trackedFetch('/api/v1/me/creator',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:parsed.data,expectedVersion:version})});const data=await r.json();if(!r.ok)throw new Error(data.error?.message??'Could not save.');setVersion(data.data.version);setSaved(true);router.refresh();}catch(e){setError(e instanceof Error?e.message:'Could not save.');}finally{setBusy(false);}
  }
  return <form onSubmit={save} className="stack">{error&&<div role="alert" className="error"><strong>Check your profile</strong><p>{error}</p><button type="button" className="button button-secondary" onClick={()=>window.location.reload()}>Reload saved profile</button></div>}
    <section className="card"><h2>Your introduction</h2>{[['displayName','Your name',2,80],['headline','Production headline',10,120],['country','Country code',2,2],['timezone','Timezone',1,80]] .map(([key,label,min,max])=><div key={String(key)} className="field"><label htmlFor={String(key)}>{label} *</label><input id={String(key)} name={String(key)} required minLength={Number(min)} maxLength={Number(max)} defaultValue={String(initial[key as keyof Profile]??(key==='timezone'?'Asia/Kolkata':''))}/></div>)}
    <div className="field"><label htmlFor="bio">About your production practice *</label><textarea id="bio" name="bio" defaultValue={initial.bio} required minLength={30} maxLength={1500}/></div></section>
    <section className="card"><h2>Production skills</h2>{[['languages','Languages','language'],['specialties','Specialties','specialty'],['skills','Skills','skill'],['outcomes','Outcomes','outcome'],['styles','Styles','style'],['toolSlugs','Tools','tool'],['modelSlugs','Models','model']].map(([name,label,kind])=><CatalogMultiSelect key={name} name={name} label={label} terms={catalog.filter(c=>c.kind===kind)} selected={(initial[name as keyof Profile]??[]) as string[]}/>)}</section>
    <section className="card"><CapabilityEditor initial={initialCaps} onChange={setCaps}/></section>
    <section className="card"><h2>Quote and schedule</h2><div className="grid"><div className="field"><label htmlFor="price">Starting project quote *</label><input id="price" name="price" type="number" min={0.01} step={0.01} required defaultValue={initial.minimumPriceMinor?initial.minimumPriceMinor/100:''}/></div><div className="field"><label htmlFor="currency">Currency *</label><select id="currency" name="currency" defaultValue={initial.currency??'INR'}><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></select></div><div className="field"><label htmlFor="deliveryDays">Typical delivery days *</label><input id="deliveryDays" name="deliveryDays" type="number" min={1} max={90} required defaultValue={initial.deliveryDays??7}/></div></div><label><input name="available" type="checkbox" defaultChecked={initial.available} style={{width:20,height:20,marginRight:10}}/>Available for new briefs</label></section>
    <section className="card"><RightsEditor offer={(initial.rightsOffer??null) as RightsOfferV1|null}/></section>
    <div className="actions"><Button loading={busy} disabled={busy}>{busy?'Saving…':'Save profile'}</Button><span role="status">{saved?'Profile saved.':''}</span></div>
  </form>;
}
