import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { HttpError, errorResponse } from '@/server/http/errors';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    await apiUser('brand');
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new HttpError('NOT_FOUND', 404, 'That assistance request is unavailable.');
    throw new HttpError('DEPENDENCY_UNAVAILABLE', 503, 'Optional inference is disabled. Continue with the template-assisted brief builder.', { optionalInference: false });
  } catch (error) { return errorResponse(error, requestId); }
}
