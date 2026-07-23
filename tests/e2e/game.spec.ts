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
  await expect(page.getByText('THE MIGRATION')).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(browserFailures.get(page) ?? []).toEqual([]);
});

async function enterMenu(page: Page) {
  const enter = page.getByRole('button', { name: 'Enter the wild' });
  if (await enter.isVisible().catch(() => false)) await enter.click();
}

async function startHunt(page: Page, locationIndex = 2) {
  await page.evaluate((index) => sessionStorage.setItem('location', String(index)), locationIndex);
  await page.locator('[data-go="modes"]').first().click();
  await page.locator('#brief').click();
  await page.locator('#start-hunt').click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-shots', '0');
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-sprite-birds', '0');
  const locationId = ['matsu', 'cook', 'copper', 'yk', 'interior', 'arctic', 'aleutian', 'southeast', 'tundra', 'alpine', 'willow', 'river'][locationIndex];
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-location-id', locationId ?? 'copper');
  await expect(page.locator('#aim-layer')).toHaveAttribute(
    'data-scene-background',
    `assets/scenes/${locationId ?? 'copper'}.png`,
  );
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-scene-layers', '4');
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-dog-layer', 'ground');
  await expect(page.locator('#aim-layer')).toHaveAttribute('data-dog-character', 'alaska-husky');
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
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', './assets/icon.svg');
  await expect(page.getByRole('button', { name: /continue campaign/i })).toBeVisible();
});

test('menu controls never fire a gameplay shot', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByLabel('Reduced motion').click();
  await expect(page.locator('#app')).toHaveClass(/reduce-motion/);
  await expect(page.locator('#aim-layer')).toHaveCount(0);
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
  await expect(surface).toHaveAttribute('data-dog-animation-state', /idle|sniff|searchWalk|searchTrot|slowCautious|alert|lookHiddenBird|boundCover|flushReaction|stopWatch|run|turnTransition/);
  await expect(surface).toHaveAttribute('data-dog-facing', /left|right/);
  await expect(surface).toHaveAttribute('data-dog-flip-x', /true|false/);
  await expect(surface).toHaveAttribute('data-dog-frame', /.+/);
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect(surface).toHaveAttribute('data-dog-scale', /0\.[0-9]+|1\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-bird-display-depth', /[0-9]+\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-bird-prop-occlusion', /0\.[0-9]+/);
  await expect(surface).toHaveAttribute('data-bird-surface', /water|ground|grass|shore|mud|river|branch|coast/i);
  await expect.poll(async () => surface.getAttribute('data-dog-flush'), { timeout: 20_000 }).not.toBeNull();
  await expect(surface).toHaveAttribute('data-bird-state', /alert|standingBonus|preTakeoff|takeoff|flying|climbing|descending/);
  await expect.poll(async () => surface.getAttribute('data-bird-state-history'), { timeout: 8_000 }).toMatch(/takeoff.*flying/);
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
  await surface.evaluate((element, point) => {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 9, isPrimary: true, button: 0, clientX: point.clientX, clientY: point.clientY }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 9, isPrimary: true, button: 0, clientX: point.clientX, clientY: point.clientY }));
  }, { clientX, clientY });
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
  expect(state).toMatch(/resting|foraging|walking|swimming|diving|alert|standingBonus|preTakeoff|takeoff|flying/);
  await page.mouse.click(bounds!.x + x, bounds!.y + y);
  await expect(surface).toHaveAttribute('data-shots', '1');
  await expect(page.locator('#notice')).not.toHaveText('MISS');
});

test('seeded crane visibly reveals before its bonus window and flight', async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION === '1', 'Deterministic bird overrides are development-only.');
  await page.goto('/?seed=final-qa&debugBirdSpecies=crane&debugBirdSurface=tallGrass&debugBirdState=concealed');
  await enterMenu(page);
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect.poll(async () => surface.getAttribute('data-dog-flush'), { timeout: 20_000 }).toBe('crane');
  await expect.poll(async () => surface.getAttribute('data-bird-state-history'), { timeout: 10_000 }).toMatch(/crane:revealing.*crane:standingBonus.*crane:preTakeoff.*crane:takeoff.*crane:flying/);
});

test('seeded multi-bird flocks render distinct reproducible individuals', async ({ page }, testInfo) => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION === '1', 'Deterministic flock overrides are development-only.');
  test.setTimeout(120_000);
  const scenarios = [
    { name: 'snow-goose-morphs', location: 5, species: 'snow-goose', surface: 'shallowWater', state: 'resting' },
    { name: 'mallard-pairing', location: 2, species: 'mallard', surface: 'shallowWater', state: 'swimming' },
    { name: 'spruce-grouse', location: 4, species: 'grouse', surface: 'forestFloor', state: 'walking' },
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
    await expect.poll(async () => {
      const roster = await surface.getAttribute('data-bird-individual-plans');
      return roster ? JSON.parse(roster).length : 0;
    }).toBeGreaterThanOrEqual(4);
    const serialized = await surface.getAttribute('data-bird-individual-plans');
    expect(serialized).not.toBeNull();
    const plans = (JSON.parse(serialized!) as Array<{
      speciesId: string;
      biologicalVariant: string;
      individualVisualSeed: number;
      individualVisualVariant: string;
      scaleMultiplier: number;
      animationPhase: number;
      animationRateMultiplier: number;
      posePreference: string;
    }>).filter(({ speciesId }) => speciesId === scenario.species);
    expect(plans.length).toBeGreaterThanOrEqual(4);
    expect(new Set(plans.map(({ individualVisualSeed }) => individualVisualSeed)).size).toBe(plans.length);
    expect(new Set(plans.slice(0, 4).map(({ scaleMultiplier }) => scaleMultiplier)).size).toBe(4);
    expect(new Set(plans.slice(0, 4).map(({ animationPhase }) => animationPhase)).size).toBe(4);
    expect(new Set(plans.map(({ animationRateMultiplier }) => animationRateMultiplier)).size).toBeGreaterThan(1);
    expect(new Set(plans.map(({ posePreference }) => posePreference))).toEqual(new Set(['primary', 'alternate']));
    expect(new Set(plans.map(({ individualVisualVariant }) => individualVisualVariant))).toEqual(new Set(['natural', 'alternate']));
    if (scenario.species === 'snow-goose') {
      expect(new Set(plans.map(({ biologicalVariant }) => biologicalVariant))).toEqual(new Set(['white', 'blue']));
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
  await expect.poll(async () => {
    const roster = await replaySurface.getAttribute('data-bird-individual-plans');
    return roster ? JSON.parse(roster).length : 0;
  }).toBeGreaterThanOrEqual(4);
  await expect(replaySurface).toHaveAttribute('data-bird-individual-plans', snowGooseReplay!);
});

test('scene-map debug overlay and telemetry survive a mobile resize', async ({ page }, testInfo) => {
  await page.goto('/?seed=scene-map-qa&debugSceneMap=1');
  await enterMenu(page);
  await startHunt(page);
  const surface = page.locator('#aim-layer');
  await expect(surface).toHaveAttribute('data-scene-map-debug', 'true');
  await expect.poll(async () => surface.getAttribute('data-scene-region-id')).toMatch(/^copper-/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => Number(await surface.getAttribute('data-dog-world-x'))).toBeGreaterThanOrEqual(40);
  await expect.poll(async () => Number(await surface.getAttribute('data-dog-world-x'))).toBeLessThanOrEqual(350);
  await expect.poll(async () => Number(await surface.getAttribute('data-dog-world-y'))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await surface.getAttribute('data-dog-world-y'))).toBeLessThanOrEqual(844);
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect(surface).toHaveAttribute('data-scene-depth', /0\.[0-9]+/);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-world-x'))).toBeGreaterThanOrEqual(0);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-world-x'))).toBeLessThanOrEqual(390);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-world-y'))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-world-y'))).toBeLessThanOrEqual(844);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-prop-world-x'))).toBeGreaterThanOrEqual(0);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-prop-world-x'))).toBeLessThanOrEqual(390);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-prop-world-y'))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await surface.getAttribute('data-scene-prop-world-y'))).toBeLessThanOrEqual(844);
  await page.screenshot({ path: testInfo.outputPath('mobile-scene-map-props-debug.png') });
});

test('original Alaskan Husky stays mapped, correctly faced, and readable across habitats', async ({ page }, testInfo) => {
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
    await expect.poll(async () => surface.evaluate((element) => {
      const facing = (element as HTMLElement).dataset.dogFacing;
      const flipped = (element as HTMLElement).dataset.dogFlipX === 'true';
      return (facing === 'left' && flipped) || (facing === 'right' && !flipped);
    })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`alaska-husky-${habitat.name}.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const surface = page.locator('#aim-layer');
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect.poll(async () => Number(await surface.getAttribute('data-dog-world-x'))).toBeGreaterThanOrEqual(40);
  await expect.poll(async () => Number(await surface.getAttribute('data-dog-world-x'))).toBeLessThanOrEqual(350);
  await page.screenshot({ path: testInfo.outputPath('alaska-husky-snow-mobile.png') });
});

test('reduced motion uses static Alaskan Husky poses without changing mapped contact', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('adh-Reduced motion', 'true'));
  await page.goto('/?seed=husky-reduced-motion');
  await enterMenu(page);
  await startHunt(page, 2);
  const surface = page.locator('#aim-layer');
  await expect(surface).toHaveAttribute('data-dog-reduced-motion', 'true');
  await expect.poll(async () => surface.getAttribute('data-dog-contact-error')).toBe('0.000');
  await expect(surface).toHaveAttribute('data-dog-frame', /.+/);
});

test('captures distinct scene-map prop compositions across six habitat families', async ({ page }, testInfo) => {
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
    await expect.poll(async () => surface.getAttribute('data-scene-region-id')).toMatch(new RegExp(`^${representative.id}-`));
    await page.screenshot({ path: testInfo.outputPath(`${representative.family}-${representative.id}.png`) });
  }
});

test('anchors water, ground, snow, rock, branch, and tall-grass starts to semantic contacts', async ({ page }, testInfo) => {
  test.skip(process.env.PLAYWRIGHT_PRODUCTION === '1', 'Deterministic bird overrides are development-only.');
  test.setTimeout(120_000);
  const cases = [
    { name: 'water', location: 1, id: 'cook', species: 'harlequin', surface: 'openWater', state: 'swimming', contact: 'waterline' },
    { name: 'ground', location: 4, id: 'interior', species: 'grouse', surface: 'forestFloor', state: 'walking', contact: 'feet' },
    { name: 'snow', location: 10, id: 'willow', species: 'ptarmigan', surface: 'snowGround', state: 'foraging', contact: 'belly' },
    { name: 'rock', location: 6, id: 'aleutian', species: 'harlequin', surface: 'rockyCoast', state: 'resting', contact: 'belly' },
    { name: 'branch', location: 4, id: 'interior', species: 'grouse', surface: 'lowBranch', state: 'perched', contact: 'branchGrip' },
    { name: 'tall-grass', location: 0, id: 'matsu', species: 'crane', surface: 'tallGrass', state: 'concealed', contact: 'concealedBaseline' },
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
      await expect.poll(async () => Number(await surface.getAttribute('data-contact-world-x'))).toBeGreaterThanOrEqual(0);
      await expect.poll(async () => Number(await surface.getAttribute('data-contact-world-x'))).toBeLessThanOrEqual(390);
      await page.setViewportSize({ width: 1280, height: 720 });
    }
    await page.screenshot({ path: testInfo.outputPath(`surface-contact-${scenario.name}.png`) });
  }
});

test('field guide, manifest, and responsive mobile layout', async ({ page }) => {
  await page.locator('[data-go="guide"]').first().click();
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
