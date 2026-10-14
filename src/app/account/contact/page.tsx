import Link from 'next/link';
import { requireUser } from '@/server/auth/require-user';
import { ContactForm } from '@/components/contact/contact-form';
import type { ContactRecord } from '@/domain/contact';
export default async function ContactPage() {
  const {db,user}=await requireUser('/account/contact');const {data,error}=await db.from('account_contacts').select('payload,sharing,version').eq('user_id',user.id).maybeSingle();if(error)throw new Error('Your contact information could not be loaded.');
  return <div className="stack"><Link href="/dashboard">← Back to workspace</Link><div><div className="eyebrow">Account privacy</div><h1>Manage your contact details</h1></div><ContactForm initial={(data??{payload:{},sharing:'selected',version:0}) as ContactRecord}/></div>;
}
