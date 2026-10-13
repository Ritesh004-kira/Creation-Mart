import type { RightsReceiptV1 } from '@/domain/rights-fit';
export function RightsReceipt({receipt}:{receipt:RightsReceiptV1}){
 const label=receipt.overall==='blocked'?'Requested use blocked':receipt.overall==='needs_review'?'Needs rights review':'Declared usage compatible';
 return <section className="card"><h3>{label}</h3><p className="muted">Comparison of declarations and references. This is not licensing or legal clearance.</p><details><summary>Open rights receipt</summary><ul>{receipt.rules.map((r,i)=><li key={i}><strong>{r.code.replaceAll('_',' ')}</strong>: {r.explanation}<span className="pill">{r.outcome.replaceAll('_',' ')}</span><p className="muted">Basis: {r.sourceKind.replaceAll('_',' ')} · {r.sourceId}</p></li>)}</ul></details></section>;
}
