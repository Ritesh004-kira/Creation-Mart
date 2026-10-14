import 'server-only';
import { createHash } from 'node:crypto';
import { generateText, Output } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { getVercelOidcTokenSync } from '@vercel/oidc';
import type { z } from 'zod';
import type { apiUser } from '@/server/auth/api-user';
import { HttpError } from '@/server/http/errors';
import { rpcError } from '@/server/http/rpc-error';
type Db=Awaited<ReturnType<typeof apiUser>>['db'];
export const aiModel=()=>process.env.AI_GATEWAY_MODEL||'openai/gpt-4.1-mini';
export function aiConfigured(){
  if(process.env.AI_GATEWAY_API_KEY)return true;
  try{return Boolean(getVercelOidcTokenSync());}catch{return false;}
}
export async function runAssistance<T,R extends object>(db:Db,kind:'brief'|'profile',key:string,input:unknown,schema:z.ZodType<T>,system:string,prepare:(output:T)=>R,signal:AbortSignal) {
  if(!aiConfigured())throw new HttpError('AI_NOT_CONFIGURED',503,'AI assistance needs the production Vercel AI Gateway connection. Your saved work is safe.');
  const hash=createHash('sha256').update(JSON.stringify({kind,input,model:aiModel(),schemaVersion:1})).digest('hex');
  const {data:job,error}=await db.rpc('begin_ai_request',{p_kind:kind,p_key:key,p_hash:hash});
  if(error){if(error.message.includes('AI_RATE_LIMITED'))throw new HttpError('AI_RATE_LIMITED',429,'AI request limit reached or another request is running. Please try again later.');rpcError(error);}
  if(job.status==='succeeded')return {...job.result,jobId:job.id};
  if(job.status==='failed')throw new HttpError('AI_REQUEST_FAILED',503,'This AI request failed. Start a new request to retry.');
  // A replay cannot cause a second paid call while the original is running.
  if(job.request_hash!==hash)throw new HttpError('VERSION_CONFLICT',409,'The request changed. Start a new request.');
  if(!job.claimed)throw new HttpError('AI_IN_PROGRESS',409,'This request is already running. Check its result or start a new request after it expires.');
  try {
    const result=await generateText({model:gateway(aiModel()),output:Output.object({schema}),system,prompt:JSON.stringify(input),maxOutputTokens:4200,maxRetries:1,timeout:45_000,abortSignal:AbortSignal.any([signal,AbortSignal.timeout(50_000)]),providerOptions:{gateway:{tags:['creation-mart',kind]}}});
    const prepared=prepare(result.output);
    const response={...prepared,model:aiModel(),generationId:result.response.id,generatedAt:new Date().toISOString(),usage:{inputTokens:result.usage.inputTokens??0,outputTokens:result.usage.outputTokens??0},mode:'ai',jobId:job.id};
    const {error:saveError}=await db.rpc('finish_ai_request',{p_id:job.id,p_result:response,p_success:true});if(saveError)rpcError(saveError);
    return response;
  } catch(error) {
    const status=typeof error==='object'&&error!==null&&'statusCode' in error?Number(error.statusCode):0;
    const code=status===402?'AI_CREDITS_REQUIRED':status===401||status===403?'AI_CONNECTION_REQUIRED':signal.aborted?'AI_CANCELLED':'AI_GENERATION_FAILED';
    const message=code==='AI_CREDITS_REQUIRED'?'AI Gateway credits are unavailable. The project owner must replenish the Gateway balance.':code==='AI_CONNECTION_REQUIRED'?'The production AI Gateway connection requires configuration or verification.':code==='AI_CANCELLED'?'AI request cancelled.':'AI assistance could not finish. Retry; your original draft has not changed.';
    console.warn('Creation Mart AI request failed',{jobId:job.id,kind,code,status,errorType:error instanceof Error?error.name:'unknown'});
    await db.rpc('finish_ai_request',{p_id:job.id,p_result:{error:message,code},p_success:false});
    if(error instanceof HttpError)throw error;
    throw new HttpError(code,503,message);
  }
}
