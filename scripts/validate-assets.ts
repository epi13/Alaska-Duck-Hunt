import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { birdBehaviorBySpecies } from '../src/data/bird-behaviors';
import { birdPlacementCompatibility } from '../src/core/birds/bird-placement';
import { birdScoringBySpecies, scoreBird } from '../src/data/bird-scoring';
import { birdSprites, contactAnchorFor } from '../src/data/bird-sprites';
import { species } from '../src/data/content';
import { sceneMaps } from '../src/data/scene-maps';
import { validateSceneMap } from '../src/core/scenes/scene-map';
import { validateScenePropLayout } from '../src/core/scenes/scene-props';
import { scenePropLayoutByLocation, scenePropLayouts } from '../src/data/scene-props';
import { huskySprite } from '../src/data/husky-sprites';
import { audioAssets } from '../src/data/audio-assets';

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
  if (signature !== 'PNG' || width !== expectedHeight * 4 || height !== expectedHeight) {
    throw new Error(`${path} must be a ${expectedHeight * 4}x${expectedHeight} transparent PNG atlas.`);
  }
  if (!pngHasAlpha(png)) throw new Error(`${path} must preserve an alpha channel.`);
  const atlas = JSON.parse(await readFile(`public/assets/birds/${id}/atlas.json`, 'utf8')) as {
    frames?: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
    meta?: {
      speciesId?: string;
      biologicalVariants?: string[];
      individualVisualVariants?: string[];
      assetBudget?: {
        biologicalVariants?: number;
        individualTreatmentsPerVariant?: number;
        framesPerTreatment?: number;
        totalFrames?: number;
      };
    };
  };
  const definition = birdSprites.find((entry) => entry.speciesId === id)!;
  const expectedFrameCount = definition.biologicalVariants.length * definition.individualVisualVariants.length * 16;
  if (atlas.meta?.speciesId !== id
    || JSON.stringify(atlas.meta.biologicalVariants) !== JSON.stringify(definition.biologicalVariants)
    || JSON.stringify(atlas.meta.individualVisualVariants) !== JSON.stringify(definition.individualVisualVariants)
    || atlas.meta.assetBudget?.biologicalVariants !== 2
    || atlas.meta.assetBudget.individualTreatmentsPerVariant !== 2
    || atlas.meta.assetBudget.framesPerTreatment !== 16
    || atlas.meta.assetBudget.totalFrames !== expectedFrameCount
    || Object.keys(atlas.frames ?? {}).length !== expectedFrameCount) {
    throw new Error(`${id} atlas must stay within the two-biological-by-two-individual treatment budget (${expectedFrameCount} named frames).`);
  }
  for (const [name, value] of Object.entries(atlas.frames ?? {})) {
    const frame = value.frame;
    if (!/^[-a-z]+\/(?:natural|alternate)\/[-A-Za-z]+\/\d+$/.test(name) || frame.x < 0 || frame.y < 0 || frame.w <= 0 || frame.h <= 0 || frame.x + frame.w > width || frame.y + frame.h > height) throw new Error(`${id} has an invalid or out-of-bounds atlas frame: ${name}.`);
  }
  const requiredStates = id === 'crane'
    ? ['concealed', 'revealing', 'standingBonus', 'alert', 'preTakeoff', 'takeoff', 'flying', 'landing', 'hit', 'falling']
    : ['resting', 'alert', 'preTakeoff', 'takeoff', 'flying', 'landing', 'hit', 'falling'];
  for (const biologicalVariant of definition.biologicalVariants) for (const individualVisualVariant of definition.individualVisualVariants) for (const state of requiredStates) {
    const name = `${biologicalVariant}/${individualVisualVariant}/${state}/0`;
    if (!atlas.frames?.[name]) throw new Error(`${id} is missing required individual variant frame ${name}.`);
  }
  const preview = pngSize(await readFile(`public/assets/birds/${id}/preview.png`));
  const frameSize = expectedHeight / 4;
  if (preview.width !== frameSize * 4 || preview.height !== frameSize) throw new Error(`${id} preview strip is invalid.`);

  if (definition.imagePath !== `assets/birds/${id}/atlas.png` || definition.atlasPath !== `assets/birds/${id}/atlas.json`) throw new Error(`${id} runtime paths do not match the production atlas.`);
  for (const [state, visual] of Object.entries(definition.visuals)) if (!visual || visual.hitbox[0] <= 0 || visual.hitbox[1] <= 0 || visual.occlusion < 0 || visual.occlusion > 1) throw new Error(`${id}/${state} has invalid state-specific visual metadata.`);

  const behavior = birdBehaviorBySpecies.get(id);
  if (!behavior) throw new Error(`${id} has no behavior profile.`);
  const compatibleStarts = behavior.surfaces.flatMap((surface) => behavior.initialStates.map((state) => ({
    surface,
    state,
    compatibility: birdPlacementCompatibility(id, behavior.family, state, surface),
  }))).filter(({ compatibility }) => compatibility.compatible);
  if (!compatibleStarts.length) throw new Error(`${id} has no compatible surface-state starts.`);
  for (const { state, compatibility } of compatibleStarts) {
    const anchor = contactAnchorFor(definition, state, compatibility.contact);
    if (![anchor.x, anchor.y].every((coordinate) => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1)) {
      throw new Error(`${id}/${state} has an invalid ${compatibility.contact} contact anchor.`);
    }
  }
  for (const surface of behavior.surfaces) {
    const settled = birdPlacementCompatibility(id, behavior.family, 'settled', surface);
    if (settled.compatible) contactAnchorFor(definition, 'settled', settled.contact);
  }
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
if (!viteConfig.includes('png,svg,json,ogg')) throw new Error('PWA precache glob must include atlas PNG, JSON metadata, and offline Ogg audio.');

const audioManifest = JSON.parse(await readFile('assets/generated/audio/manifest.json', 'utf8')) as {
  generatedAt?: string;
  assets?: Array<{
    id?: string;
    masterPath?: string;
    processedPath?: string;
    masterSha256?: string;
    processedSha256?: string;
    originalProceduralSynthesis?: boolean;
    externalRecordingUsed?: boolean;
    license?: string;
  }>;
};
await access('AUDIO_SOURCES_AND_LICENSES.md');
if (audioManifest.generatedAt !== '2026-07-22' || audioManifest.assets?.length !== audioAssets.length) {
  throw new Error('Audio provenance manifest must cover every production cue.');
}
const declaredAudioFiles = new Set<string>();
for (const definition of audioAssets) {
  const entry = audioManifest.assets.find(({ id }) => id === definition.id);
  const expectedProcessedPath = `public/${definition.path}`;
  if (!entry
    || entry.masterPath !== definition.masterPath
    || entry.processedPath !== expectedProcessedPath
    || entry.originalProceduralSynthesis !== true
    || entry.externalRecordingUsed !== false
    || !entry.license?.includes('MIT')) {
    throw new Error(`${definition.id} has incomplete or unsafe audio provenance.`);
  }
  const master = await readFile(definition.masterPath);
  const processed = await readFile(expectedProcessedPath);
  if (master.subarray(0, 4).toString('ascii') !== 'RIFF' || processed.subarray(0, 4).toString('ascii') !== 'OggS') {
    throw new Error(`${definition.id} must retain a WAV master and ship an Ogg derivative.`);
  }
  if (createHash('sha256').update(master).digest('hex') !== entry.masterSha256
    || createHash('sha256').update(processed).digest('hex') !== entry.processedSha256) {
    throw new Error(`${definition.id} does not match its licensed audio checksum.`);
  }
  declaredAudioFiles.add(`${definition.id}.ogg`);
}
const shippedAudioFiles = (await readdir('public/assets/audio')).filter((name) => name.endsWith('.ogg'));
if (shippedAudioFiles.length !== declaredAudioFiles.size || shippedAudioFiles.some((name) => !declaredAudioFiles.has(name))) {
  throw new Error('Every shipped audio file must be declared in the typed and licensed manifests.');
}

for (const id of locationIds) {
  const path = `public/assets/scenes/${id}.png`;
  const { width, height } = pngSize(await readFile(path));
  if (width !== 1280 || height !== 720) {
    throw new Error(`${path} must be a 1280x720 PNG scene plate.`);
  }
}

if (sceneMaps.map(({ locationId }) => locationId).join(',') !== locationIds.join(',')) throw new Error('Scene-map catalog must cover all locations in canonical order.');
for (const map of sceneMaps) {
  const errors = validateSceneMap(map);
  if (errors.length) throw new Error(`Invalid ${map.locationId} scene map: ${errors.join(' ')}`);
}
if (scenePropLayouts.map(({ locationId }) => locationId).join(',') !== locationIds.join(',')) throw new Error('Scene-prop catalog must cover all locations in canonical order.');
for (const map of sceneMaps) {
  const layout = scenePropLayoutByLocation.get(map.locationId);
  if (!layout) throw new Error(`${map.locationId} has no prop layout.`);
  const invalid = validateScenePropLayout(layout, map).filter(({ valid }) => !valid);
  if (invalid.length) throw new Error(`Invalid ${map.locationId} prop placements: ${invalid.map(({ placementId, errors }) => `${placementId}: ${errors.join(', ')}`).join('; ')}`);
}

const huskyPng = await readFile(`public/${huskySprite.imagePath}`);
const huskySize = pngSize(huskyPng);
if (huskySize.width !== 512 || huskySize.height !== 512 || !pngHasAlpha(huskyPng)) {
  throw new Error('The Alaskan Husky production atlas must be a 512x512 alpha PNG.');
}
const huskyAtlas = JSON.parse(await readFile(`public/${huskySprite.atlasPath}`, 'utf8')) as {
  frames?: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
  meta?: { characterId?: string; canonicalFacing?: string; contactAnchor?: { x?: number; y?: number } };
};
const expectedHuskyFrames = huskySprite.animations.flatMap(({ frames }) => frames);
if (huskyAtlas.meta?.characterId !== huskySprite.characterId
  || huskyAtlas.meta.canonicalFacing !== huskySprite.canonicalFacing
  || huskyAtlas.meta.contactAnchor?.x !== huskySprite.contactAnchor.x
  || huskyAtlas.meta.contactAnchor.y !== huskySprite.contactAnchor.y
  || Object.keys(huskyAtlas.frames ?? {}).length !== 16
  || expectedHuskyFrames.some((frame) => !huskyAtlas.frames?.[frame])) {
  throw new Error('The Alaskan Husky atlas metadata does not match its typed runtime manifest.');
}
for (const [name, value] of Object.entries(huskyAtlas.frames ?? {})) {
  const frame = value.frame;
  if (frame.w !== 128 || frame.h !== 128 || frame.x < 0 || frame.y < 0 || frame.x + frame.w > 512 || frame.y + frame.h > 512) {
    throw new Error(`Alaskan Husky frame ${name} must be a valid 128x128 atlas cell.`);
  }
}
const huskyPreview = pngSize(await readFile(`public/${huskySprite.previewPath}`));
if (huskyPreview.width !== 512 || huskyPreview.height !== 128) throw new Error('The Alaskan Husky preview must be 512x128.');
for (const path of [
  'assets/generated/characters/alaska-husky/ART_BRIEF_AND_PROMPT.md',
  'assets/generated/characters/alaska-husky/keyed/alaska-husky-master.png',
  'assets/generated/characters/alaska-husky/processed/alaska-husky-atlas.png',
  'assets/references/Alaskan_Husky_Working_Dog/SOURCES_AND_LICENSES.md',
  'assets/references/Alaskan_Husky_Working_Dog/denali-husky-conformation.jpg',
  'assets/references/Alaskan_Husky_Working_Dog/denali-working-dog-movement.webp',
]) await access(path);
const huskyValidation = JSON.parse(await readFile('assets/generated/characters/alaska-husky/validation.json', 'utf8')) as {
  characterId?: string;
  checks?: { alphaValues?: number[]; maximumColorsPerFrameIncludingTransparency?: number; normalizedPawBaselineY?: number; proprietarySourceArtworkUsed?: boolean };
  sha256?: Record<string, string>;
};
if (huskyValidation.characterId !== huskySprite.characterId
  || huskyValidation.checks?.alphaValues?.join(',') !== '0,255'
  || huskyValidation.checks.maximumColorsPerFrameIncludingTransparency !== 32
  || huskyValidation.checks.normalizedPawBaselineY !== huskySprite.contactAnchor.y * 128
  || huskyValidation.checks.proprietarySourceArtworkUsed !== false) {
  throw new Error('The Alaskan Husky validation record is incomplete.');
}
for (const [relativePath, expectedHash] of Object.entries(huskyValidation.sha256 ?? {})) {
  const path = relativePath.startsWith('public/') ? relativePath : `assets/generated/characters/alaska-husky/${relativePath}`;
  const actualHash = createHash('sha256').update(await readFile(path)).digest('hex');
  if (actualHash !== expectedHash) throw new Error(`Alaskan Husky asset checksum changed without updating its validation record: ${path}`);
}

for (const [path, width, height] of [
  ['public/assets/habitat/wetland.png', 1024, 512],
  ['public/assets/habitat/forest.png', 1024, 512],
  ['public/assets/habitat/arctic.png', 1024, 512],
] as const) {
  const actual = pngSize(await readFile(path));
  if (actual.width !== width || actual.height !== height) {
    throw new Error(`${path} must be ${width}x${height}.`);
  }
}

const regionalHabitatAtlases = [
  'southcentral-wetland',
  'coastal-delta',
  'western-tundra',
  'boreal-interior',
  'southeast-rainforest',
  'arctic-alpine',
  'aleutian-coast',
  'winter-willow',
];
for (const id of regionalHabitatAtlases) {
  const path = `public/assets/habitat/regions/${id}.png`;
  const png = await readFile(path);
  const actual = pngSize(png);
  if (actual.width !== 1024 || actual.height !== 1024 || !pngHasAlpha(png)) {
    throw new Error(`${path} must be a 1024x1024 alpha PNG.`);
  }
}

console.log(`Required original assets are present: ${birdIds.length} named bird atlases, ${locationIds.length} scene plates, the named Alaskan Husky atlas/source/reference set, three legacy habitat atlases, and ${regionalHabitatAtlases.length} regional habitat atlases.`);
