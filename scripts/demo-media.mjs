import { deflateSync } from 'node:zlib';
export function makePng(width=64,height=64,style=0) {
  const raw=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;for(let x=0;x<width;x++){const at=y*(width*4+1)+1+x*4;raw[at]=style?30:109;raw[at+1]=style?130:40;raw[at+2]=style?110:217;raw[at+3]=255;}}
  const crc=(b)=>{let n=0xffffffff;for(const v of b){n^=v;for(let k=0;k<8;k++)n=(n&1)?(n>>>1)^0xedb88320:n>>>1;}return (n^0xffffffff)>>>0;};
  const chunk=(type,data)=>{const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([name,data])),out.length-4);return out;};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export function makeWav(seconds=2,sampleRate=22050) {
 const samples=Math.round(seconds*sampleRate),out=Buffer.alloc(44+samples*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(sampleRate,24);out.writeUInt32LE(sampleRate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)out.writeInt16LE(Math.round(Math.sin(i/sampleRate*Math.PI*2*220)*4000*Math.min(1,i/(sampleRate*.05),(samples-i)/(sampleRate*.05))),44+i*2);
 return out;
}
