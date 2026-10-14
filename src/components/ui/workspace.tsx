import Link from 'next/link';

export function WorkspaceHero({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:React.ReactNode}){
  return <header className="workspace-hero"><div className="workspace-hero-copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>{children&&<div className="actions">{children}</div>}</div><div className="workspace-hero-art" aria-hidden="true"><span/><span/><span/></div></header>;
}
export function WorkspaceStats({items}:{items:{label:string;value:number|string;detail?:string}[]}){
  return <div className="workspace-stats">{items.map((item,index)=><div className="stat-card" key={item.label}><span className="stat-index">0{index+1}</span><strong>{item.value}</strong><span>{item.label}</span>{item.detail&&<small>{item.detail}</small>}</div>)}</div>;
}
export function EmptyState({title,description,href,label}:{title:string;description:string;href?:string;label?:string}){
  return <div className="empty-state"><span className="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></svg></span><h3>{title}</h3><p>{description}</p>{href&&<Link className="button button-secondary" href={href}>{label??'Get started'} <span aria-hidden="true">↗</span></Link>}</div>;
}
export function StatusBadge({state}:{state:string}){
  return <span className="status-badge" data-state={state}><span aria-hidden="true"/>{state.replaceAll('_',' ')}</span>;
}
