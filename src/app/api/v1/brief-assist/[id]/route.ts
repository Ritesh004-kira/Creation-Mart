import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { HttpError, errorResponse } from '@/server/http/errors';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const {db,user}=await apiUser('brand');
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new HttpError('NOT_FOUND', 404, 'That assistance request is unavailable.');
    const {data,error}=await db.from('ai_requests').select('id,status,result,created_at,completed_at').eq('id',id).eq('owner_id',user.id).eq('kind','brief').maybeSingle();
    if(error)throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'The assistance result could not be loaded.');
    if(!data)throw new HttpError('NOT_FOUND',404,'That assistance request is unavailable.');
    return Response.json({data,requestId},{headers:{'Cache-Control':'private, no-store'}});
  } catch (error) { return errorResponse(error, requestId); }
}
