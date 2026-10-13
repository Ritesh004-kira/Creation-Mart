import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { HttpError, errorResponse, sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; creatorId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    sameOrigin(request);
    const { db } = await apiUser('brand'), { id, creatorId } = await params;
    if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(creatorId).success) throw new HttpError('NOT_FOUND', 404, 'That candidate is unavailable.');
    const key = z.uuid().safeParse(request.headers.get('Idempotency-Key'));
    if (!key.success) throw new HttpError('VALIDATION_FAILED', 400, 'Send a valid action key.');
    const { data, error } = await db.rpc('shortlist_mutation', { p_brief: id, p_creator: creatorId, p_remove: true, p_key: key.data });
    if (error) rpcError(error);
    return Response.json({ data, requestId });
  } catch (error) { return errorResponse(error, requestId); }
}
