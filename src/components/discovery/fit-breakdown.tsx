import type { ScoreTerm } from '@/domain/fit-score';
export function FitBreakdown({score,terms,reasons}:{score:number;terms:ScoreTerm[];reasons:string[]}){
 return <details><summary>{score.toFixed(1)} / 100 brief fit · See why</summary><p className="muted">A heuristic comparison with your brief, based on declared capabilities and evidence completeness.</p><ul>{reasons.map(r=><li key={r}>{r}</li>)}</ul><table><thead><tr><th>Dimension</th><th>Coverage</th><th>Weight</th></tr></thead><tbody>{terms.map(t=><tr key={t.name}><td>{t.name}</td><td>{t.applicable?t.numerator+' / '+t.denominator:'Not requested'}</td><td>{t.applicable?t.weight:'Omitted'}</td></tr>)}</tbody></table></details>;
}
