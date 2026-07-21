import type { BirdState } from '../core/birds/bird-state';
import type { BirdFamily } from './bird-behaviors';

export interface BirdAnimationDefinition {
  frames: readonly string[];
  frameRate: number;
  repeat: number;
}

export interface BirdStateVisual {
  scale: number;
  origin: readonly [number, number];
  hitbox: readonly [number, number];
  occlusion: number;
  depth: number;
}

export interface BirdSpriteDefinition {
  speciesId: string;
  textureKey: string;
  imagePath: string;
  atlasPath: string;
  previewPath: string;
  family: BirdFamily;
  variants: readonly [string, string];
  frameSize: number;
  animations: Readonly<Partial<Record<BirdState, BirdAnimationDefinition>>>;
  visuals: Readonly<Partial<Record<BirdState, BirdStateVisual>>>;
  targetableStates: readonly BirdState[];
}

const targetableStates: BirdState[] = [
  'resting', 'foraging', 'walking', 'swimming', 'diving', 'perched', 'alert',
  'standingBonus', 'preTakeoff', 'takeoff', 'flying', 'distant', 'banking',
  'climbing', 'descending', 'landing', 'settled', 'returning',
];

const anim = (frames: readonly string[], frameRate = 7, repeat = -1): BirdAnimationDefinition => ({ frames, frameRate, repeat });
const animations: BirdSpriteDefinition['animations'] = {
  concealed: anim(['concealed'], 2), resting: anim(['resting', 'foraging'], 2),
  foraging: anim(['foraging', 'resting'], 3), walking: anim(['walking', 'foraging'], 4),
  swimming: anim(['swimming', 'resting'], 3), diving: anim(['preDive', 'diving', 'surfacing'], 5),
  perched: anim(['resting', 'alert'], 2), alert: anim(['alert', 'alert-call'], 4),
  revealing: anim(['revealing', 'standingBonus'], 3, 0), standingBonus: anim(['standingBonus', 'standing'], 2),
  preTakeoff: anim(['preTakeoff', 'walking'], 6, 0), takeoff: anim(['takeoff', 'flying-up'], 8),
  flying: anim(['flying-up', 'flying', 'flying-down', 'flying'], 9),
  distant: anim(['flying-up', 'flying', 'flying-down'], 7), banking: anim(['banking', 'flying'], 7),
  climbing: anim(['climbing', 'flying-up'], 8), descending: anim(['descending', 'glide', 'flying-down'], 7),
  landing: anim(['landing', 'resting'], 5, 0), settled: anim(['resting', 'foraging'], 2),
  returning: anim(['banking', 'flying', 'flying-down'], 7), hit: anim(['hit'], 1, 0),
  falling: anim(['falling', 'hit'], 5),
};

function stateVisuals(scale: number, crane = false): BirdSpriteDefinition['visuals'] {
  const groundScale = crane ? scale * 1.06 : scale;
  const make = (value: number, hitbox: readonly [number, number], occlusion: number, depth: number): BirdStateVisual => ({ scale: value, origin: [0.5, 0.72], hitbox, occlusion, depth });
  return {
    concealed: make(groundScale, crane ? [62, 72] : [54, 38], 0.82, 32),
    resting: make(groundScale, crane ? [70, 112] : [66, 44], 0.12, 42),
    foraging: make(groundScale, crane ? [82, 104] : [68, 45], 0.18, 42),
    walking: make(groundScale, crane ? [72, 118] : [62, 48], 0.1, 42),
    swimming: make(scale, [68, 42], 0.18, 42), diving: make(scale, [58, 48], 0.35, 40),
    perched: make(scale, [58, 52], 0.2, 45), alert: make(groundScale, crane ? [68, 130] : [62, 54], 0.08, 45),
    revealing: make(groundScale, [76, 122], 0.55, 44), standingBonus: make(groundScale, [76, 136], 0.03, 46),
    preTakeoff: make(scale, [70, 58], 0.04, 47), takeoff: make(scale, [76, 70], 0, 50),
    flying: make(scale, crane ? [98, 65] : [82, 55], 0, 50), distant: make(scale * 0.72, [58, 40], 0, 25),
    banking: make(scale, [78, 62], 0, 51), climbing: make(scale, [76, 64], 0, 51),
    descending: make(scale, [76, 60], 0, 49), landing: make(scale, [78, 62], 0.05, 46),
    settled: make(groundScale, [64, 44], 0.18, 42), returning: make(scale * 0.86, [70, 50], 0, 35),
    hit: make(scale, [70, 62], 0, 52), falling: make(scale, [64, 68], 0, 52),
  };
}

const rows = [
  ['mallard', 'dabbler', ['drake', 'hen'], 0.72], ['pintail', 'dabbler', ['drake', 'hen'], 0.76],
  ['wigeon', 'dabbler', ['drake', 'hen'], 0.7], ['teal', 'dabbler', ['drake', 'hen'], 0.58],
  ['scaup', 'diver', ['drake', 'hen'], 0.7], ['eider', 'seaDuck', ['drake', 'hen'], 0.8],
  ['harlequin', 'seaDuck', ['drake', 'hen'], 0.62], ['goldeneye', 'diver', ['drake', 'hen'], 0.66],
  ['goose', 'goose', ['adult', 'juvenile'], 0.86], ['canada-goose', 'goose', ['adult', 'small-adult'], 0.9],
  ['snow-goose', 'goose', ['white', 'blue'], 0.88], ['brant', 'goose', ['adult', 'small-adult'], 0.78],
  ['crane', 'crane', ['gray-adult', 'rust-stained'], 0.72], ['grouse', 'upland', ['male', 'female'], 0.66],
  ['ptarmigan', 'upland', ['summer', 'winter'], 0.66], ['spectacled', 'seaDuck', ['drake', 'hen'], 0.74],
] as const satisfies readonly (readonly [string, BirdFamily, readonly [string, string], number])[];

export const birdSprites: readonly BirdSpriteDefinition[] = rows.map(([speciesId, family, variants, scale]) => ({
  speciesId,
  textureKey: `bird-${speciesId}-atlas`,
  imagePath: `assets/birds/${speciesId}/atlas.png`,
  atlasPath: `assets/birds/${speciesId}/atlas.json`,
  previewPath: `assets/birds/${speciesId}/preview.png`,
  family,
  variants,
  frameSize: speciesId === 'crane' ? 192 : 128,
  animations,
  visuals: stateVisuals(scale, speciesId === 'crane'),
  targetableStates,
}));

export const birdSpriteBySpecies = new Map(birdSprites.map((definition) => [definition.speciesId, definition] as const));

export function frameFor(definition: BirdSpriteDefinition, variant: string, pose: string): string {
  const atlasVariant = definition.variants.includes(variant as never) ? variant : definition.variants[0];
  return `${atlasVariant}/${pose}/0`;
}
