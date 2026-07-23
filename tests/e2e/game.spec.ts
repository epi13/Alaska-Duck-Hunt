import { expect, test, type Page } from '@playwright/test';

const forbiddenConsole =
  /disallowed MIME type|text\/vnd\.trolltech\.linguist|failed to load module script|MIME type mismatch/i;
const browserFailures = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  browserFailures.set(page, failures);
  page.on('console', (message) => {
    if (forbiddenConsole.test(message.text())) failures.push(message.text());
  });
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto('/');
  await enterMenu(page);
  await expect(page.locator('.main-menu-screen')).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(browserFailures.get(page) ?? []).toEqual([]);
});

async function enterMenu(page: Page) {
  const mode = page.getByRole('button', { name: 'Choose Hunt Mode' });
  if (await mode.isVisible().catch(() => false)) {
    await mode.click();
    await page.getByRole('button', { name: /Alaska Duck Hunt/i }).click();
  }
}

async function startHunt(page: Page, locationIndex = 2) {
  const frontMode = page.locator('[data-front-go="modes"]').first();
  if (await frontMode.isVisible().catch(() => false)) await frontMode.click();
  else await page.locator('[data-go="modes"]').first().click();
  await page.locator('[data-mode="classic"]').click();
  await page.locator('#brief').click();
  await page
    .locator('[name="locationId"]')
    .selectOption(
      [
        'matsu',
        'cook',
        'copper',
        'yk',
        'interior',
        'arctic',
        'aleutian',
        'southeast',
        'tundra',
        'alpine',
        'willow',
        'river',
      ][locationIndex] ?? 'copper',
    );
  await page.locator('#mode-form button[type="submit"]').click();
  await page.locator('#start-hunt').click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-shots', '0');
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-sprite-birds', '0');
  const locationId = [
    'matsu',
    'cook',
    'copper',
    'yk',
    'interior',
    'arctic',
    'aleutian',
    'southeast',
    'tundra',
    'alpine',
    'willow',
    'river',
  ][locationIndex];
  await expect(page.locator('#aim-layer')).toHaveAttribute(
    'data-location-id',
    locationId ?? 'copper',
  );
  await expect(page.locator('#aim-layer')).toHaveAttribute(
    'data-scene-background',
    `assets/scenes/${locationId ?? 'copper'}.png`,
  );
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-scene-layers', '4');
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-dog-layer', 'ground');
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-dog-character', 'alaska-husky');
}

async function startModeHunt(
  page: Page,
  mode:
    | 'campaign'
    | 'classic'
    | 'endless'
    | 'species'
    | 'identification'
    | 'time'
    | 'practice'
    | 'daily'
    | 'custom',
) {
  await page.locator('[data-front-go="modes"]').first().click();
  await page.locator(`[data-mode="${mode}"]`).click();
  await page.locator('#brief').click();
  if (mode === 'campaign') await page.locator('[data-location="0"]').click();
  else if (mode !== 'daily') await page.locator('#mode-form button[type="submit"]').click();
  await expect(page.locator('.brief')).toHaveAttribute('data-round-mode', mode);
  await expect(page.locator('.bird-card.production-bird')).toBeVisible();
  await page.locator('#start-hunt').click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-round-mode', mode);
  const config = JSON.parse(
    (await page.locator('#aim-layer').getAttribute('data-round-config')) ?? '{}',
  ) as { mode?: string; seed?: string; targetSpeciesIds?: string[] };
  expect(config.mode).toBe(mode);
  expect(config.seed).toBeTruthy();
  expect(config.targetSpeciesIds?.length).toBeGreaterThan(0);
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
  const favicon = await request.get('/assets/icon.svg');
  expect(favicon.ok()).toBeTruthy();
  expect(favicon.headers()['content-type']).toContain('image/svg+xml');
  const startArt = await request.get('/assets/ui/start-copper-river.webp');
  expect(startArt.ok()).toBeTruthy();
  expect(startArt.headers()['content-type']).toContain('image/webp');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', './assets/icon.svg');
  await expect(
    page.getByRole('button', { name: /start campaign|continue campaign/i }).first(),
  ).toBeVisible();
});

test('first launch presents campaign choices and waits for interaction before audio unlock', async ({
  page,
}, testInfo) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.start-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Campaign' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose Hunt Mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Field Guide' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('OFFLINE READY')).toBeVisible();
  await expect(page.locator('#app')).not.toHaveAttribute('data-audio-unlocked', 'true');
  await page.screenshot({ path: testInfo.outputPath('start-first-launch-widescreen.png') });
});

test('returning player sees Continue Campaign and the persisted next location', async ({
  page,
}) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'adh-save',
      JSON.stringify({
        version: 3,
        campaign: {
          started: true,
          completedLocations: ['matsu', 'cook', 'copper'],
          unlockedLocations: ['matsu', 'cook', 'copper', 'yk'],
        },
        records: { highScores: { campaign: 2450 } },
        stats: { huntsCompleted: 7 },
      }),
    );
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue Campaign' })).toBeVisible();
  await expect(page.getByText(/NEXT: Yukon–Kuskokwim Delta/i)).toBeVisible();
  await page.getByRole('button', { name: 'Continue Campaign' }).click();
  await expect(page.locator('.brief')).toContainText('Yukon–Kuskokwim Delta');
});

test('area four failure stays locked, then passing unlocks and persists area five', async ({
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION === '1',
    'Uses the development-only deterministic round completion event.',
  );
  await page.evaluate(() => {
    localStorage.setItem(
      'adh-save',
      JSON.stringify({
        version: 3,
        campaign: {
          started: true,
          completedLocations: ['matsu', 'cook', 'copper'],
          unlockedLocations: ['matsu', 'cook', 'copper', 'yk'],
          bestResults: {},
          campaignComplete: false,
        },
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Continue Campaign' }).click();
  await expect(page.locator('.brief')).toContainText('Yukon–Kuskokwim Delta');
  await page.locator('#start-hunt').click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('adh-debug-complete-round', {
        detail: {
          score: 100,
          hits: 1,
          shots: 5,
          accuracy: 20,
          identificationAccuracy: 25,
          protectedHits: 0,
          nonTargetHits: 0,
          misses: 4,
          elapsedSeconds: 75,
        },
      }),
    ),
  );
  await expect(page.locator('.mode-results')).toHaveAttribute('data-result-passed', 'false');
  await expect(page.locator('.result-requirements')).toContainText('Objective missed');
  await page.locator('#campaign-map').click();
  await expect(page.locator('[data-location-id="interior"]')).toBeDisabled();

  await page.locator('[data-location-id="yk"]').click();
  await page.locator('#start-hunt').click();
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('adh-debug-complete-round', {
        detail: {
          score: 10_000,
          hits: 20,
          shots: 20,
          accuracy: 100,
          identificationAccuracy: 100,
          protectedHits: 0,
          nonTargetHits: 0,
          misses: 0,
          elapsedSeconds: 30,
        },
      }),
    ),
  );
  await expect(page.locator('.campaign-unlock')).toContainText('Interior Boreal Forest');
  await page.getByRole('button', { name: 'Next Area' }).click();
  await expect(page.locator('.brief')).toContainText('Interior Boreal Forest');

  await page.reload();
  await page.getByRole('button', { name: 'Continue Campaign' }).click();
  await expect(page.locator('.brief')).toContainText('Interior Boreal Forest');
});

test('keyboard Enter activates the focused primary action and safely unlocks audio', async ({
  page,
}) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#enter')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'ALASKA FLYWAYS' })).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('data-audio-unlocked', 'true');
});

test.describe('touch start-screen entry', () => {
  test.use({ hasTouch: true });
  test('opens Hunt Modes and unlocks audio', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Choose Hunt Mode' }).tap();
    await expect(page.getByRole('heading', { name: 'HUNT MODES' })).toBeVisible();
    await expect(page.locator('#app')).toHaveAttribute('data-audio-unlocked', 'true');
  });
});

test('reduced motion renders a stable static wildlife composition', async ({ page }, testInfo) => {
  await page.evaluate(() => localStorage.setItem('adh-Reduced motion', 'true'));
  await page.reload();
  await expect(page.locator('#app')).toHaveClass(/reduce-motion/);
  await expect
    .poll(async () =>
      page
        .locator('.front-bird')
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('none');
  await expect
    .poll(async () =>
      page.locator('.front-husky').evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('none');
  await page.screenshot({ path: testInfo.outputPath('start-reduced-motion.png') });
});

for (const viewport of [
  { name: 'widescreen', width: 1440, height: 900 },
  { name: 'four-three', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
]) {
  test(`${viewport.name} start screen has no horizontal overflow`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await expect(page.locator('.start-screen')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`start-${viewport.name}.png`) });
  });
}

test('main menu stays uncluttered at 390px and exposes all six destinations', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: 'Choose Hunt Mode' }).click();
  await page.getByRole('button', { name: /Alaska Duck Hunt/i }).click();
  await expect(page.locator('.main-menu-screen')).toBeVisible();
  await expect(page.locator('.front-destinations button')).toHaveCount(6);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath('main-menu-phone-portrait.png') });
});

for (const mode of [
  'campaign',
  'classic',
  'endless',
  'species',
  'identification',
  'time',
  'practice',
  'daily',
  'custom',
] as const) {
  test(`${mode} mode reaches its own playable RoundConfig`, async ({ page }) => {
    await startModeHunt(page, mode);
    if (mode === 'endless') {
      await expect(page.locator('#time')).toContainText('WAVE');
      await page.keyboard.press('Escape');
      await expect(page.getByText('HUNT PAUSED')).toBeVisible();
      await page.getByRole('button', { name: 'Return to menu' }).click();
      await expect(page.locator('.main-menu-screen')).toBeVisible();
    }
  });
}

test('custom hunt validates and preserves selected options across back navigation', async ({
  page,
}) => {
  await page.locator('[data-front-go="modes"]').first().click();
  await page.locator('[data-mode="custom"]').click();
  await page.locator('#brief').click();
  await page.locator('[name="locationId"]').selectOption('arctic');
  await page.locator('[name="durationSeconds"]').selectOption('180');
  await page.locator('[name="weather"]').selectOption('snow');
  await page.locator('[name="magazineSize"]').fill('12');
  await page.locator('[name="aimAssist"]').check();
  await page.locator('#setup-back').click();
  await page.locator('#brief').click();
  await expect(page.locator('[name="locationId"]')).toHaveValue('arctic');
  await expect(page.locator('[name="durationSeconds"]')).toHaveValue('180');
  await expect(page.locator('[name="weather"]')).toHaveValue('snow');
  await expect(page.locator('[name="magazineSize"]')).toHaveValue('12');
  await expect(page.locator('[name="aimAssist"]')).toBeChecked();
  await page.locator('#mode-form button[type="submit"]').click();
  await expect(page.getByText('180 seconds', { exact: true })).toBeVisible();
  await expect(page.getByText(/SNOW weather/i)).toBeVisible();
});

test('classic ammunition exhaustion produces mode-specific results and actions', async ({
  page,
}) => {
  await startModeHunt(page, 'classic');
  for (let magazine = 0; magazine < 3; magazine += 1) {
    for (let shot = 0; shot < 5; shot += 1) await page.keyboard.press('Space');
    if (magazine < 2) await page.keyboard.press('r');
  }
  await page.keyboard.press('Space');
  await expect(page.locator('.mode-results')).toHaveAttribute('data-result-mode', 'classic');
  await expect(page.getByText('SHOT ACCURACY', { exact: true })).toBeVisible();
  await expect(page.getByText('IDENTIFICATION', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next Classic Round' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change Settings' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('adh-mode-best-classic')))
    .not.toBeNull();
});

test('menu controls never fire a gameplay shot', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByLabel('Reduced motion').click();
  await expect(page.locator('#app')).toHaveClass(/reduce-motion/);
  await expect(page.locator('#aim-layer')).toHaveCount(0);
});

test('audio unlock, live buses, semantic weapon routing, and pause resume work', async ({
  page,
  request,
}, testInfo) => {
  await expect(page.locator('#app')).toHaveAttribute('data-audio-unlocked', 'true');
  await expect(page.locator('#app')).toHaveAttribute('data-audio-context-state', 'running');
  const shotAsset = await request.get('/assets/audio/weapon-shot.ogg');
  expect(shotAsset.ok()).toBe(true);
  expect(shotAsset.headers()['content-type']).toMatch(/audio\/ogg|application\/ogg/);

  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByRole('slider', { name: 'Music', exact: true }).fill('22');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('adh-Music'))).toBe('22');
  await expect
    .poll(async () => {
      const settings = JSON.parse(
        (await page.locator('#app').getAttribute('data-audio-settings')) ?? '{}',
      ) as { gains?: { music?: number } };
      return settings.gains?.music;
    })
    .toBeCloseTo(0.22);
  await page.getByRole('checkbox', { name: 'Mute', exact: true }).check();
  await expect
    .poll(async () => {
      const settings = JSON.parse(
        (await page.locator('#app').getAttribute('data-audio-settings')) ?? '{}',
      ) as { muted?: { master?: boolean } };
      return settings.muted?.master;
    })
    .toBe(true);
  await page.getByRole('checkbox', { name: 'Mute', exact: true }).uncheck();
  await page.screenshot({ path: testInfo.outputPath('audio-live-bus-settings.png') });

  await page.locator('[data-go="menu"]').first().click();
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'))
    .toMatch(/music-hunt:played/);
  const bounds = await surface.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds!.x + 24, bounds!.y + 24);
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'))
    .toMatch(/weapon-shot:played/);
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'))
    .toMatch(/feedback-miss:played/);
  await page.keyboard.press('r');
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'))
    .toMatch(/weapon-reload:played/);
  for (let index = 0; index < 6; index += 1) await page.keyboard.press('Space');
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'))
    .toMatch(/weapon-empty:played/);
  await page.screenshot({ path: testInfo.outputPath('audio-spatial-hunt.png') });

  await page.keyboard.press('Escape');
  await expect(page.locator('#app')).toHaveAttribute('data-audio-context-state', 'suspended');
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-audio-context-state', 'running');
});

test('mouse aims and fires exactly once, pause gates fire, and resume restores it', async ({
  page,
}) => {
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect
    .poll(async () => Number(await surface.getAttribute('data-sprite-birds')))
    .toBeGreaterThan(0);
  await expect(surface).toHaveAttribute(
    'data-last-illustrated-bird',
    /mallard|pintail|wigeon|teal|scaup|eider|harlequin|goldeneye|goose|canada-goose|snow-goose|brant|crane|grouse|ptarmigan|spectacled/,
  );
  await expect(surface).toHaveAttribute('data-bird-lane', 'habitat');
  await expect(surface).toHaveAttribute('data-bird-spawn-zone', /copper-/);
  await expect(surface).toHaveAttribute('data-scene-region-id', /copper-/);
  await expect(surface).toHaveAttribute('data-scene-depth', /0\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-scene-world-x', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-scene-world-y', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-scene-map-regions', /[1-9][0-9]*/);
  await expect(surface).toHaveAttribute('data-scene-prop-count', /[8-9]|[1-9][0-9]+/);
  await expect(surface).toHaveAttribute('data-scene-prop-invalid', '0');
  await expect(surface).toHaveAttribute('data-dog-path-id', 'copper-sedge-patrol');
  await expect(surface).toHaveAttribute('data-dog-world-x', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-dog-world-y', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-dog-display-depth', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute(
    'data-dog-animation-state',
    /idle|sniff|searchWalk|searchTrot|slowCautious|alert|lookHiddenBird|boundCover|flushReaction|stopWatch|run|turnTransition/,
  );
  await expect(surface).toHaveAttribute('data-dog-facing', /left|right/);
  await expect(surface).toHaveAttribute('data-dog-flip-x', /true|false/);
  await expect(surface).toHaveAttribute('data-dog-frame', /.+/);
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect(surface).toHaveAttribute('data-dog-scale', /0\.[0-9]+|1\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-bird-display-depth', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-bird-prop-occlusion', /0\.[0-9]+/);
  await expect(surface).toHaveAttribute(
    'data-bird-surface',
    /water|ground|grass|shore|mud|river|branch|coast/i,
  );
  await expect
    .poll(async () => surface.getAttribute('data-dog-flush'), { timeout: 20_000 })
    .not.toBeNull();
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'), { timeout: 20_000 })
    .toMatch(/wing-(?:small|medium|large):played/);
  await expect
    .poll(async () => surface.getAttribute('data-audio-cue-history'), { timeout: 20_000 })
    .toMatch(/dog-bark:played/);
  await expect(surface).toHaveAttribute('data-audio-pan', /-?[0-9.]+/);
  await expect(surface).toHaveAttribute('data-audio-gain', /[0-9.]+/);
  await expect(surface).toHaveAttribute('data-audio-lowpass', /[0-9.]+/);
  await expect(surface).toHaveAttribute(
    'data-bird-state',
    /alert|standingBonus|preTakeoff|takeoff|flying|climbing|descending/,
  );
  await expect
    .poll(async () => surface.getAttribute('data-bird-state-history'), { timeout: 8_000 })
    .toMatch(/takeoff.*flying/);
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

test('touch pointer aims and fires exactly once', async ({ page }) => {
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  const bounds = await surface.boundingBox();
  const clientX = bounds!.x + bounds!.width * 0.55;
  const clientY = bounds!.y + bounds!.height * 0.45;
  await surface.evaluate(
    (element, point) => {
      element.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerType: 'touch',
          pointerId: 9,
          isPrimary: true,
          button: 0,
          clientX: point.clientX,
          clientY: point.clientY,
        }),
      );
      element.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerType: 'touch',
          pointerId: 9,
          isPrimary: true,
          button: 0,
          clientX: point.clientX,
          clientY: point.clientY,
        }),
      );
    },
    { clientX, clientY },
  );
  await expect(surface).toHaveAttribute('data-shots', '1');
  await expect(surface).toHaveAttribute('data-aim-x', /\d/);
});

test('state-aware target hit uses an illustrated atlas bird', async ({ page }) => {
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect.poll(async () => surface.getAttribute('data-target-x')).not.toBeNull();
  const bounds = await surface.boundingBox();
  const x = Number(await surface.getAttribute('data-target-x'));
  const y = Number(await surface.getAttribute('data-target-y'));
  const state = await surface.getAttribute('data-target-state');
  expect(state).toMatch(
    /resting|foraging|walking|swimming|diving|alert|standingBonus|preTakeoff|takeoff|flying/,
  );
  await page.mouse.click(bounds!.x + x, bounds!.y + y);
  await expect(surface).toHaveAttribute('data-shots', '1');
  await expect(page.locator('#notice')).not.toHaveText('MISS');
});

test('seeded crane visibly reveals before its bonus window and flight', async ({ page }) => {
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION === '1',
    'Deterministic bird overrides are development-only.',
  );
  await page.goto(
    '/?seed=final-qa&debugBirdSpecies=crane&debugBirdSurface=tallGrass&debugBirdState=concealed',
  );
  await enterMenu(page);
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect
    .poll(async () => surface.getAttribute('data-dog-flush'), { timeout: 20_000 })
    .toBe('crane');
  await expect
    .poll(async () => surface.getAttribute('data-bird-state-history'), { timeout: 10_000 })
    .toMatch(/crane:revealing.*crane:standingBonus.*crane:preTakeoff.*crane:takeoff.*crane:flying/);
});

test('seeded multi-bird flocks render distinct reproducible individuals', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION === '1',
    'Deterministic flock overrides are development-only.',
  );
  test.setTimeout(120_000);
  const scenarios = [
    {
      name: 'snow-goose-morphs',
      location: 5,
      species: 'snow-goose',
      surface: 'shallowWater',
      state: 'resting',
    },
    {
      name: 'mallard-pairing',
      location: 2,
      species: 'mallard',
      surface: 'shallowWater',
      state: 'swimming',
    },
    {
      name: 'spruce-grouse',
      location: 4,
      species: 'grouse',
      surface: 'forestFloor',
      state: 'walking',
    },
  ] as const;

  let snowGooseReplay: string | undefined;
  for (const scenario of scenarios) {
    const query = new URLSearchParams({
      seed: `individual-${scenario.name}`,
      debugBirdSpecies: scenario.species,
      debugBirdSurface: scenario.surface,
      debugBirdState: scenario.state,
      debugFlockSize: '6',
    });
    await page.goto(`/?${query}`);
    await enterMenu(page);
    await startHunt(page, scenario.location);
    const surface = page.locator('#aim-layer');
    await expect
      .poll(async () => {
        const roster = await surface.getAttribute('data-bird-individual-plans');
        return roster ? JSON.parse(roster).length : 0;
      })
      .toBeGreaterThanOrEqual(4);
    const serialized = await surface.getAttribute('data-bird-individual-plans');
    expect(serialized).not.toBeNull();
    const plans = (
      JSON.parse(serialized!) as Array<{
        speciesId: string;
        biologicalVariant: string;
        individualVisualSeed: number;
        individualVisualVariant: string;
        scaleMultiplier: number;
        animationPhase: number;
        animationRateMultiplier: number;
        posePreference: string;
      }>
    ).filter(({ speciesId }) => speciesId === scenario.species);
    expect(plans.length).toBeGreaterThanOrEqual(4);
    expect(new Set(plans.map(({ individualVisualSeed }) => individualVisualSeed)).size).toBe(
      plans.length,
    );
    expect(new Set(plans.slice(0, 4).map(({ scaleMultiplier }) => scaleMultiplier)).size).toBe(4);
    expect(new Set(plans.slice(0, 4).map(({ animationPhase }) => animationPhase)).size).toBe(4);
    expect(
      new Set(plans.map(({ animationRateMultiplier }) => animationRateMultiplier)).size,
    ).toBeGreaterThan(1);
    expect(new Set(plans.map(({ posePreference }) => posePreference))).toEqual(
      new Set(['primary', 'alternate']),
    );
    expect(new Set(plans.map(({ individualVisualVariant }) => individualVisualVariant))).toEqual(
      new Set(['natural', 'alternate']),
    );
    await expect
      .poll(async () => {
        const value = await surface.getAttribute('data-bird-animation-telemetry');
        if (!value) return 0;
        return (JSON.parse(value) as Array<{ speciesId: string }>).filter(
          ({ speciesId }) => speciesId === scenario.species,
        ).length;
      })
      .toBeGreaterThanOrEqual(4);
    const animationTelemetry = (
      JSON.parse((await surface.getAttribute('data-bird-animation-telemetry'))!) as Array<{
        speciesId: string;
        individualVisualSeed: number;
        animationKey: string;
        frame: string;
        animationPhase: number;
        animationRateMultiplier: number;
        animationStartFrame: number;
        animationStartCount: number;
      }>
    ).filter(({ speciesId }) => speciesId === scenario.species);
    expect(animationTelemetry.every(({ animationKey }) => animationKey !== 'static')).toBe(true);
    expect(animationTelemetry.every(({ frame }) => frame.length > 0)).toBe(true);
    expect(animationTelemetry.every(({ animationStartFrame }) => animationStartFrame >= 0)).toBe(
      true,
    );
    expect(
      animationTelemetry.every(
        ({ animationRateMultiplier }) =>
          animationRateMultiplier >= 0.92 && animationRateMultiplier <= 1.08,
      ),
    ).toBe(true);
    const startsBySeed = new Map(
      animationTelemetry.map(({ individualVisualSeed, animationKey, animationStartCount }) => [
        individualVisualSeed,
        { animationKey, animationStartCount },
      ]),
    );
    await page.waitForTimeout(100);
    const laterTelemetry = JSON.parse(
      (await surface.getAttribute('data-bird-animation-telemetry'))!,
    ) as typeof animationTelemetry;
    const uninterrupted = laterTelemetry.filter(
      ({ individualVisualSeed, animationKey }) =>
        startsBySeed.get(individualVisualSeed)?.animationKey === animationKey,
    );
    expect(uninterrupted.length).toBeGreaterThan(0);
    for (const current of uninterrupted) {
      expect(current.animationStartCount).toBe(
        startsBySeed.get(current.individualVisualSeed)?.animationStartCount,
      );
    }
    if (scenario.species === 'snow-goose') {
      expect(new Set(plans.map(({ biologicalVariant }) => biologicalVariant))).toEqual(
        new Set(['white', 'blue']),
      );
      snowGooseReplay = serialized!;
    }
    await page.screenshot({ path: testInfo.outputPath(`flock-${scenario.name}.png`) });
  }

  const replayQuery = new URLSearchParams({
    seed: 'individual-snow-goose-morphs',
    debugBirdSpecies: 'snow-goose',
    debugBirdSurface: 'shallowWater',
    debugBirdState: 'resting',
    debugFlockSize: '6',
  });
  await page.goto(`/?${replayQuery}`);
  await enterMenu(page);
  await startHunt(page, 5);
  const replaySurface = page.locator('#aim-layer');
  await expect
    .poll(async () => {
      const roster = await replaySurface.getAttribute('data-bird-individual-plans');
      return roster ? JSON.parse(roster).length : 0;
    })
    .toBeGreaterThanOrEqual(4);
  await expect(replaySurface).toHaveAttribute('data-bird-individual-plans', snowGooseReplay!);
});

test('scene-map debug overlay and telemetry survive a mobile resize', async ({
  page,
}, testInfo) => {
  await page.goto('/?seed=scene-map-qa&debugSceneMap=1');
  await enterMenu(page);
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect(surface).toHaveAttribute('data-scene-map-debug', 'true');
  await expect.poll(async () => surface.getAttribute('data-scene-region-id')).toMatch(/^copper-/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => Number(await surface.getAttribute('data-dog-world-x')))
    .toBeGreaterThanOrEqual(40);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-dog-world-x')))
    .toBeLessThanOrEqual(350);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-dog-world-y')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-dog-world-y')))
    .toBeLessThanOrEqual(844);
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect(surface).toHaveAttribute('data-scene-depth', /0\.[0-9]+/);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-world-x')))
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-world-x')))
    .toBeLessThanOrEqual(390);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-world-y')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-world-y')))
    .toBeLessThanOrEqual(844);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-prop-world-x')))
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-prop-world-x')))
    .toBeLessThanOrEqual(390);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-prop-world-y')))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-scene-prop-world-y')))
    .toBeLessThanOrEqual(844);
  await page.screenshot({ path: testInfo.outputPath('mobile-scene-map-props-debug.png') });
});

test('original Alaskan Husky stays mapped, correctly faced, and readable across habitats', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const habitats = [
    { name: 'wetland', location: 2 },
    { name: 'forest', location: 4 },
    { name: 'tundra', location: 8 },
    { name: 'snow', location: 10 },
  ] as const;
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const habitat of habitats) {
    await page.goto(`/?seed=husky-${habitat.name}`);
    await enterMenu(page);
    await startHunt(page, habitat.location);
    const surface = page.locator('#aim-layer');
    await expect(surface).toHaveAttribute('data-dog-character', 'alaska-husky');
    await expect(surface).toHaveAttribute('data-dog-frame', /.+/);
    await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
    await expect(surface).toHaveAttribute('data-dog-prop-relation', /behind|front|none/);
    await expect
      .poll(async () =>
        surface.evaluate((element) => {
          const facing = (element as HTMLElement).dataset.dogFacing;
          const flipped = (element as HTMLElement).dataset.dogFlipX === 'true';
          return (facing === 'left' && flipped) || (facing === 'right' && !flipped);
        }),
      )
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`alaska-husky-${habitat.name}.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const surface = page.locator('#aim-layer');
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect
    .poll(async () => Number(await surface.getAttribute('data-dog-world-x')))
    .toBeGreaterThanOrEqual(40);
  await expect
    .poll(async () => Number(await surface.getAttribute('data-dog-world-x')))
    .toBeLessThanOrEqual(350);
  await page.screenshot({ path: testInfo.outputPath('alaska-husky-snow-mobile.png') });
});

test('reduced motion uses static Alaskan Husky poses without changing mapped contact', async ({
  page,
}) => {
  await page.evaluate(() => localStorage.setItem('adh-Reduced motion', 'true'));
  await page.goto('/?seed=husky-reduced-motion');
  await enterMenu(page);
  await startHunt(page, 2);
  const surface = page.locator('#aim-layer');
  await expect(surface).toHaveAttribute('data-dog-reduced-motion', 'true');
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect(surface).toHaveAttribute('data-dog-frame', /.+/);
});

test('captures distinct scene-map prop compositions across six habitat families', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const representatives = [
    { id: 'matsu', index: 0, family: 'wetland' },
    { id: 'interior', index: 4, family: 'forest' },
    { id: 'aleutian', index: 6, family: 'coastal' },
    { id: 'tundra', index: 8, family: 'tundra' },
    { id: 'alpine', index: 9, family: 'alpine' },
    { id: 'willow', index: 10, family: 'snow' },
  ];
  for (const representative of representatives) {
    await page.goto(`/?seed=prop-${representative.id}`);
    await enterMenu(page);
    await startHunt(page, representative.index);
    const surface = page.locator('#aim-layer');
    await expect(surface).toHaveAttribute('data-scene-prop-invalid', '0');
    await expect(surface).toHaveAttribute('data-scene-prop-count', /[8-9]|[1-9][0-9]+/);
    await expect
      .poll(async () => surface.getAttribute('data-scene-region-id'))
      .toMatch(new RegExp(`^${representative.id}-`));
    await page.screenshot({
      path: testInfo.outputPath(`${representative.family}-${representative.id}.png`),
    });
  }
});

test('anchors water, ground, snow, rock, branch, and tall-grass starts to semantic contacts', async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.PLAYWRIGHT_PRODUCTION === '1',
    'Deterministic bird overrides are development-only.',
  );
  test.setTimeout(120_000);
  const cases = [
    {
      name: 'water',
      location: 1,
      id: 'cook',
      species: 'harlequin',
      surface: 'openWater',
      state: 'swimming',
      contact: 'waterline',
    },
    {
      name: 'ground',
      location: 4,
      id: 'interior',
      species: 'grouse',
      surface: 'forestFloor',
      state: 'walking',
      contact: 'feet',
    },
    {
      name: 'snow',
      location: 10,
      id: 'willow',
      species: 'ptarmigan',
      surface: 'snowGround',
      state: 'foraging',
      contact: 'belly',
    },
    {
      name: 'rock',
      location: 6,
      id: 'aleutian',
      species: 'harlequin',
      surface: 'rockyCoast',
      state: 'resting',
      contact: 'belly',
    },
    {
      name: 'branch',
      location: 4,
      id: 'interior',
      species: 'grouse',
      surface: 'lowBranch',
      state: 'perched',
      contact: 'branchGrip',
    },
    {
      name: 'tall-grass',
      location: 0,
      id: 'matsu',
      species: 'crane',
      surface: 'tallGrass',
      state: 'concealed',
      contact: 'concealedBaseline',
    },
  ];
  for (const scenario of cases) {
    const query = new URLSearchParams({
      seed: `surface-${scenario.name}`,
      debugSceneMap: '1',
      debugBirdSpecies: scenario.species,
      debugBirdSurface: scenario.surface,
      debugBirdState: scenario.state,
    });
    await page.goto(`/?${query}`);
    await enterMenu(page);
    await startHunt(page, scenario.location);
    const surface = page.locator('#aim-layer');
    await expect(surface).toHaveAttribute('data-contact-species', scenario.species);
    await expect(surface).toHaveAttribute('data-contact-state', scenario.state);
    await expect(surface).toHaveAttribute('data-bird-surface', scenario.surface);
    await expect(surface).toHaveAttribute('data-bird-contact-type', scenario.contact);
    await expect(surface).toHaveAttribute('data-scene-region-id', new RegExp(`^${scenario.id}-`));
    await expect(surface).toHaveAttribute('data-scene-depth', /0\.[0-9]+/);
    await expect(surface).toHaveAttribute('data-contact-error', '0.000');
    if (scenario.name === 'snow') {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(surface).toHaveAttribute('data-contact-error', '0.000');
      await expect
        .poll(async () => Number(await surface.getAttribute('data-contact-world-x')))
        .toBeGreaterThanOrEqual(0);
      await expect
        .poll(async () => Number(await surface.getAttribute('data-contact-world-x')))
        .toBeLessThanOrEqual(390);
      await page.setViewportSize({ width: 1280, height: 720 });
    }
    await page.screenshot({ path: testInfo.outputPath(`surface-contact-${scenario.name}.png`) });
  }
});

test('field guide, manifest, and responsive mobile layout', async ({ page }) => {
  await page.locator('[data-front-go="guide"], [data-go="guide"]').first().click();
  await expect(page.getByRole('heading', { name: 'FIELD GUIDE' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spectacled Eider' })).toBeVisible();
  await expect(page.locator('.guide-bird.has-sprite')).toHaveCount(16);
  const sheet = await page.request.get('/assets/birds/mallard/atlas.png');
  expect(sheet.ok()).toBeTruthy();
  expect(sheet.headers()['content-type']).toContain('image/png');
  const atlas = await page.request.get('/assets/birds/spectacled/atlas.json');
  expect(atlas.ok()).toBeTruthy();
  expect(Object.keys((await atlas.json()).frames)).toHaveLength(64);
  for (const asset of [
    '/assets/scenes/copper.png',
    '/assets/characters/alaska-husky/atlas.png',
    '/assets/characters/alaska-husky/preview.png',
    '/assets/habitat/regions/coastal-delta.png',
  ]) {
    const response = await page.request.get(asset);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('image/png');
  }
  const huskyAtlas = await page.request.get('/assets/characters/alaska-husky/atlas.json');
  expect(huskyAtlas.ok()).toBeTruthy();
  expect(Object.keys((await huskyAtlas.json()).frames)).toHaveLength(16);
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.guide-grid')).toBeVisible();
  expect((await page.locator('body').evaluate((el) => el.scrollWidth)) <= 390).toBeTruthy();
});
