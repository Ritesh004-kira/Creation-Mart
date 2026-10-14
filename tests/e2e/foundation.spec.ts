import { test,expect,type Page } from '@playwright/test';
// Credentials stay in the test process. Traces/screenshots never capture the sign-in form.
import { loadCredentials } from '../../scripts/secure-store.mjs';
const credentials=loadCredentials() as {name:string;email:string;password:string}[];
async function signIn(page:Page,name:string) {
  const account=credentials.find(c=>c.name===name);if(!account)throw new Error('Demo account missing.');
  await page.goto('/sign-in');
  await page.getByLabel('Email',{exact:true}).fill(account.email);
  await page.getByLabel('Password',{exact:true}).fill(account.password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(/\/(creator|brand)$/,{timeout:30000});
}
for(const width of [375,768,1440])test('public foundation renders at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});
  const failures:string[]=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Create Shared Memorable Work'})).toBeVisible();
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'docs/evidence/foundation-home-'+width+'.png',fullPage:true});
  expect(failures).toEqual([]);
});
test('creator signs in, saves and reloads their production profile',async({page})=>{
  await page.setViewportSize({width:375,height:900});await signIn(page,'asha');
  await page.getByRole('link',{name:'Edit profile'}).click();
  await expect(page.getByRole('heading',{name:'Your production profile',exact:true})).toBeVisible();
  await page.getByLabel('Production headline *',{exact:true}).fill('Product film and launch images');
  await page.getByRole('button',{name:'Save profile',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Profile saved.'})).toBeVisible();
  await page.reload();await expect(page.getByLabel('Production headline *',{exact:true})).toHaveValue('Product film and launch images');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'docs/evidence/foundation-profile-375.png',fullPage:true});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL('/');
  await page.goto('/creator/profile');await expect(page).toHaveURL(/\/sign-in\?returnTo=/);
});
test('brand session cannot open the creator editor',async({page})=>{
  await signIn(page,'lumaleaf');await page.goto('/creator/profile');await expect(page).toHaveURL('/brand');
  await expect(page.getByRole('heading',{name:'Welcome, LumaLeaf Demo'})).toBeVisible();
});
test('API rejects malformed and oversized JSON with recoverable codes',async({request,baseURL})=>{
  const origin=new URL(baseURL!).origin;
  const bad=await request.patch('/api/v1/me/creator',{headers:{Origin:origin,'Content-Type':'application/json'},data:'{broken'});
  expect(bad.status()).toBe(400);expect((await bad.json()).error.code).toBe('VALIDATION_FAILED');
  const large=await request.patch('/api/v1/me/creator',{headers:{Origin:origin,'Content-Type':'application/json'},data:JSON.stringify({text:'😀'.repeat(9000)})});
  expect(large.status()).toBe(413);expect((await large.json()).error.code).toBe('UPLOAD_TOO_LARGE');
});
test('cookie mutations reject an unrelated origin before processing data',async({request})=>{
  const response=await request.post('/api/v1/onboarding',{headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},data:{role:'creator',displayName:'Intruder'}});
  expect(response.status()).toBe(403);expect((await response.json()).error.code).toBe('FORBIDDEN');
});
