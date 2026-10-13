import { expect, it } from 'vitest';
import { appOrigin, trustedOrigins } from '../../src/server/http/app-origin';
const production = { APP_ORIGIN: 'https://creation-mart.vercel.app', VERCEL_ENV: 'production', VERCEL_URL: 'untrusted-preview.vercel.app' };
it('keeps production redirects on the canonical domain despite a supplied hostile host', () => {
  expect(appOrigin('https://evil.example/auth/callback', production)).toBe(production.APP_ORIGIN);
  expect(trustedOrigins(production)).toEqual([production.APP_ORIGIN]);
});
it('accepts only preview origins supplied by the deployment environment', () => {
  const config = { ...production, VERCEL_ENV: 'preview', VERCEL_URL: 'creation-mart-test.vercel.app', VERCEL_BRANCH_URL: 'creation-mart-git-implementation.vercel.app' };
  expect(appOrigin('https://creation-mart-test.vercel.app/auth/callback', config)).toBe('https://creation-mart-test.vercel.app');
  expect(appOrigin('https://another-project.vercel.app/auth/callback', config)).toBe(production.APP_ORIGIN);
});
it.each(['evil.example', 'creation-mart.vercel.app/escape', 'creation-mart.vercel.app@evil.example', 'creation-mart.vercel.app:443'])('rejects malformed preview environment hosts %s', host => {
  expect(trustedOrigins({ ...production, VERCEL_ENV: 'preview', VERCEL_URL: host })).toEqual([production.APP_ORIGIN]);
});
it('accepts the configured local origin', () => expect(appOrigin('http://localhost:3000/auth/callback', { APP_ORIGIN: 'http://localhost:3000' })).toBe('http://localhost:3000'));
