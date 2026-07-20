import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the wild' }).click();
});

test('startup, menu navigation, and settings persistence', async ({ page }) => {
  await expect(page.getByText('THE MIGRATION')).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  const motion = page.getByLabel('Reduced motion');
  await motion.check();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await expect(page.getByLabel('Reduced motion')).toBeChecked();
});

test('starts, fires, reloads, pauses, and resumes a hunt', async ({ page }) => {
  await page.locator('[data-go="campaign"]').first().dispatchEvent('click');
  await page.locator('[data-location="2"]').dispatchEvent('click');
  await page.locator('#start-hunt').dispatchEvent('click');
  await expect(page.locator('canvas')).toBeVisible();
  const canvas = await page.locator('canvas').boundingBox();
  expect(canvas).not.toBeNull();
  await page.locator('#aim-layer').dispatchEvent('pointerdown', {
    clientX: (canvas?.width ?? 800) / 2,
    clientY: (canvas?.height ?? 600) / 2,
  });
  await expect(page.locator('#ammo')).toContainText('○');
  await page.keyboard.press('r');
  await expect(page.locator('#ammo')).toHaveText('●●●●●');
  await page.keyboard.press('Escape');
  await expect(page.getByText('HUNT PAUSED')).toBeVisible();
  await page.locator('#resume').dispatchEvent('click');
  await expect(page.getByText('HUNT PAUSED')).toBeHidden();
});

test('field guide, manifest, and responsive mobile layout', async ({ page }) => {
  await page.locator('[data-go="guide"]').first().dispatchEvent('click');
  await expect(page.getByRole('heading', { name: 'FIELD GUIDE' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spectacled Eider' })).toBeVisible();
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.guide-grid')).toBeVisible();
  expect((await page.locator('body').evaluate((el) => el.scrollWidth)) <= 390).toBeTruthy();
});
