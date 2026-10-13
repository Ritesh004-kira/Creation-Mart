import { chromium } from 'playwright';
import { mkdirSync,writeFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();mkdirSync('work/demo-media',{recursive:true});
try{
 for(const [name,width,height] of [['portrait',1080,1920],['landscape',1920,1080],['square',1080,1080]]){
  const encoded=await page.evaluate(async({width,height})=>{
   const mime=['video/mp4;codecs=avc1.42001E','video/mp4;codecs=avc1','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('This browser cannot record the required MP4 demo.');
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable.');
   const stream=canvas.captureStream(10),recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:250000}),chunks=[];
   const complete=new Promise(resolve=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=async()=>{const buffer=new Uint8Array(await new Blob(chunks,{type:'video/mp4'}).arrayBuffer());let binary='';for(let i=0;i<buffer.length;i+=8192)binary+=String.fromCharCode(...buffer.slice(i,i+8192));resolve(btoa(binary));};});
   let frame=0;const draw=()=>{const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,'#101827');g.addColorStop(1,'#214a40');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);const x=width*.4+Math.sin(frame/20)*width*.025,y=height*.3;ctx.fillStyle='#cbefd9';ctx.beginPath();ctx.roundRect(x,y,width*.2,height*.42,width*.04);ctx.fill();ctx.fillStyle='#8dceb0';ctx.fillRect(x+width*.06,y-height*.04,width*.08,height*.06);ctx.fillStyle='#fff';ctx.font='bold '+Math.round(width*.06)+'px Arial';ctx.textAlign='center';ctx.fillText('LumaLeaf',width/2,height*.16);ctx.font=Math.round(width*.025)+'px Arial';ctx.fillText('ORIGINAL PROCEDURAL DEMO',width/2,height*.86);frame++;};
   draw();recorder.start();const timer=setInterval(draw,100);await new Promise(resolve=>setTimeout(resolve,20000));clearInterval(timer);recorder.stop();const result=await complete;stream.getTracks().forEach(t=>t.stop());return result;
  },{width,height});
  const bytes=Buffer.from(encoded,'base64');if(bytes.length>2000000)throw new Error('Procedural video exceeds preview cap.');writeFileSync('work/demo-media/'+name+'.mp4',bytes);console.log(JSON.stringify({name,bytes:bytes.length,origin:'procedural_demo',durationDeclaredSec:20}));
 }
}finally{await browser.close();}
