import { access, readFile, readdir } from 'node:fs/promises';
import { birdBehaviorBySpecies } from '../src/data/bird-behaviors';
import { birdScoringBySpecies, scoreBird } from '../src/data/bird-scoring';
import { birdSprites } from '../src/data/bird-sprites';
import { species } from '../src/data/content';

const birdIds = birdSprites.map((definition) => definition.speciesId);
if (new Set(birdIds).size !== birdIds.length || new Set(species.map((entry) => entry.id)).size !== species.length) throw new Error('Species and sprite ids must be unique.');
if (birdIds.length !== species.length || species.some((entry) => !birdIds.includes(entry.id))) throw new Error('Every content species, target or protected, must have one production sprite definition.');
const locationIds = [
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
];

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

function pngHasAlpha(png: Buffer) {
  return [4, 6].includes(png[25] ?? -1);
}

for (const path of ['public/assets/icon.svg', 'docs/images/gameplay-concept.png']) {
  await access(path);
}

for (const id of birdIds) {
  const path = `public/assets/birds/${id}/atlas.png`;
  const png = await readFile(path);
  const signature = png.subarray(1, 4).toString('ascii');
  const { width, height } = pngSize(png);
  const expectedHeight = id === 'crane' ? 768 : 512;
  if (signature !== 'PNG' || width !== expectedHeight * 2 || height !== expectedHeight) {
    throw new Error(`${path} must be a ${expectedHeight * 2}x${expectedHeight} transparent PNG atlas.`);
  }
  if (!pngHasAlpha(png)) throw new Error(`${path} must preserve an alpha channel.`);
  const atlas = JSON.parse(await readFile(`public/assets/birds/${id}/atlas.json`, 'utf8')) as { frames?: Record<string, { frame: { x: number; y: number; w: number; h: number } }>; meta?: { speciesId?: string; variants?: string[] } };
  if (atlas.meta?.speciesId !== id || atlas.meta.variants?.length !== 2 || Object.keys(atlas.frames ?? {}).length !== 32) throw new Error(`${id} atlas metadata must contain two variants and 32 named frames.`);
  for (const [name, value] of Object.entries(atlas.frames ?? {})) {
    const frame = value.frame;
    if (!/^[-a-z]+\/[-A-Za-z]+\/\d+$/.test(name) || frame.x < 0 || frame.y < 0 || frame.w <= 0 || frame.h <= 0 || frame.x + frame.w > width || frame.y + frame.h > height) throw new Error(`${id} has an invalid or out-of-bounds atlas frame: ${name}.`);
  }
  const requiredStates = id === 'crane'
    ? ['concealed', 'revealing', 'standingBonus', 'alert', 'preTakeoff', 'takeoff', 'flying', 'landing', 'hit', 'falling']
    : ['resting', 'alert', 'preTakeoff', 'takeoff', 'flying', 'landing', 'hit', 'falling'];
  for (const state of requiredStates) {
    if (!Object.keys(atlas.frames ?? {}).some((frame) => frame.includes(`/${state}/`))) throw new Error(`${id} is missing required ${state} frame.`);
  }
  const preview = pngSize(await readFile(`public/assets/birds/${id}/preview.png`));
  const frameSize = expectedHeight / 4;
  if (preview.width !== frameSize * 4 || preview.height !== frameSize) throw new Error(`${id} preview strip is invalid.`);

  const definition = birdSprites.find((entry) => entry.speciesId === id)!;
  if (definition.imagePath !== `assets/birds/${id}/atlas.png` || definition.atlasPath !== `assets/birds/${id}/atlas.json`) throw new Error(`${id} runtime paths do not match the production atlas.`);
  for (const [state, visual] of Object.entries(definition.visuals)) if (!visual || visual.hitbox[0] <= 0 || visual.hitbox[1] <= 0 || visual.occlusion < 0 || visual.occlusion > 1) throw new Error(`${id}/${state} has invalid state-specific visual metadata.`);

  const behavior = birdBehaviorBySpecies.get(id);
  if (!behavior) throw new Error(`${id} has no behavior profile.`);
  const waterFamily = ['dabbler', 'diver', 'seaDuck', 'goose'].includes(behavior.family);
  if (waterFamily && !behavior.surfaces.some((surface) => ['openWater', 'shallowWater', 'mudflat', 'shoreline', 'rockyCoast', 'riverEdge', 'marshGrass'].includes(surface))) throw new Error(`${id} lacks an appropriate water/shoreline start surface.`);
}

const protectedSpecies = species.filter((entry) => !entry.target);
if (protectedSpecies.length !== 1 || protectedSpecies[0]?.id !== 'spectacled' || birdScoringBySpecies.get('spectacled')?.role !== 'protected') throw new Error('Spectacled Eider must be the illustrated protected role.');
const craneStanding = scoreBird({ speciesId: 'crane', state: 'standingBonus', distance: 0.5, speedRatio: 1, combo: 0 });
const craneAirborne = scoreBird({ speciesId: 'crane', state: 'flying', distance: 0.5, speedRatio: 1, combo: 0 });
if (craneStanding.points <= craneAirborne.points || !craneStanding.label) throw new Error('Crane upright scoring must exceed airborne scoring and include a bonus label.');
const craneVisual = birdSprites.find((entry) => entry.speciesId === 'crane')!;
if (JSON.stringify(craneVisual.visuals.standingBonus?.hitbox) === JSON.stringify(craneVisual.visuals.flying?.hitbox)) throw new Error('Crane upright and airborne hitboxes must differ.');

for (const rootEntry of await readdir('public/assets/birds', { withFileTypes: true })) if (rootEntry.isFile()) throw new Error(`Obsolete flat bird sheet remains in production: ${rootEntry.name}.`);
const spriteSource = await readFile('src/data/bird-sprites.ts', 'utf8');
if (/assets\/birds\/[a-z-]+\.png/.test(spriteSource)) throw new Error('Runtime still references an obsolete flat bird sheet.');
const viteConfig = await readFile('vite.config.ts', 'utf8');
if (!viteConfig.includes('png,svg,json')) throw new Error('PWA precache glob must include atlas PNG and JSON metadata.');

for (const id of locationIds) {
  const path = `public/assets/scenes/${id}.png`;
  const { width, height } = pngSize(await readFile(path));
  if (width !== 1280 || height !== 720) {
    throw new Error(`${path} must be a 1280x720 PNG scene plate.`);
  }
}

for (const [path, width, height] of [
  ['public/assets/characters/retriever.png', 512, 512],
  ['public/assets/habitat/wetland.png', 1024, 512],
  ['public/assets/habitat/forest.png', 1024, 512],
  ['public/assets/habitat/arctic.png', 1024, 512],
] as const) {
  const actual = pngSize(await readFile(path));
  if (actual.width !== width || actual.height !== height) {
    throw new Error(`${path} must be ${width}x${height}.`);
  }
}

console.log(`Required original assets are present: ${birdIds.length} named bird atlases, ${locationIds.length} scene plates, one dog sheet, and three habitat atlases.`);
