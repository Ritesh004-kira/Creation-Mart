// Keep native fetch semantics while sharing request progress across client views.
export async function trackedFetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('creation-request',{detail:1}));
  try{return await fetch(input,init);}
  finally{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('creation-request',{detail:-1}));}
}
