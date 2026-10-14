import { SignInForm } from './sign-in-form';
import { safeReturnTo } from '@/server/http/return-to';
export default async function SignIn({searchParams}:{searchParams:Promise<{returnTo?:string;error?:string;mode?:string}>}) {
  const params=await searchParams;
  return <section className="narrow card stack auth-card"><div><div className="eyebrow">Welcome to Creation Mart</div><h1>Your next collaboration starts here.</h1><p className="muted">Publish your process, find the right fit, and deliver with confidence.</p></div>
    {params.error&&<p className="error" role="alert">Sign-in could not be completed. Please try again.</p>}
    <SignInForm returnTo={safeReturnTo(params.returnTo??null)} initialMode={params.mode==='signup'?'signup':'signin'}/></section>;
}
