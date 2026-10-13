import { redirect } from 'next/navigation';
import { requireUser } from '@/server/auth/require-user';
export default async function Dashboard(){const {account}=await requireUser();redirect(account?.role==='creator'?'/creator':account?.role==='brand'?'/brand':'/onboarding');}
