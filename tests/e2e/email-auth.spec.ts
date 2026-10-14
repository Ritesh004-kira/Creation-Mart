import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {loadCredentials,saveCredentials} from '../../scripts/secure-store.mjs';

test('email signup, onboarding context, password change and sign-in persist',async({page})=>{
  test.setTimeout(150000);
  const id=randomUUID(),email='auth-'+id+'@example.test',password='Initial-'+randomUUID()+'!9',updated='Updated-'+randomUUID()+'!9';
  await page.goto('/sign-in?mode=signup&returnTo=%2Fbriefs%2Fnew');
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByLabel('Confirm password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page).toHaveURL(/\/onboarding\?returnTo=/,{timeout:30000});
  // Persist only in the existing encrypted credential store, never in artifacts.
  saveCredentials([...loadCredentials(),{name:'auth-check-'+id,email,password,role:'brand'}]);
  await page.getByLabel('Your name *').fill('Authentication check');await page.getByLabel('Your role *').selectOption('brand');
  await page.getByRole('button',{name:'Create my account'}).click();await expect(page).toHaveURL('/briefs/new',{timeout:30000});
  await page.goto('/account/password');
  await page.getByLabel('New password',{exact:true}).fill(updated);await page.getByLabel('Confirm new password',{exact:true}).fill(updated);
  await page.getByRole('button',{name:'Update password'}).click();await expect(page.getByRole('status')).toContainText('Your password has been updated');
  saveCredentials(loadCredentials().map((r:{name:string;password:string})=>r.name==='auth-check-'+id?{...r,password:updated}:r));
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL('/');
  await page.goto('/sign-in');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(updated);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL('/brand',{timeout:30000});
  await page.reload();await expect(page.getByRole('heading',{name:'Welcome, Authentication check'})).toBeVisible();
});

test('authentication errors and recovery remain actionable',async({page})=>{
  await page.goto('/sign-in?mode=signup');await page.getByLabel('Email',{exact:true}).fill('check@example.test');
  await page.getByLabel('Password',{exact:true}).fill('strong-password-123');await page.getByLabel('Confirm password',{exact:true}).fill('different-password-123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'do not match'})).toBeVisible();
  await page.getByRole('button',{name:'Forgot your password?'}).click();await expect(page.getByRole('heading',{name:'Reset your password'})).toBeVisible();
  // Exercise client recovery without emailing an unrelated address.
  await page.route('**/auth/v1/recover*',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.getByRole('button',{name:'Send reset link'}).click();await expect(page.getByRole('status')).toContainText('If an account exists');
  await page.goto('/auth/confirm?token_hash=invalid&type=recovery');await expect(page).toHaveURL(/\/sign-in\?error=confirmation/);
  await page.goto('/account/password');await expect(page).toHaveURL(/\/sign-in\?returnTo=/);
});
