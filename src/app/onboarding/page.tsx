import { redirect } from 'next/navigation';
import { requireUser } from '@/server/auth/require-user';
import { OnboardingForm } from './onboarding-form';
import { safeReturnTo } from '@/server/http/return-to';
export default async function Onboarding({searchParams}:{searchParams:Promise<{returnTo?:string}>}){const {returnTo}=await searchParams;const destination=safeReturnTo(returnTo??null);const {account}=await requireUser('/onboarding?returnTo='+encodeURIComponent(destination));if(account?.role)redirect(destination==='/onboarding'?'/dashboard':destination);return <section className="narrow card"><div className="eyebrow">Choose your path</div><h1>What brings you here?</h1><p className="muted">Your role is assigned once. It determines which projects and actions you can access.</p><OnboardingForm returnTo={destination}/></section>;}
