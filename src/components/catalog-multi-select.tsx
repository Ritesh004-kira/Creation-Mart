'use client';
export type CatalogTerm={kind:string;slug:string;label:string};
export function CatalogMultiSelect({label,name,terms,selected}:{label:string;name:string;terms:CatalogTerm[];selected:string[]}) {
  return <fieldset className="field" id={name}><legend>{label}</legend><div className="actions">{terms.map(t=><label key={t.slug} className="pill" style={{display:'flex',alignItems:'center',gap:8,fontWeight:400}}><input type="checkbox" name={name} value={t.slug} defaultChecked={selected.includes(t.slug)} style={{width:18,height:18}}/>{t.label}</label>)}</div></fieldset>;
}

