import { HttpError } from './errors';
export async function readJsonBody(request:Request):Promise<unknown> {
  const reader=request.body?.getReader();
  if(!reader)throw new HttpError('VALIDATION_FAILED',400,'Send a valid JSON request.');
  const chunks:Uint8Array[]=[];let bytes=0;
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;
      if(bytes>32000){try{await reader.cancel();}catch{}throw new HttpError('UPLOAD_TOO_LARGE',413,'Request is too large.');}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const data=new Uint8Array(bytes);let offset=0;
  for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));}
  catch{throw new HttpError('VALIDATION_FAILED',400,'Send a valid UTF-8 JSON request.');}
}
