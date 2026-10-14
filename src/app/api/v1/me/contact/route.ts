import { z } from 'zod';
import { contactSaveSchema } from '@/domain/contact';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError, errorResponse, sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function GET() {
  const requestId=crypto.randomUUID();
  try { const {db,user}=await apiUser(); const {data,error}=await db.from('account_contacts').select('payload,sharing,version,updated_at').eq('user_id',user.id).maybeSingle(); if(error)throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'Contact details could not be loaded.');return Response.json({data:data??{payload:{},sharing:'selected',version:0},requestId},{headers:{'Cache-Control':'private, no-store'}}); } catch(e){return errorResponse(e,requestId);}
}
export async function PATCH(request:Request) {
  const requestId=crypto.randomUUID();
  try {sameOrigin(request); const {db}=await apiUser();const parsed=contactSaveSchema.safeParse(await readJsonBody(request));if(!parsed.success)throw new HttpError('VALIDATION_FAILED',400,'Check your contact details.',parsed.error.flatten());const {data,error}=await db.rpc('save_contact',{p_input:parsed.data.input,p_sharing:parsed.data.sharing,p_expected_version:parsed.data.expectedVersion});if(error)rpcError(error);return Response.json({data,requestId},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e,requestId);}
}
export async function DELETE(request:Request) {
  const requestId=crypto.randomUUID();
  try {sameOrigin(request);const {db}=await apiUser();const parsed=z.strictObject({expectedVersion:z.number().int().nonnegative()}).safeParse(await readJsonBody(request));if(!parsed.success)throw new HttpError('VALIDATION_FAILED',400,'Reload your current contact details.');const {data,error}=await db.rpc('save_contact',{p_input:{},p_sharing:'private',p_expected_version:parsed.data.expectedVersion});if(error)rpcError(error);return Response.json({data,requestId},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e,requestId);}
}
