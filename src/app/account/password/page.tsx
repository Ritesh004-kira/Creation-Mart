import Link from 'next/link';
import { requireUser } from '@/server/auth/require-user';
import { PasswordForm } from './password-form';
export default async function PasswordPage(){
  await requireUser('/account/password');
  return <section className="narrow card stack"><div className="eyebrow">Account security</div><h1>Set a new password</h1><p className="muted">Choose a unique password for your Creation Mart account.</p><PasswordForm/><Link href="/dashboard">Back to your workspace</Link></section>;
}
