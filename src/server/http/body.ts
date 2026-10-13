import { HttpError } from './errors';
export async function readJsonBody(request:Request):Promise<unknown> {
  const text=await request.text();
  if(new TextEncoder().encode(text).length>32000)throw new HttpError('UPLOAD_TOO_LARGE',413,'Request is too large.');
  try{return JSON.parse(text);}catch{throw new HttpError('VALIDATION_FAILED',400,'Send a valid JSON request.');}
}
