import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { HttpError,errorResponse } from '@/server/http/errors';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const requestId=crypto.randomUUID();
  try {const {id}=await params;if(!z.uuid().safeParse(id).success)throw new HttpError('NOT_FOUND',404,'Engagement unavailable.');const {db,user}=await apiUser();const {data:engagement,error}=await db.from('engagements').select('creator_id,brand_id').eq('id',id).maybeSingle();if(error)throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'The collaborator could not be loaded.');if(!engagement||![engagement.creator_id,engagement.brand_id].includes(user.id))throw new HttpError('NOT_FOUND',404,'Engagement unavailable.');const subject=user.id===engagement.brand_id?engagement.creator_id:engagement.brand_id;const {data:contact,error:contactError}=await db.from('account_contacts').select('payload,updated_at').eq('user_id',subject).maybeSingle();if(contactError)throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'Contact information could not be loaded.');return Response.json({data:contact,requestId},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return errorResponse(e,requestId);}
}
