import {test,expect,type Page} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadCredentials} from '../../scripts/secure-store.mjs';
const records=loadCredentials(),journey=JSON.parse(readFileSync('docs/evidence/live-journey.json','utf8')).fixture;
async function signIn(page:Page,name:string){const r=records.find((r:{name:string})=>r.name===name);await page.goto('/sign-in');await page.getByLabel('Email',{exact:true}).fill(r.email);await page.getByLabel('Password',{exact:true}).fill(r.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/(creator|brand)$/,{timeout:30000});}
test('accepted live history survives back navigation and rejects unrelated participants',async({browser,baseURL})=>{
 test.setTimeout(120000);const owner=await browser.newContext(),outside=await browser.newContext(),visitor=await browser.newContext(),brand=await owner.newPage(),stranger=await outside.newPage(),path='/engagements/'+journey.engagementId,api='/api/v1'+path;
 try{
  await signIn(brand,'lumaleaf');const response=await brand.request.get(api);expect(response.status()).toBe(200);const data=(await response.json()).data;expect(data.engagement.state).toBe('accepted');expect(data.submissions.map((s:{sequence:number})=>s.sequence)).toEqual([1,2]);const latest=data.submissions[1],old=data.submissions[0];expect(latest.asset_ids.length).toBe(2);
  await brand.goto(path);await expect(brand.getByText('Accepted',{exact:true})).toBeVisible();await brand.getByRole('link',{name:'Original brief',exact:true}).click();await expect(brand).toHaveURL('/briefs/'+journey.briefId);await brand.goBack();await expect(brand.getByText('Accepted',{exact:true})).toBeVisible();
  for(const width of [375,768,1440]){await brand.setViewportSize({width,height:900});await brand.keyboard.press('Control+Home');expect(await brand.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await brand.screenshot({path:'docs/evidence/live-accepted-'+width+'.png'});}
  const oldLink=await brand.request.post('/api/v1/assets/'+old.asset_ids[0]+'/read-url?download=true');expect(oldLink.status()).toBe(404);
  const review={expectedVersion:data.engagement.version,submissionId:latest.id,checks:data.engagement.requirements_snapshot.filter((r:{mode:string})=>r.mode!=='file_check').map((r:{id:string})=>({requirementId:r.id,passed:true,note:'Duplicate acceptance probe.'})),rightsResolutionNote:'Original inputs were already reviewed.'};const duplicate=await brand.request.post(api+'/accept',{headers:{Origin:new URL(baseURL!).origin,'Idempotency-Key':randomUUID()},data:review});expect(duplicate.status()).toBe(409);
  expect((await visitor.request.get(api)).status()).toBe(401);expect((await visitor.request.post('/api/v1/assets/'+latest.asset_ids[0]+'/read-url?download=true')).status()).toBe(404);
  for(const name of ['orbitnote','dev']){await signIn(stranger,name);expect((await stranger.request.get(api)).status()).toBe(404);for(const id of latest.asset_ids)expect((await stranger.request.post('/api/v1/assets/'+id+'/read-url?download=true')).status()).toBe(404);await outside.clearCookies();}
  writeFileSync('docs/evidence/live-final-authorization.json',JSON.stringify({origin:new URL(baseURL!).origin,engagementId:journey.engagementId,status:'passed',checks:['accepted history','back navigation','375/768/1440 fit','old delivery final download denied','second acceptance denied','anonymous denied','unrelated brand denied','unselected creator denied']},null,2));
 }finally{await owner.close();await outside.close();await visitor.close();}
});
