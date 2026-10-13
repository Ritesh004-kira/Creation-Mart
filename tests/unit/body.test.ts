import { it,expect } from 'vitest';
import { readJsonBody } from '../../src/server/http/body';
it('rejects invalid UTF-8 JSON',async()=>{const request=new Request('http://localhost:3000',{method:'POST',body:new Uint8Array([0xff,0xfe])});await expect(readJsonBody(request)).rejects.toMatchObject({status:400,code:'VALIDATION_FAILED'});});
it('bounds actual bytes across chunks and cancels an oversized stream',async()=>{
  let cancelled=false;
  const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(16000));c.enqueue(new Uint8Array(16001));},cancel(){cancelled=true;}});
  const request=new Request('http://localhost:3000',{method:'POST',body:stream,duplex:'half'} as RequestInit);
  await expect(readJsonBody(request)).rejects.toMatchObject({status:413,code:'UPLOAD_TOO_LARGE'});expect(cancelled).toBe(true);
});
it('accepts a bounded valid JSON document',async()=>expect(await readJsonBody(new Request('http://localhost:3000',{method:'POST',body:'{"ok":true}'}))).toEqual({ok:true}));
