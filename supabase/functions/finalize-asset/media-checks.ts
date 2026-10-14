export type MediaFacts={mime:string;widthPx:number|null;heightPx:number|null;checkedDurationSec:number|null};
const ascii=(b:Uint8Array,start:number,len:number)=>String.fromCharCode(...b.slice(start,start+len));
export function inspectMedia(bytes:Uint8Array,format:string):MediaFacts {
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),size=bytes.length;
  const facts:MediaFacts={mime:'',widthPx:null,heightPx:null,checkedDurationSec:null};
  const fail=()=>{throw new Error('The file header or structure does not match the selected format.');};
  const dimensions=(w:number,h:number)=>{if(!w||!h||w>4096||h>4096||w*h>16_000_000)throw new Error('Image dimensions exceed the supported limit.');facts.widthPx=w;facts.heightPx=h;};
  if(format==='png'){
    if(size<45||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v)||ascii(bytes,12,4)!=='IHDR'||view.getUint32(8)!==13)fail();
    dimensions(view.getUint32(16),view.getUint32(20));let at=8,hasData=false,ended=false;
    while(at+12<=size){const n=view.getUint32(at),type=ascii(bytes,at+4,4);if(n>size-at-12)fail();if(type==='IDAT'&&n>0)hasData=true;if(type==='IEND'){if(n!==0||at+12!==size)fail();ended=true;break;}at+=12+n;}
    if(!ended||!hasData)fail();facts.mime='image/png';
  }else if(format==='jpeg'){
    if(size<10||bytes[0]!==255||bytes[1]!==216||bytes[size-2]!==255||bytes[size-1]!==217)fail();
    let at=2,found=false;
    while(at+4<size){if(bytes[at++]!==255)fail();while(bytes[at]===255)at++;const marker=bytes[at++];if(marker===218)break;const n=view.getUint16(at);if(n<2||at+n>size)fail();if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(n<8)fail();dimensions(view.getUint16(at+5),view.getUint16(at+3));found=true;break;}at+=n;}
    if(!found)fail();facts.mime='image/jpeg';
  }else if(format==='webp'){
    if(size<30||ascii(bytes,0,4)!=='RIFF'||ascii(bytes,8,4)!=='WEBP'||view.getUint32(4,true)+8!==size)fail();
    const type=ascii(bytes,12,4);
    if(type==='VP8X')dimensions(1+bytes[24]+bytes[25]*256+bytes[26]*65536,1+bytes[27]+bytes[28]*256+bytes[29]*65536);
    else if(type==='VP8L'){if(bytes[20]!==47)fail();const n=view.getUint32(21,true);dimensions(1+(n&16383),1+((n>>>14)&16383));}
    else if(type==='VP8 '){if(bytes[23]!==157||bytes[24]!==1||bytes[25]!==42)fail();dimensions(view.getUint16(26,true)&16383,view.getUint16(28,true)&16383);}
    else fail();facts.mime='image/webp';
  }else if(format==='wav'){
    if(size<44||ascii(bytes,0,4)!=='RIFF'||ascii(bytes,8,4)!=='WAVE'||view.getUint32(4,true)+8!==size)fail();
    let at=12,rate=0,channels=0,bits=0,dataBytes=0;
    while(at+8<=size){const type=ascii(bytes,at,4),n=view.getUint32(at+4,true);if(n>size-at-8)fail();if(type==='fmt '){if(n<16||![1,3].includes(view.getUint16(at+8,true)))fail();channels=view.getUint16(at+10,true);rate=view.getUint32(at+12,true);bits=view.getUint16(at+22,true);}if(type==='data')dataBytes+=n;at+=8+n+(n%2);}
    if(channels<1||channels>2||rate<8000||rate>192000||![8,16,24,32].includes(bits)||!dataBytes)fail();
    facts.checkedDurationSec=dataBytes/(rate*channels*(bits/8));if(facts.checkedDurationSec>120)throw new Error('Audio is limited to 120 seconds.');facts.mime='audio/wav';
  }else if(format==='mp3'){
    let at=0;if(ascii(bytes,0,3)==='ID3'){if(size<10||bytes.slice(6,10).some(n=>n>127))fail();at=10+((bytes[6]<<21)|(bytes[7]<<14)|(bytes[8]<<7)|bytes[9]);}
    if(at+4>=size||bytes[at]!==255||(bytes[at+1]&224)!==224||((bytes[at+1]>>3)&3)===1||((bytes[at+1]>>1)&3)===0||((bytes[at+2]>>4)&15)===15||((bytes[at+2]>>2)&3)===3)fail();facts.mime='audio/mpeg';
  }else if(format==='mp4'){
    if(size<24||ascii(bytes,4,4)!=='ftyp'||view.getUint32(0)<16)fail();
    let at=0,moov=false,mdat=false;
    while(at+8<=size){let n=view.getUint32(at);const type=ascii(bytes,at+4,4);if(n===1){if(at+16>size)fail();n=Number(view.getBigUint64(at+8));}else if(n===0)n=size-at;if(n<8||n>size-at)fail();if(type==='moov')moov=true;if(type==='mdat'&&n>8)mdat=true;at+=n;}
    if(!moov||!mdat||at!==size)fail();facts.mime='video/mp4';
  }else if(format==='txt'||format==='json'){
    let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('Text must be valid UTF-8.');}
    if(!text.trim()||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))fail();
    if(format==='json'){let data:unknown;try{data=JSON.parse(text);}catch{throw new Error('The evidence file must contain valid JSON.');}
      if(!data||typeof data!=='object')fail();const stack:{v:unknown;depth:number}[]=[{v:data,depth:0}];let count=0;
      while(stack.length){const {v,depth}=stack.pop()!;if(++count>20000||depth>50)throw new Error('The JSON document is too complex.');if(v&&typeof v==='object')for(const child of Object.values(v))stack.push({v:child,depth:depth+1});}
    }facts.mime=format==='txt'?'text/plain':'application/json';
  }else throw new Error('This format is not supported.');
  return facts;
}
