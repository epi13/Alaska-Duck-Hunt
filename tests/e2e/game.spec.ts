import { expect, test, type Page } from '@playwright/test';

const forbiddenConsole =
  /disallowed MIME type|text\/vnd\.trolltech\.linguist|failed to load module script|MIME type mismatch/i;

test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  page.on('console', (message) => {
    if (forbiddenConsole.test(message.text())) failures.push(message.text());
  });
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/');
  await enterMenu(page);
  await expect(page.getByText('THE MIGRATION')).toBeVisible();
  expect(failures.filter((message) => forbiddenConsole.test(message))).toEqual([]);
});

async function enterMenu(page: Page) {
  const enter = page.getByRole('button', { name: 'Enter the wild' });
  if (await enter.isVisible().catch(() => false)) await enter.click();
}

async function startHunt(page: Page) {
  await page.locator('[data-go="campaign"]').first().click();
  await page.locator('[data-location="2"]').click();
  await page.locator('#start-hunt').click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-shots', '0');
}

test('serves transformed modules with JavaScript MIME and loads the menu', async ({
  page,
  request,
}) => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION === '1', 'Source modules are bundled in production.');
  const module = await request.get('/src/main.ts');
  expect(module.ok()).toBeTruthy();
  expect(module.headers()['content-type']).toMatch(/(?:text|application)\/javascript/);
  expect(module.headers()['content-type']).not.toContain('text/vnd.trolltech.linguist');
  await expect(page.getByRole('button', { name: /continue campaign/i })).toBeVisible();
});

test('menu controls never fire a gameplay shot', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByLabel('Reduced motion').click();
  await expect(page.locator('#aim-layer')).toHaveCount(0);
});

test('mouse aims and fires exactly once, pause gates fire, and resume restores it', async ({
  page,
}) => {
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  const bounds = await surface.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.7, bounds!.y + bounds!.height * 0.35);
  await expect(surface).toHaveAttribute('data-aim-x', /\d/);
  const firstX = Number(await surface.getAttribute('data-aim-x'));
  expect(firstX).toBeGreaterThan(bounds!.width * 0.6);
  await page.mouse.click(bounds!.x + bounds!.width * 0.7, bounds!.y + bounds!.height * 0.35);
  await expect(surface).toHaveAttribute('data-shots', '1');

  await page.keyboard.press('Escape');
  await expect(page.getByText('HUNT PAUSED')).toBeVisible();
  await page.mouse.click(bounds!.x + 20, bounds!.y + 20);
  await expect(surface).toHaveAttribute('data-shots', '1');
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByText('HUNT PAUSED')).toBeHidden();
  await page.mouse.click(bounds!.x + bounds!.width * 0.4, bounds!.y + bounds!.height * 0.4);
  await expect(surface).toHaveAttribute('data-shots', '2');
});

test('mouse aim stays aligned after viewport resize and keyboard remains available', async ({
  page,
}) => {
  await startHunt(page);
  await page.setViewportSize({ width: 820, height: 620 });
  const surface = page.locator('#aim-layer');
  const bounds = await surface.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * 0.25, bounds!.y + bounds!.height * 0.75);
  const x = Number(await surface.getAttribute('data-aim-x'));
  const y = Number(await surface.getAttribute('data-aim-y'));
  expect(x).toBeCloseTo(bounds!.width * 0.25, -1);
  expect(y).toBeCloseTo(bounds!.height * 0.75, -1);
  await page.keyboard.press('Space');
  await expect(surface).toHaveAttribute('data-shots', '1');
  await page.keyboard.press('r');
  await expect(page.locator('#ammo')).toHaveText('●●●●●');
});

test('field guide, manifest, and responsive mobile layout', async ({ page }) => {
  await page.locator('[data-go="guide"]').first().click();
  await expect(page.getByRole('heading', { name: 'FIELD GUIDE' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spectacled Eider' })).toBeVisible();
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.guide-grid')).toBeVisible();
  expect((await page.locator('body').evaluate((el) => el.scrollWidth)) <= 390).toBeTruthy();
});
