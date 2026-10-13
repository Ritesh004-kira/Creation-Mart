import { trustedOrigins } from './app-origin';
export class HttpError extends Error {constructor(public code:string,public status:number,message:string,public fields?:unknown){super(message);}}
export function errorResponse(error:unknown,requestId:string) {
  if(error instanceof HttpError)return Response.json({error:{code:error.code,message:error.message,fields:error.fields,requestId}},{status:error.status});
  return Response.json({error:{code:'DEPENDENCY_UNAVAILABLE',message:'The service could not complete this action. Please try again.',requestId}},{status:503});
}
export function sameOrigin(request:Request) {
  const origin=request.headers.get('origin'),expected=new URL(request.url).origin;
  if(!origin||origin!==expected||!trustedOrigins().includes(expected))throw new HttpError('FORBIDDEN',403,'This action must come from Creation Mart.');
}
