import {test,expect} from '@playwright/test';
import {loadCredentials} from '../../scripts/secure-store.mjs';

test('creator discovery loads real previews and supports search and reset',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/v1/assets/*/read-url',async route=>{await new Promise(resolve=>setTimeout(resolve,500));await route.continue();});
  await page.goto('/creators');
  await expect(page.locator('.global-progress')).toBeVisible();
  await expect(page.locator('.discovery-card').first()).toBeVisible();
  await expect.poll(()=>page.locator('.media-preview[aria-busy=true]').count(),{timeout:30000}).toBe(0);
  const rail=page.locator('.filter-rail');
  await rail.getByLabel('Production search').fill('no-creator-matches-this-request');
  await rail.getByRole('button',{name:'Apply filters'}).click();
  await expect(page).toHaveURL(/q=no-creator-matches-this-request/);
  await expect(page.getByRole('heading',{name:'No creators satisfy these requirements'})).toBeVisible();
  await page.getByRole('link',{name:'Reset filters',exact:true}).last().click();
  await expect(page.locator('.discovery-card').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('brief search, status filters and mobile layouts stay connected',async({page})=>{
  const account=loadCredentials().find((record:{name:string})=>record.name==='lumaleaf');
  await page.goto('/sign-in');await page.getByLabel('Email',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL('/brand');
  await page.getByRole('link',{name:'View all briefs'}).click();await expect(page).toHaveURL('/briefs');
  const filters=page.getByRole('group',{name:'Filter briefs by status'});
  await filters.getByRole('button',{name:/^draft$/i}).click();await expect(filters.getByRole('button',{name:/^draft$/i})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('searchbox',{name:'Search briefs'}).fill('does-not-match-any-brief');
  await expect(page.getByRole('heading',{name:'No briefs match this search'})).toBeVisible();
  await page.getByRole('searchbox',{name:'Search briefs'}).clear();await filters.getByRole('button',{name:'All briefs'}).click();
  await expect(page.locator('.brief-card').first()).toBeVisible();
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
