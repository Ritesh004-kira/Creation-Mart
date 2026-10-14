import { z } from 'zod';
const text = (max: number) => z.string().trim().max(max).default('');
const email = z.union([z.literal(''), z.email()]).default('');
const phone = z.union([z.literal(''), z.string().regex(/^\+?[0-9 ()-]{7,40}$/)]).default('');
const link = z.union([z.literal(''), z.url({ protocol: /^https$/ }).max(500)]).default('');
export const contactSchema = z.strictObject({
  contactName: text(120), jobTitle: text(120), email, alternateEmail: email, phone, whatsapp: phone,
  preferredChannel: z.enum(['', 'email', 'phone', 'whatsapp']).default(''),
  website: link, linkedin: link, instagram: link, addressLine1: text(200), addressLine2: text(200),
  city: text(120), region: text(120), postalCode: text(120),
  country: z.union([z.literal(''), z.string().regex(/^[A-Z]{2}$/)]).default(''),
});
export const contactSaveSchema = z.strictObject({ input: contactSchema, sharing: z.enum(['private','selected','applicants']), expectedVersion: z.number().int().min(0) });
export type Contact = z.infer<typeof contactSchema>;
export type ContactRecord = { payload: Contact; sharing: 'private'|'selected'|'applicants'; version: number };
export type CustomerDetails = { company: { companyName:string; industry:string; audience:string; tone:string; country:string }; contact:Contact|null; contactVisible:boolean; contactUpdatedAt:string|null };
