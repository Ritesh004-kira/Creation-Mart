import { redirect } from 'next/navigation';
import { requireUser } from '@/server/auth/require-user';
import { OnboardingForm } from './onboarding-form';
export default async function Onboarding(){const {account}=await requireUser('/onboarding');if(account?.role)redirect('/dashboard');return <section className="narrow card"><div className="eyebrow">Choose your path</div><h1>What brings you here?</h1><p className="muted">Your role is assigned once. It determines which projects and actions you can access.</p><OnboardingForm/></section>;}
