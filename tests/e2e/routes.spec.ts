import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { loadCredentials } from '../../scripts/secure-store.mjs';
const records = loadCredentials() as { name: string; email: string; password: string }[];
const seed = JSON.parse(readFileSync('work/seed-manifest.json', 'utf8')) as { users: Record<string,string>; items: Record<string,{id:string;assetId:string}>; briefs: Record<string,string> };
async function signIn(page: Page, name: string) {
  const account = records.find(record => record.name === name)!;
  await page.goto('/sign-in');
  try { await page.getByLabel('Email', {exact:true}).fill(account.email); await page.getByLabel('Password', {exact:true}).fill(account.password); }
  catch { throw new Error('Demo credential entry is unavailable.'); }
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(/\/(creator|brand)$/, {timeout:30000});
}
for (const width of [375,768,1440]) test('connected creator and brand routes render at '+width+'px', async ({browser}) => {
  test.setTimeout(300000);
  const creatorContext=await browser.newContext({viewport:{width,height:900}}), brandContext=await browser.newContext({viewport:{width,height:900}});
  const creator=await creatorContext.newPage(),brand=await brandContext.newPage(),errors:string[]=[];
  for(const page of [creator,brand])page.on('pageerror',error=>errors.push(error.name));
  try {
    await signIn(creator,'asha');await signIn(brand,'lumaleaf');
    const engagementResult=await brand.request.get('/api/v1/briefs');expect(engagementResult.ok()).toBe(true);
    const routes:[Page,string,string][]=[
      [creator,'/dashboard','creator'],[creator,'/creator','creator'],[creator,'/creator/profile','profile'],[creator,'/creator/preview','preview'],
      [creator,'/portfolio/new','new-work'],[creator,'/portfolio/'+seed.items['asha:1'].id+'/edit','work-editor'],
      [creator,'/briefs','available-briefs'],[creator,'/briefs/'+seed.briefs.lumaleaf,'brief-detail'],[creator,'/briefs/'+seed.briefs.lumaleaf+'/apply','apply'],
      [brand,'/brand','brand'],[brand,'/briefs/new','new-brief'],[brand,'/briefs/'+seed.briefs.conflicting+'/edit','brief-editor'],
      [brand,'/briefs/'+seed.briefs.lumaleaf+'/applications','applications'],[brand,'/briefs/'+seed.briefs.lumaleaf+'/shortlist','shortlist'],
    ];
    for(const [page,path,label] of routes){
      const response=await page.goto(path);expect(response?.status(),label+' page response').toBe(200);
      await expect(page.locator('main h1').first(),label+' heading').toBeVisible({timeout:20000});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' horizontal fit').toBe(true);
      if(['work-editor','brief-editor','shortlist'].includes(label))await page.screenshot({path:'docs/evidence/'+label+'-'+width+'.png',fullPage:true});
    }
    await creator.goto('/brand');await expect(creator).toHaveURL('/creator');
    await brand.goto('/portfolio/'+seed.items['asha:1'].id+'/edit');await expect(brand).toHaveURL('/brand');
    const missingId=randomUUID();expect((await creator.request.get('/api/v1/engagements/'+missingId)).status()).toBe(404);
    // Next.js may stream the shell with 200 before rendering its not-found boundary.
    const missing=await creator.goto('/engagements/'+missingId);expect([200,404].includes(missing?.status()??0)).toBe(true);await expect(creator.getByRole('heading',{name:'That page is unavailable'})).toBeVisible();
    await creator.getByRole('link',{name:'Browse creators',exact:true}).last().click();await expect(creator).toHaveURL('/creators');
    expect(errors).toEqual([]);
  }finally{await creatorContext.close();await brandContext.close();}
});
test('an expired demo session refreshes through server cookies',async({page,context})=>{
  test.setTimeout(90000);await signIn(page,'asha');
  const cookies=(await context.cookies()).filter(cookie=>/^sb-.*-auth-token(?:\.\d+)?$/.test(cookie.name)).sort((a,b)=>a.name.localeCompare(b.name));expect(cookies.length>0).toBe(true);
  const baseName=cookies[0].name.replace(/\.\d+$/,''),value=cookies.map(cookie=>cookie.value).join('');expect(value.startsWith('base64-')).toBe(true);
  const session=JSON.parse(Buffer.from(value.slice(7),'base64url').toString('utf8'));expect(typeof session.access_token==='string'&&typeof session.refresh_token==='string').toBe(true);
  const token=session.access_token.split('.'),claims=JSON.parse(Buffer.from(token[1],'base64url').toString('utf8'));claims.exp=Math.floor(Date.now()/1000)-60;token[1]=Buffer.from(JSON.stringify(claims)).toString('base64url');session.access_token=token.join('.');session.expires_at=claims.exp;
  const expired='base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');await context.clearCookies({name:/^sb-.*-auth-token(?:\.\d+)?$/});
  const chunks=[];for(let offset=0;offset<expired.length;offset+=3000)chunks.push({...cookies[0],name:baseName+'.'+chunks.length,value:expired.slice(offset,offset+3000)});await context.addCookies(chunks);
  const response=await page.goto('/creator/profile');expect(response?.status()).toBe(200);await expect(page.getByRole('heading',{name:'Your production profile',exact:true})).toBeVisible();
  const refreshed=(await context.cookies()).filter(cookie=>cookie.name===baseName||cookie.name.startsWith(baseName+'.')).sort((a,b)=>a.name.localeCompare(b.name));const nextSession=JSON.parse(Buffer.from(refreshed.map(cookie=>cookie.value).join('').slice(7),'base64url').toString('utf8'));expect(nextSession.expires_at>Math.floor(Date.now()/1000)).toBe(true);
});
test('read APIs enforce roles and private brief ownership',async({browser})=>{
  test.setTimeout(120000);const creatorContext=await browser.newContext(),brandContext=await browser.newContext(),visitor=await browser.newContext();
  const creator=await creatorContext.newPage(),brand=await brandContext.newPage();
  try{
    await signIn(creator,'asha');await signIn(brand,'lumaleaf');
    expect((await visitor.request.get('/api/v1/me/creator')).status()).toBe(401);
    expect((await creator.request.get('/api/v1/me/brand')).status()).toBe(403);
    const profile=await creator.request.get('/api/v1/me/creator');expect(profile.status()).toBe(200);const creatorRow=(await profile.json()).data;expect(creatorRow.is_demo).toBe(true);
    const publicProfile=await visitor.request.get('/api/v1/creators/'+creatorRow.slug);expect(publicProfile.status()).toBe(200);expect((await publicProfile.json()).data.items.length).toBeGreaterThanOrEqual(2);
    const safeBrief=await creator.request.get('/api/v1/briefs/'+seed.briefs.lumaleaf);expect(safeBrief.status()).toBe(200);expect(Object.hasOwn((await safeBrief.json()).data,'payload')).toBe(false);
    expect((await brand.request.get('/api/v1/briefs/'+seed.briefs.orbitnote)).status()).toBe(404);
    expect((await creator.request.get('/api/v1/briefs/'+seed.briefs.conflicting)).status()).toBe(404);
    expect((await brand.request.get('/api/v1/briefs/'+seed.briefs.lumaleaf+'/shortlist')).status()).toBe(200);
    expect((await creator.request.get('/api/v1/briefs/'+seed.briefs.lumaleaf+'/shortlist')).status()).toBe(403);
    expect((await brand.request.get('/api/v1/brief-assist/'+randomUUID())).status()).toBe(503);
  }finally{await creatorContext.close();await brandContext.close();await visitor.close();}
});
test('saved compare caps at three and survives reload',async({page})=>{
  test.setTimeout(120000);const account=records.find(record=>record.name==='lumaleaf')!,db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  expect(Boolean((await db.auth.signInWithPassword({email:account.email,password:account.password})).error)).toBe(false);
  for(const name of ['asha','bala','dev','chloe'])expect(Boolean((await db.rpc('shortlist_mutation',{p_brief:seed.briefs.lumaleaf,p_creator:seed.users[name],p_remove:false,p_key:randomUUID()})).error)).toBe(false);
  await signIn(page,'lumaleaf');await page.goto('/briefs/'+seed.briefs.lumaleaf+'/shortlist');
  for(const name of ['Asha Demo','Bala Demo','Dev Demo']){const checkbox=page.getByRole('checkbox',{name:'Compare '+name,exact:true});await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();}
  await expect(page.getByRole('checkbox',{name:'Compare Chloe Demo',exact:true})).toBeDisabled();await expect(page.getByRole('heading',{name:'Compare 3 saved creators',exact:true})).toBeVisible();
  await page.reload();for(const name of ['Asha Demo','Bala Demo','Dev Demo','Chloe Demo'])await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});for(const name of ['Asha Demo','Bala Demo','Dev Demo'])await page.getByRole('checkbox',{name:'Compare '+name,exact:true}).check();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'docs/evidence/compare-'+width+'.png',fullPage:true});}
});
test('original video and audio previews actually decode and play',async({page})=>{
  test.setTimeout(120000);await page.setViewportSize({width:375,height:900});
  await page.goto('/creators/creator-'+seed.users.asha.replaceAll('-',''));const video=page.locator('video').first();await expect(video).toBeVisible({timeout:30000});
  await expect.poll(()=>video.evaluate(node=>(node as HTMLVideoElement).readyState),{timeout:30000}).toBeGreaterThanOrEqual(1);
  const facts=await video.evaluate(node=>{const video=node as HTMLVideoElement;return {width:video.videoWidth,height:video.videoHeight,duration:video.duration};});expect(facts.width).toBe(1080);expect(facts.height).toBe(1920);expect(facts.duration).toBeGreaterThan(19);expect(facts.duration).toBeLessThan(21);
  const box=await video.boundingBox();expect(Boolean(box)).toBe(true);await video.click({position:{x:25,y:box!.height-25}});await expect.poll(()=>video.evaluate(node=>(node as HTMLVideoElement).currentTime),{timeout:15000}).toBeGreaterThan(0.1);
  await page.screenshot({path:'docs/evidence/video-playing-375.png',fullPage:true});
  await page.goto('/creators/creator-'+seed.users.ena.replaceAll('-',''));const audio=page.locator('audio').first();await expect(audio).toBeVisible({timeout:30000});await expect.poll(()=>audio.evaluate(node=>(node as HTMLAudioElement).duration),{timeout:30000}).toBe(2);await audio.click({position:{x:25,y:27}});await expect.poll(()=>audio.evaluate(node=>(node as HTMLAudioElement).currentTime),{timeout:15000}).toBeGreaterThan(0.1);
});
