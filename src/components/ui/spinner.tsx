export function Spinner({label='Loading',className=''}:{label?:string;className?:string}){
  return <span role="status" className={'loading-indicator '+className}><span className="spinner" aria-hidden="true"/><span className="sr-only">{label}</span></span>;
}

export function LoadingState({label='Loading your workspace…',compact=false}:{label?:string;compact?:boolean}){
  return <div role="status" aria-live="polite" className={'loading-state '+(compact?'loading-state-compact':'')}><span className="spinner" aria-hidden="true"/><span>{label}</span></div>;
}
