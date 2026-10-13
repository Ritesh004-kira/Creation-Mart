export function safeReturnTo(value:string|null):string {
  if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||/[\u0000-\u0020]/.test(value))return '/dashboard';
  const allowed=['/dashboard','/onboarding','/creator','/brand','/creators','/briefs','/portfolio','/engagements'];
  const path=value.split(/[?#]/)[0];
  if(path.includes('%')||path.split('/').some(segment=>segment==='.'||segment==='..'))return '/dashboard';
  return allowed.some(p=>path===p||path.startsWith(p+'/'))?value:'/dashboard';
}
