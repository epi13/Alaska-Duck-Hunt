import type { BirdState } from '../core/birds/bird-state';
import type { BirdFamily } from './bird-behaviors';
import type { AuthoredFacing } from '../core/birds/bird-facing';
import type { SpriteContactType } from '../core/birds/bird-placement';
import type { NormalizedPoint } from '../core/scenes/scene-map';
import type { IndividualVisualVariant } from '../core/birds/bird-plan';

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
  contacts: Readonly<Partial<Record<SpriteContactType, NormalizedPoint>>>;
}

export interface BirdSpriteDefinition {
  speciesId: string;
  textureKey: string;
  imagePath: string;
  atlasPath: string;
  previewPath: string;
  family: BirdFamily;
  authoredFacing: AuthoredFacing;
  biologicalVariants: readonly [string, string];
  individualVisualVariants: readonly [IndividualVisualVariant, IndividualVisualVariant];
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
  const contact = {
    feet: { x: .5, y: crane ? .87 : .79 },
    belly: { x: .5, y: crane ? .8 : .72 },
    waterline: { x: .5, y: crane ? .73 : .62 },
    branchGrip: { x: .5, y: crane ? .84 : .76 },
    concealedBaseline: { x: .5, y: crane ? .76 : .74 },
    airborneCenter: { x: .5, y: .5 },
  } as const satisfies Record<SpriteContactType, NormalizedPoint>;
  const contacts = (...types: readonly SpriteContactType[]) => Object.fromEntries(types.map((type) => [type, contact[type]])) as BirdStateVisual['contacts'];
  const surfaceContacts = contacts('feet', 'belly', 'waterline', 'branchGrip');
  const make = (value: number, hitbox: readonly [number, number], occlusion: number, depth: number, stateContacts: BirdStateVisual['contacts']): BirdStateVisual => ({ scale: value, origin: [0.5, 0.72], hitbox, occlusion, depth, contacts: stateContacts });
  return {
    concealed: make(groundScale, crane ? [62, 72] : [54, 38], 0.82, 32, contacts('concealedBaseline')),
    resting: make(groundScale, crane ? [70, 112] : [66, 44], 0.12, 42, surfaceContacts),
    foraging: make(groundScale, crane ? [82, 104] : [68, 45], 0.18, 42, contacts('belly')),
    walking: make(groundScale, crane ? [72, 118] : [62, 48], 0.1, 42, contacts('feet')),
    swimming: make(scale, [68, 42], 0.18, 42, contacts('waterline')), diving: make(scale, [58, 48], 0.35, 40, contacts('waterline')),
    perched: make(scale, [58, 52], 0.2, 45, contacts('branchGrip')), alert: make(groundScale, crane ? [68, 130] : [62, 54], 0.08, 45, surfaceContacts),
    revealing: make(groundScale, [76, 122], 0.55, 44, contacts('concealedBaseline')), standingBonus: make(groundScale, [76, 136], 0.03, 46, contacts('feet')),
    preTakeoff: make(scale, [70, 58], 0.04, 47, surfaceContacts), takeoff: make(scale, [76, 70], 0, 50, contacts('airborneCenter')),
    flying: make(scale, crane ? [98, 65] : [82, 55], 0, 50, contacts('airborneCenter')), distant: make(scale * 0.72, [58, 40], 0, 25, contacts('airborneCenter')),
    banking: make(scale, [78, 62], 0, 51, contacts('airborneCenter')), climbing: make(scale, [76, 64], 0, 51, contacts('airborneCenter')),
    descending: make(scale, [76, 60], 0, 49, contacts('airborneCenter')), landing: make(scale, [78, 62], 0.05, 46, surfaceContacts),
    settled: make(groundScale, [64, 44], 0.18, 42, surfaceContacts), returning: make(scale * 0.86, [70, 50], 0, 35, contacts('airborneCenter')),
    hit: make(scale, [70, 62], 0, 52, contacts('airborneCenter')), falling: make(scale, [64, 68], 0, 52, contacts('airborneCenter')),
  };
}

const rows = [
  ['mallard', 'dabbler', ['drake', 'hen'], 0.72, 'right'], ['pintail', 'dabbler', ['drake', 'hen'], 0.76, 'left'],
  ['wigeon', 'dabbler', ['drake', 'hen'], 0.7, 'left'], ['teal', 'dabbler', ['drake', 'hen'], 0.58, 'left'],
  ['scaup', 'diver', ['drake', 'hen'], 0.7, 'right'], ['eider', 'seaDuck', ['drake', 'hen'], 0.8, 'right'],
  ['harlequin', 'seaDuck', ['drake', 'hen'], 0.62, 'left'], ['goldeneye', 'diver', ['drake', 'hen'], 0.66, 'right'],
  ['goose', 'goose', ['adult', 'juvenile'], 0.86, 'right'], ['canada-goose', 'goose', ['adult', 'juvenile'], 0.9, 'left'],
  ['snow-goose', 'goose', ['white', 'blue'], 0.88, 'left'], ['brant', 'goose', ['adult', 'juvenile'], 0.78, 'left'],
  ['crane', 'crane', ['gray-adult', 'rust-stained'], 0.72, 'right'], ['grouse', 'upland', ['male', 'female'], 0.66, 'right'],
  ['ptarmigan', 'upland', ['summer', 'winter'], 0.66, 'right'], ['spectacled', 'seaDuck', ['drake', 'hen'], 0.74, 'right'],
] as const satisfies readonly (readonly [string, BirdFamily, readonly [string, string], number, AuthoredFacing])[];

export const birdSprites: readonly BirdSpriteDefinition[] = rows.map(([speciesId, family, biologicalVariants, scale, authoredFacing]) => ({
  speciesId,
  textureKey: `bird-${speciesId}-atlas`,
  imagePath: `assets/birds/${speciesId}/atlas.png`,
  atlasPath: `assets/birds/${speciesId}/atlas.json`,
  previewPath: `assets/birds/${speciesId}/preview.png`,
  family,
  authoredFacing,
  biologicalVariants,
  individualVisualVariants: ['natural', 'alternate'],
  frameSize: speciesId === 'crane' ? 192 : 128,
  animations,
  visuals: stateVisuals(scale, speciesId === 'crane'),
  targetableStates,
}));

export const birdSpriteBySpecies = new Map(birdSprites.map((definition) => [definition.speciesId, definition] as const));

export function frameFor(
  definition: BirdSpriteDefinition,
  biologicalVariant: string,
  individualVisualVariant: IndividualVisualVariant,
  pose: string,
): string {
  const atlasBiologicalVariant = definition.biologicalVariants.includes(biologicalVariant as never)
    ? biologicalVariant
    : definition.biologicalVariants[0];
  const atlasVisualVariant = definition.individualVisualVariants.includes(individualVisualVariant)
    ? individualVisualVariant
    : definition.individualVisualVariants[0];
  return `${atlasBiologicalVariant}/${atlasVisualVariant}/${pose}/0`;
}

export function contactAnchorFor(definition: BirdSpriteDefinition, state: BirdState, type: SpriteContactType): NormalizedPoint {
  const anchor = definition.visuals[state]?.contacts[type];
  if (!anchor) throw new Error(`${definition.speciesId}/${state} is missing ${type} contact anchor.`);
  return anchor;
}
