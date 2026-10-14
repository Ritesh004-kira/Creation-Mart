import assert from 'node:assert/strict';
const origin=new URL(process.argv[2]??process.env.BASE_URL??'http://localhost:3000').origin;
assert(origin==='http://localhost:3000'||origin==='https://creation-mart.vercel.app','Use the bound local or production target.');
const results=[];
async function request(path,init){return fetch(origin+path,{...init,redirect:'manual',signal:AbortSignal.timeout(30000)});}
const health=await request('/api/v1/health');assert.equal(health.status,200);const state=await health.json();assert.equal(state.readiness,'ready');assert.equal(state.schemaVersion,'20261013174930');assert.equal(state.features.optionalInference,false);results.push('database-backed readiness');
for(const path of ['/','/sign-in','/creators','/briefs']){
 const response=await request(path);assert.equal(response.status,200,path);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'DENY');
 const csp=response.headers.get('content-security-policy');assert(csp?.includes("frame-ancestors 'none'"));if(origin.startsWith('https:'))assert(!csp.includes('unsafe-eval'));assert((await response.text()).includes('Creation Mart'));results.push(path);
}
for(const path of ['/api/v1/me/creator','/api/v1/me/brand'])assert.equal((await request(path)).status,401);
const blocked=await request('/api/v1/onboarding',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:'{}'});assert.equal(blocked.status,403);results.push('anonymous roles and cross-origin writes denied');
const callback=await request('/auth/callback?next=https%3A%2F%2Funrelated.example');assert([302,303,307].includes(callback.status));assert.equal(new URL(callback.headers.get('location'),origin).origin,origin);results.push('callback stays on bound origin');
console.log(JSON.stringify({origin,status:'passed',checks:results.length,results}));
