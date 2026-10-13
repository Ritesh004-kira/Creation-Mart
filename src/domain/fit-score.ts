export type ScoreTerm={name:string;weight:number;value:number;applicable:boolean;numerator:number;denominator:number;evidenceIds:string[]};
export const fitWeights={outcomes:35,style:20,workflow:15,format:15,availability:5,evidence:10};
export function fitScore(terms:ScoreTerm[]):number {
  for(const t of terms) if(!Number.isFinite(t.value)||t.value<0||t.value>1||!Number.isFinite(t.weight)||t.weight<0) throw new Error('Invalid score component');
  const active=terms.filter(t=>t.applicable),denominator=active.reduce((n,t)=>n+t.weight,0);
  return denominator?Math.round(1000*active.reduce((n,t)=>n+t.weight*t.value,0)/denominator)/10:0;
}
