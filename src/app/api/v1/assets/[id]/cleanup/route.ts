import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { HttpError, errorResponse, sameOrigin } from '@/server/http/errors';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    sameOrigin(request);
    const { db } = await apiUser(), { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new HttpError('NOT_FOUND', 404, 'That upload is unavailable.');
    const { data, error } = await db.functions.invoke('finalize-asset', { body: { assetId: id, operation: 'cleanup' } });
    if (error) {
      if (error.context instanceof Response) { const problem = await error.context.json(); throw new HttpError(problem.error?.code ?? 'DEPENDENCY_UNAVAILABLE', error.context.status, problem.error?.message ?? 'The upload could not be removed.'); }
      throw new HttpError('DEPENDENCY_UNAVAILABLE', 503, 'The upload could not be removed. Try again.');
    }
    if (!data.data.object_deleted_at) throw new HttpError('DEPENDENCY_UNAVAILABLE', 503, 'Deletion could not be confirmed. Your space remains reserved; retry removal.');
    return Response.json({ data: { id, removed: true }, requestId });
  } catch (error) { return errorResponse(error, requestId); }
}
