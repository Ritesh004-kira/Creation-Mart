import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
mkdirSync('docs/evidence/ui',{recursive:true});

for(const width of [375,768,1440])test('source UI and primary interactions at '+width+'px',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height:900});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Create Shared Memorable Work'})).toBeVisible();
 await page.evaluate(async()=>{await document.fonts.ready;});
 for(const section of await page.locator('.landing section').all()){await section.scrollIntoViewIfNeeded();await expect.poll(()=>section.locator('img').evaluateAll(images=>images.every(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0)),{timeout:30000}).toBe(true);}
 await page.evaluate(()=>window.scrollTo(0,0));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Pause background film'}).click();
 await page.locator('video[src="/design/hero.webm"]').evaluate(async node=>{const film=node as HTMLVideoElement;film.pause();if(film.currentTime!==0){await new Promise<void>(resolve=>{film.addEventListener('seeked',()=>resolve(),{once:true});film.currentTime=0;});}});
 await page.screenshot({path:'docs/evidence/ui/home-'+width+'.png',fullPage:true});
 await page.getByRole('button',{name:'Open navigation menu'}).click();await expect(page.getByRole('dialog',{name:'Creation Mart'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Open navigation menu'})).toBeFocused();
 await page.getByRole('button',{name:'WATCH THE CREATIVE FILM'}).first().click();await expect(page.getByRole('dialog',{name:'Creative process film'})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'MATCHING CREATORS'}).click();await expect(page.getByText('Example production styles')).toBeVisible();
 await page.getByRole('button',{name:'TEMPLATE BRIEF',exact:true}).click();await expect(page.getByRole('heading',{name:'Summer Refresh Campaign',exact:true})).toBeVisible();
 for(const path of ['/creators','/sign-in','/about','/privacy','/terms']){const response=await page.goto(path);expect(response?.status()).toBe(200);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'docs/evidence/ui/'+path.slice(1)+'-'+width+'.png',fullPage:true});}
 expect(errors).toEqual([]);
});

test('bundled reference capture for fidelity comparison',async({page})=>{
 test.skip(Boolean(process.env.BASE_URL),'Source reference is local only.');test.setTimeout(180000);
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:3001');await expect(page.getByRole('heading',{name:'Create Shared Memorable Work'})).toBeVisible();
  for(const section of await page.locator('main section').all())await section.scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollTo(0,0));
  await page.evaluate(async()=>{await document.fonts.ready;for(const v of document.querySelectorAll('video'))v.pause();});
  await page.locator('video[src="/hero.webm"]').evaluate(async node=>{const film=node as HTMLVideoElement;if(film.currentTime!==0){await new Promise<void>(resolve=>{film.addEventListener('seeked',()=>resolve(),{once:true});film.currentTime=0;});}});
  await page.screenshot({path:'docs/evidence/ui/reference-'+width+'.png',fullPage:true});
 }
});
