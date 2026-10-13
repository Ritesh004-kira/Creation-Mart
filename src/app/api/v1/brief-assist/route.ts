import { z } from 'zod';
import { briefDraftSchema } from '@/domain/contracts';
import { compileBrief } from '@/domain/brief-compiler';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
export async function POST(request:Request){const requestId=crypto.randomUUID();try{
 sameOrigin(request);await apiUser('brand');const body=z.strictObject({roughIdea:z.string().max(2000),draft:briefDraftSchema.optional(),allowAi:z.boolean().default(false)}).safeParse(await readJsonBody(request));if(!body.success)throw new HttpError('VALIDATION_FAILED',400,'Check your production idea.');
 return Response.json({data:{...compileBrief(body.data.roughIdea,body.data.draft),optionalInference:'disabled'},requestId});
}catch(e){return errorResponse(e,requestId);}}
