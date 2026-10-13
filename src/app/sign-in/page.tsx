import { SignInForm } from './sign-in-form';
import { safeReturnTo } from '@/server/http/return-to';
export default async function SignIn({searchParams}:{searchParams:Promise<{returnTo?:string;error?:string}>}) {
  const params=await searchParams;
  return <section className="narrow card stack"><div><div className="eyebrow">Welcome to Creation Mart</div><h1>Sign in to get started</h1><p className="muted">One account. Choose your creator or brand role once after signing in.</p></div>
    {params.error&&<p className="error" role="alert">Sign-in could not be completed. Please try again.</p>}
    <SignInForm returnTo={safeReturnTo(params.returnTo??null)}/></section>;
}
