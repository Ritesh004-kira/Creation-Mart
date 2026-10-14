import { z } from 'zod';
import { apiUser } from '@/server/auth/api-user';
import { readJsonBody } from '@/server/http/body';
import { HttpError,errorResponse,sameOrigin } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
export async function POST(request:Request){const requestId=crypto.randomUUID();try{sameOrigin(request);const {db}=await apiUser('creator');const key=z.uuid().safeParse(request.headers.get('Idempotency-Key')),body=z.strictObject({itemId:z.uuid(),assertion:z.string().trim().min(1).max(500),evidenceAssetIds:z.array(z.uuid()).max(20)}).safeParse(await readJsonBody(request));if(!key.success||!body.success)throw new HttpError('VALIDATION_FAILED',400,'Check your evidence declaration.');const {data,error}=await db.rpc('create_claim',{p_item:body.data.itemId,p_assertion:body.data.assertion,p_evidence:body.data.evidenceAssetIds,p_key:key.data});if(error)rpcError(error);return Response.json({data,requestId});}catch(e){return errorResponse(e,requestId);}}
