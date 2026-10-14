import { test, expect } from '@playwright/test';

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`landing layout and controls fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#hero-title')).toBeVisible();
    for (const element of await page.locator('[data-reveal]').all()) {
      await element.scrollIntoViewIfNeeded();
      await expect(element).not.toHaveClass(/reveal-pending/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const overflowing = await page.locator('.copilot-cards > div, .fit-cards > div, .workflow-cards > div, .outcome-cards > div, .creator-feature').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent?.slice(0, 50)));
    expect(overflowing).toEqual([]);
    await page.getByRole('button', { name: /^matching creators$/i }).click();
    await expect(page.getByText('Example production styles')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: /^template brief$/i }).click();
    await expect(page.getByRole('heading', { name: 'Summer Refresh Campaign', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Creation Mart' })).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    await page.getByRole('button', { name: /watch the creative film/i }).first().click();
    await expect(page.getByRole('dialog', { name: 'Creative process film' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /watch the creative film/i }).first()).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(errors).toEqual([]);
  });
}

test('reduced motion keeps content visible and films paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect.poll(() => page.locator('.landing video').evaluateAll(nodes => nodes.every(node => (node as HTMLVideoElement).paused))).toBe(true);
  await expect(page.locator('.reveal-pending')).toHaveCount(0);
  expect(await page.locator('.hero-content').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});
