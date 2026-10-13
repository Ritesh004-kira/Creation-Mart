import { z } from 'zod';
import { parseDiscoveryParams } from '@/domain/contracts/discovery';
import { discover } from '@/server/services/discovery';
import { HttpError,errorResponse } from '@/server/http/errors';
export async function GET(request:Request){const requestId=crypto.randomUUID();try{
 const params=new URL(request.url).searchParams;let filters;try{filters=parseDiscoveryParams(params);}catch{throw new HttpError('VALIDATION_FAILED',400,'Check your search filters.');}
 const briefId=params.get('briefId'),page=Number(params.get('page')??1);if(briefId&&!z.uuid().safeParse(briefId).success||!Number.isInteger(page)||page<1||page>100)throw new HttpError('VALIDATION_FAILED',400,'Check your brief context and page.');
 return Response.json({data:await discover(filters,briefId,page),requestId},{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e,requestId);}}
