import { test,expect } from '@playwright/test';
import { loadCredentials } from '../../scripts/secure-store.mjs';
import { makePng } from '../../scripts/demo-media.mjs';
const account=loadCredentials().find((r:{name:string})=>r.name==='asha');
test('creator uploads, publishes and inspects a real production passport in the browser',async({page,browser})=>{
 const title='Browser passport '+Date.now();
 test.setTimeout(120000);await page.setViewportSize({width:375,height:900});await page.goto('/sign-in');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL('/creator',{timeout:30000});
 await page.getByRole('link',{name:'Add work',exact:true}).click();await page.getByLabel('Work title *',{exact:true}).fill(title);await page.getByRole('button',{name:'Create private draft'}).click();await expect(page).toHaveURL(/\/portfolio\/.+\/edit/,{timeout:30000});
 await page.getByLabel('Choose a public preview').setInputFiles({name:'original-procedural.png',mimeType:'image/png',buffer:makePng(72,72)});
 await page.getByRole('button',{name:'Upload and check file',exact:true}).first().click();await expect(page.getByText('File checked and ready.',{exact:true})).toBeVisible({timeout:30000});
 await page.getByLabel('Objective *',{exact:true}).fill('Demonstrate an uploaded original procedural image.');
 await page.getByLabel('Description *',{exact:true}).fill('Original procedural test image. The workflow below is an illustrative declaration.');
 await page.getByLabel('Human contribution *',{exact:true}).fill('Selected the test palette and image dimensions.');
 await page.getByRole('checkbox',{name:'PNG',exact:true}).check();
 await page.getByLabel('Artifact origin *').selectOption('procedural_demo');await page.getByLabel('AI generation disclosure *').selectOption('no_ai');
 for(const [i,stage] of ['input','editing','export'].entries()){
   await page.getByRole('button',{name:'Add workflow step',exact:true}).click();
   const row=page.getByRole('heading',{name:'Step '+(i+1),exact:true}).locator('..');
   await row.getByLabel('Stage *',{exact:true}).selectOption(stage);await row.getByLabel('Tool *',{exact:true}).selectOption('browser-canvas');
   await row.getByLabel('What happened *',{exact:true}).fill('Illustrative production step for the procedural demo.');
   await row.getByLabel('What you did *',{exact:true}).fill('Chose original shapes and colors.');
   await row.getByLabel('Inputs and permissions *',{exact:true}).fill('Node code created these test bytes. This workflow is illustrative; no third-party inputs.');
 }
 await page.getByLabel('Model disclosure note *',{exact:true}).fill('No model was used to generate this procedural test image.');
 await page.getByRole('button',{name:'Save work',exact:true}).click();await expect(page.getByText('Work saved.',{exact:true})).toBeVisible({timeout:15000});
 await page.getByRole('button',{name:'Publish saved work',exact:true}).click();await expect(page.getByText('Work published.',{exact:true})).toBeVisible({timeout:15000});
 const evidence=page.getByRole('heading',{name:'Private process evidence',exact:true}).locator('..');await evidence.getByLabel('Choose private evidence').setInputFiles({name:'private-process.png',mimeType:'image/png',buffer:makePng(64,64)});await evidence.getByRole('button',{name:'Upload and check file',exact:true}).click();await expect(evidence.getByText('File checked and ready.',{exact:true})).toBeVisible({timeout:30000});
 const assertion='Original code and export settings documented for '+title;await evidence.getByLabel('Assertion supported by this evidence *').fill(assertion);const claimResponse=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/v1/claims'&&response.request().method()==='POST');await evidence.getByRole('button',{name:'Save evidence assertion',exact:true}).click();const claim=(await (await claimResponse).json()).data;await expect(evidence.getByRole('status').filter({hasText:'Claim saved.'})).toBeVisible();
 await page.goto('/creator/preview');await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 const publicLink=page.getByRole('link',{name:'Open public profile →'});await publicLink.click();await expect(page.getByRole('heading',{name:'Work and production passports'})).toBeVisible({timeout:20000});
 await expect(page.getByText('File checked',{exact:true}).first()).toBeVisible();await expect(page.getByText('Procedural demo',{exact:true}).first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'docs/evidence/passport-public-375.png',fullPage:true});
 const visitor=await browser.newContext({viewport:{width:375,height:900}});try{const publicPage=await visitor.newPage();await publicPage.goto(page.url());const work=publicPage.getByRole('heading',{name:title,exact:true}).locator('..');await expect(work.getByText(assertion,{exact:true})).toBeVisible();await expect(work.getByText('evidence attached',{exact:true})).toBeVisible();expect(await publicPage.getByRole('heading',{name:'Private process evidence',exact:true}).count()).toBe(0);expect((await visitor.request.post('/api/v1/assets/'+claim.evidence_asset_ids[0]+'/read-url')).status()).toBe(404);}finally{await visitor.close();}
});
