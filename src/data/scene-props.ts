import type { ScenePropLayout, ScenePropPlacement, ScenePropType, ScenePropLayer, WindResponse, BirdPropRelation, DogPropPass, PropOcclusionBounds } from '../core/scenes/scene-props';
import type { HabitatAtlas } from './scene-art';

type Pair = readonly [number, number];
const bounds = (width: number, height: number, lift = 0): PropOcclusionBounds =>
  ({ kind: 'bounds', offsetX: -width / 2, offsetY: -height * .9 - lift, width, height });
const prop = (
  id: string,
  atlas: HabitatAtlas,
  frame: number,
  type: ScenePropType,
  [x, y]: Pair,
  surfaceRegionId: string,
  layer: ScenePropLayer,
  perspectiveDepth: number,
  baseScale: number,
  occlusion: PropOcclusionBounds,
  wind: WindResponse,
  birdRelations: readonly BirdPropRelation[],
  dogPass: DogPropPass,
  options: Partial<Pick<ScenePropPlacement, 'origin' | 'flip' | 'rotation' | 'aspectScaleY' | 'occlusionStrength'>> = {},
): ScenePropPlacement => ({
  id, atlas, frame, type, anchor: { x, y }, surfaceRegionId, layer, perspectiveDepth, baseScale,
  origin: options.origin ?? [.5, 1], occlusion, occlusionStrength: options.occlusionStrength ?? (layer === 'foreground' ? .78 : layer === 'gameplay-cover' ? .52 : .25),
  wind, birdRelations, dogPass, ...options,
});
const layout = (locationId: string, placements: readonly ScenePropPlacement[]): ScenePropLayout => ({ locationId, placements });

export const scenePropLayouts = [
  layout('matsu', [
    prop('matsu-far-sedge', 'southcentral-wetland', 1, 'sedge', [.4,.84], 'matsu-sedge', 'background-detail', .48, .34, bounds(.045,.075), 'light', ['beside'], 'front'),
    prop('matsu-pond-reeds', 'southcentral-wetland', 0, 'reed', [.38,.84], 'matsu-sedge', 'midground', .62, .52, bounds(.065,.15), 'moderate', ['behind','beside'], 'both', { rotation: -2 }),
    prop('matsu-water-sedge', 'southcentral-wetland', 11, 'aquaticPlant', [.67,.76], 'matsu-waterline', 'gameplay-cover', .58, .6, bounds(.08,.1), 'moderate', ['behind','beside'], 'both', { flip: true }),
    prop('matsu-spruce', 'southcentral-wetland', 5, 'conifer', [.12,.87], 'matsu-spruce-floor', 'midground', .72, .65, bounds(.08,.2), 'light', ['behind','beside'], 'behind'),
    prop('matsu-fallen-root', 'southcentral-wetland', 9, 'branch', [.31,.75], 'matsu-fallen-spruce', 'gameplay-cover', .7, .72, bounds(.13,.055), 'none', ['behind','on','beside'], 'both', { rotation: 3 }),
    prop('matsu-meadow-willow', 'southcentral-wetland', 6, 'willow', [.72,.88], 'matsu-tall-meadow', 'foreground', .86, .78, bounds(.11,.17), 'light', ['behind','beside'], 'both'),
    prop('matsu-near-grass', 'southcentral-wetland', 3, 'grass', [.9,.9], 'matsu-tall-meadow', 'foreground', .94, .9, bounds(.12,.18), 'strong', ['behind','beside'], 'both', { flip: true, rotation: 2 }),
    prop('matsu-pond-edge', 'southcentral-wetland', 13, 'shorelineEdge', [.82,.78], 'matsu-waterline', 'gameplay-cover', .66, .72, bounds(.18,.035), 'light', ['behind','beside'], 'both', { aspectScaleY: .55, occlusionStrength: .34 }),
  ]),

  layout('cook', [
    prop('cook-far-saltgrass', 'coastal-delta', 2, 'grass', [.66,.82], 'cook-main-mudflat', 'background-detail', .42, .32, bounds(.045,.07), 'moderate', ['beside'], 'front'),
    prop('cook-channel-bulrush', 'coastal-delta', 0, 'reed', [.28,.84], 'cook-saltmarsh', 'midground', .66, .56, bounds(.07,.16), 'strong', ['behind','beside'], 'both', { rotation: -3 }),
    prop('cook-mudflat-rocks', 'coastal-delta', 8, 'rock', [.58,.82], 'cook-main-mudflat', 'midground', .7, .56, bounds(.09,.065), 'none', ['beside','on'], 'front'),
    prop('cook-driftwood', 'coastal-delta', 9, 'driftwood', [.78,.82], 'cook-main-mudflat', 'gameplay-cover', .78, .7, bounds(.14,.055), 'none', ['behind','on','beside'], 'both', { flip: true, rotation: -2 }),
    prop('cook-tide-edge-west', 'coastal-delta', 12, 'shorelineEdge', [.34,.7], 'cook-tide-line', 'gameplay-cover', .58, .68, bounds(.17,.035), 'light', ['behind','beside'], 'both', { aspectScaleY: .5, occlusionStrength: .3 }),
    prop('cook-tide-edge-east', 'coastal-delta', 15, 'shorelineEdge', [.84,.77], 'cook-tide-line', 'gameplay-cover', .67, .72, bounds(.18,.035), 'light', ['behind','beside'], 'both', { aspectScaleY: .5, flip: true, occlusionStrength: .34 }),
    prop('cook-near-beach-rye', 'coastal-delta', 1, 'grass', [.82,.91], 'cook-high-grass', 'foreground', .92, .9, bounds(.11,.2), 'strong', ['behind','beside'], 'both', { rotation: 3 }),
    prop('cook-near-sedge', 'coastal-delta', 3, 'sedge', [.18,.91], 'cook-saltmarsh', 'foreground', .9, .85, bounds(.1,.18), 'strong', ['behind','beside'], 'both', { flip: true }),
  ]),

  layout('copper', [
    prop('copper-far-sedge-island', 'coastal-delta', 3, 'sedge', [.72,.78], 'copper-sedge-islands', 'background-detail', .4, .3, bounds(.04,.065), 'moderate', ['beside'], 'front'),
    prop('copper-west-grass', 'coastal-delta', 1, 'grass', [.2,.84], 'copper-delta-grass', 'midground', .62, .52, bounds(.065,.14), 'strong', ['behind','beside'], 'both'),
    prop('copper-silt-stones', 'coastal-delta', 8, 'rock', [.29,.76], 'copper-silt-bars', 'midground', .59, .48, bounds(.075,.055), 'none', ['on','beside'], 'front'),
    prop('copper-channel-cover', 'coastal-delta', 14, 'shorelineEdge', [.67,.7], 'copper-channel-edge', 'gameplay-cover', .62, .7, bounds(.17,.038), 'light', ['behind','beside'], 'both', { aspectScaleY: .52, occlusionStrength: .34 }),
    prop('copper-river-cover', 'coastal-delta', 12, 'shorelineEdge', [.4,.64], 'copper-river-edge', 'gameplay-cover', .5, .6, bounds(.15,.032), 'light', ['behind','beside'], 'both', { aspectScaleY: .48, flip: true, occlusionStrength: .3 }),
    prop('copper-sedge-screen', 'coastal-delta', 0, 'reed', [.73,.86], 'copper-sedge-islands', 'foreground', .86, .82, bounds(.1,.19), 'strong', ['behind','beside'], 'both', { rotation: -2 }),
    prop('copper-dry-willow', 'coastal-delta', 6, 'willow', [.88,.88], 'copper-dry-tundra', 'foreground', .92, .84, bounds(.1,.17), 'moderate', ['behind','beside'], 'both', { flip: true }),
    prop('copper-near-grass', 'coastal-delta', 2, 'grass', [.42,.91], 'copper-delta-grass', 'foreground', .94, .88, bounds(.12,.19), 'strong', ['behind','beside'], 'both', { rotation: 2 }),
  ]),

  layout('yk', [
    prop('yk-far-cottongrass', 'western-tundra', 1, 'sedge', [.68,.78], 'yk-sedge', 'background-detail', .4, .3, bounds(.04,.07), 'strong', ['beside'], 'front'),
    prop('yk-peat-shrub', 'western-tundra', 6, 'shrub', [.72,.84], 'yk-sedge', 'midground', .63, .5, bounds(.07,.1), 'moderate', ['behind','beside'], 'both'),
    prop('yk-mudflat-sedge', 'western-tundra', 3, 'sedge', [.25,.79], 'yk-dark-mud', 'midground', .61, .5, bounds(.06,.12), 'strong', ['behind','beside'], 'both'),
    prop('yk-slough-edge-west', 'western-tundra', 12, 'shorelineEdge', [.37,.72], 'yk-slough-shore', 'gameplay-cover', .55, .66, bounds(.16,.035), 'light', ['behind','beside'], 'both', { aspectScaleY: .5, occlusionStrength: .32 }),
    prop('yk-channel-peat', 'western-tundra', 15, 'shorelineEdge', [.76,.63], 'yk-river-edge', 'gameplay-cover', .48, .62, bounds(.15,.033), 'light', ['behind','beside'], 'both', { aspectScaleY: .48, flip: true, occlusionStrength: .3 }),
    prop('yk-near-lichen', 'western-tundra', 7, 'moss', [.82,.9], 'yk-tundra-bench', 'foreground', .91, .8, bounds(.11,.1), 'none', ['behind','beside'], 'both'),
    prop('yk-near-tussock', 'western-tundra', 0, 'grass', [.18,.91], 'yk-high-grass', 'foreground', .93, .86, bounds(.11,.2), 'strong', ['behind','beside'], 'both', { rotation: -2 }),
    prop('yk-willow-screen', 'western-tundra', 5, 'willow', [.62,.89], 'yk-tundra-bench', 'foreground', .88, .75, bounds(.09,.15), 'moderate', ['behind','beside'], 'both', { flip: true }),
  ]),

  layout('interior', [
    prop('interior-far-spruce', 'boreal-interior', 0, 'conifer', [.22,.78], 'interior-spruce-floor', 'background-detail', .38, .44, bounds(.045,.13), 'light', ['beside'], 'behind'),
    prop('interior-young-birch', 'boreal-interior', 1, 'willow', [.34,.82], 'interior-spruce-floor', 'midground', .61, .58, bounds(.065,.17), 'moderate', ['behind','beside'], 'both'),
    prop('interior-bank-sedge', 'boreal-interior', 3, 'sedge', [.52,.77], 'interior-bank', 'midground', .58, .48, bounds(.06,.12), 'moderate', ['behind','beside'], 'both'),
    prop('interior-fallen-log', 'boreal-interior', 10, 'log', [.27,.75], 'interior-fallen-trunk', 'gameplay-cover', .7, .75, bounds(.15,.06), 'none', ['behind','on','beside'], 'both', { rotation: -3 }),
    prop('interior-slough-edge', 'boreal-interior', 13, 'shorelineEdge', [.79,.8], 'interior-bank', 'gameplay-cover', .68, .72, bounds(.18,.038), 'light', ['behind','beside'], 'both', { aspectScaleY: .52, occlusionStrength: .34 }),
    prop('interior-forest-root', 'boreal-interior', 9, 'branch', [.13,.78], 'interior-spruce-floor', 'foreground', .86, .82, bounds(.13,.09), 'none', ['behind','on','beside'], 'both', { flip: true }),
    prop('interior-near-willow', 'boreal-interior', 5, 'willow', [.48,.91], 'interior-dry-floor', 'foreground', .91, .82, bounds(.1,.19), 'moderate', ['behind','beside'], 'both'),
    prop('interior-near-sedge', 'boreal-interior', 11, 'grass', [.84,.9], 'interior-tall-sedge', 'foreground', .93, .9, bounds(.12,.2), 'strong', ['behind','beside'], 'both', { rotation: 2 }),
  ]),

  layout('arctic', [
    prop('arctic-far-cotton', 'arctic-alpine', 1, 'sedge', [.72,.8], 'arctic-wet-sedge', 'background-detail', .37, .3, bounds(.04,.07), 'strong', ['beside'], 'front'),
    prop('arctic-dwarf-willow', 'arctic-alpine', 7, 'willow', [.72,.82], 'arctic-wet-sedge', 'midground', .62, .48, bounds(.065,.105), 'moderate', ['behind','beside'], 'both'),
    prop('arctic-snow-sedge', 'arctic-alpine', 2, 'snowPlant', [.18,.82], 'arctic-snow-patches', 'midground', .66, .48, bounds(.06,.1), 'moderate', ['behind','beside'], 'both'),
    prop('arctic-mud-rock', 'arctic-alpine', 9, 'rock', [.3,.76], 'arctic-mudflat', 'midground', .58, .5, bounds(.075,.06), 'none', ['on','beside'], 'front'),
    prop('arctic-pond-edge', 'arctic-alpine', 13, 'shorelineEdge', [.69,.68], 'arctic-pond-shore', 'gameplay-cover', .57, .68, bounds(.17,.035), 'light', ['behind','beside'], 'both', { aspectScaleY: .5, occlusionStrength: .31 }),
    prop('arctic-near-tussock', 'arctic-alpine', 0, 'grass', [.22,.91], 'arctic-tussocks', 'foreground', .92, .85, bounds(.11,.18), 'strong', ['behind','beside'], 'both', { rotation: -2 }),
    prop('arctic-near-lichen', 'arctic-alpine', 10, 'moss', [.78,.9], 'arctic-tundra-terrace', 'foreground', .9, .78, bounds(.11,.09), 'none', ['behind','beside'], 'both'),
    prop('arctic-near-sedge', 'arctic-alpine', 6, 'sedge', [.6,.89], 'arctic-tundra-terrace', 'foreground', .88, .75, bounds(.09,.16), 'strong', ['behind','beside'], 'both', { flip: true }),
  ]),

  layout('aleutian', [
    prop('aleutian-far-coastal-grass', 'aleutian-coast', 1, 'grass', [.28,.79], 'aleutian-coastal-grass', 'background-detail', .4, .34, bounds(.045,.08), 'strong', ['beside'], 'front'),
    prop('aleutian-basalt-stack', 'aleutian-coast', 8, 'rock', [.78,.72], 'aleutian-rock-platform', 'midground', .62, .62, bounds(.09,.1), 'none', ['behind','on','beside'], 'both'),
    prop('aleutian-kelp', 'aleutian-coast', 9, 'driftwood', [.49,.72], 'aleutian-surf-line', 'gameplay-cover', .57, .65, bounds(.13,.05), 'light', ['behind','beside'], 'both', { rotation: 2, occlusionStrength: .38 }),
    prop('aleutian-driftwood', 'aleutian-coast', 10, 'driftwood', [.79,.78], 'aleutian-driftwood-perch', 'gameplay-cover', .72, .76, bounds(.15,.065), 'none', ['behind','on','beside'], 'both', { flip: true, rotation: -3 }),
    prop('aleutian-surf-cover', 'aleutian-coast', 12, 'shorelineEdge', [.33,.68], 'aleutian-surf-line', 'gameplay-cover', .53, .68, bounds(.17,.04), 'light', ['behind','beside'], 'both', { aspectScaleY: .55, occlusionStrength: .33 }),
    prop('aleutian-near-rock', 'aleutian-coast', 11, 'rock', [.86,.88], 'aleutian-rock-platform', 'foreground', .92, .88, bounds(.12,.12), 'none', ['behind','on','beside'], 'both'),
    prop('aleutian-near-grass', 'aleutian-coast', 0, 'grass', [.18,.91], 'aleutian-coastal-grass', 'foreground', .93, .9, bounds(.11,.2), 'strong', ['behind','beside'], 'both', { rotation: -4 }),
    prop('aleutian-meadow-flower', 'aleutian-coast', 2, 'flower', [.55,.88], 'aleutian-coastal-meadow', 'foreground', .86, .7, bounds(.08,.15), 'strong', ['behind','beside'], 'both'),
  ]),

  layout('southeast', [
    prop('southeast-far-hemlock', 'southeast-rainforest', 1, 'conifer', [.18,.74], 'southeast-rainforest-floor', 'background-detail', .38, .45, bounds(.045,.14), 'light', ['beside'], 'behind'),
    prop('southeast-bank-fern', 'southeast-rainforest', 6, 'shrub', [.34,.78], 'southeast-estuary-grass', 'midground', .62, .56, bounds(.075,.13), 'moderate', ['behind','beside'], 'both'),
    prop('southeast-moss-rock', 'southeast-rainforest', 8, 'rock', [.82,.8], 'southeast-rocky-bank', 'midground', .68, .62, bounds(.09,.08), 'none', ['behind','on','beside'], 'both'),
    prop('southeast-hemlock-limb', 'southeast-rainforest', 9, 'branch', [.25,.69], 'southeast-low-hemlock', 'gameplay-cover', .67, .72, bounds(.14,.06), 'none', ['behind','on','beside'], 'both', { rotation: 3 }),
    prop('southeast-estuary-edge', 'southeast-rainforest', 13, 'shorelineEdge', [.67,.78], 'southeast-waterline', 'gameplay-cover', .63, .7, bounds(.17,.038), 'light', ['behind','beside'], 'both', { aspectScaleY: .5, occlusionStrength: .34 }),
    prop('southeast-near-devils-club', 'southeast-rainforest', 7, 'shrub', [.16,.9], 'southeast-rainforest-floor', 'foreground', .92, .86, bounds(.12,.21), 'moderate', ['behind','beside'], 'behind'),
    prop('southeast-near-fern', 'southeast-rainforest', 5, 'shrub', [.43,.9], 'southeast-estuary-grass', 'foreground', .88, .82, bounds(.11,.16), 'moderate', ['behind','beside'], 'both', { flip: true }),
    prop('southeast-near-rock', 'southeast-rainforest', 4, 'rock', [.9,.86], 'southeast-rocky-bank', 'foreground', .94, .9, bounds(.12,.12), 'none', ['behind','on','beside'], 'both'),
  ]),

  layout('tundra', [
    prop('tundra-far-cottongrass', 'western-tundra', 1, 'sedge', [.72,.8], 'tundra-wet-sedge', 'background-detail', .38, .3, bounds(.04,.07), 'strong', ['beside'], 'front'),
    prop('tundra-peat-shrub', 'western-tundra', 6, 'shrub', [.8,.84], 'tundra-wet-sedge', 'midground', .61, .5, bounds(.07,.11), 'moderate', ['behind','beside'], 'both'),
    prop('tundra-snow-flower', 'western-tundra', 2, 'snowPlant', [.17,.82], 'tundra-lingering-snow', 'midground', .66, .48, bounds(.06,.1), 'moderate', ['behind','beside'], 'both'),
    prop('tundra-peat-edge', 'western-tundra', 14, 'shorelineEdge', [.54,.75], 'tundra-waterline', 'gameplay-cover', .59, .68, bounds(.17,.037), 'light', ['behind','beside'], 'both', { aspectScaleY: .5, occlusionStrength: .33 }),
    prop('tundra-channel-edge-prop', 'western-tundra', 12, 'shorelineEdge', [.72,.59], 'tundra-channel-edge', 'gameplay-cover', .48, .6, bounds(.15,.032), 'light', ['behind','beside'], 'both', { aspectScaleY: .46, flip: true, occlusionStrength: .29 }),
    prop('tundra-near-tussock', 'western-tundra', 0, 'grass', [.2,.91], 'tundra-cotton-grass', 'foreground', .93, .86, bounds(.11,.2), 'strong', ['behind','beside'], 'both', { rotation: -3 }),
    prop('tundra-near-lichen', 'western-tundra', 7, 'moss', [.79,.9], 'tundra-hummocks', 'foreground', .9, .8, bounds(.11,.1), 'none', ['behind','beside'], 'both'),
    prop('tundra-near-willow', 'western-tundra', 5, 'willow', [.62,.89], 'tundra-hummocks', 'foreground', .87, .74, bounds(.09,.15), 'strong', ['behind','beside'], 'both', { flip: true }),
  ]),

  layout('alpine', [
    prop('alpine-far-lichen', 'arctic-alpine', 6, 'moss', [.22,.66], 'alpine-tundra-slope', 'background-detail', .34, .3, bounds(.04,.05), 'none', ['beside'], 'front'),
    prop('alpine-snow-cotton', 'arctic-alpine', 1, 'snowPlant', [.24,.6], 'alpine-snowfields', 'midground', .55, .46, bounds(.055,.1), 'strong', ['behind','beside'], 'both'),
    prop('alpine-scree-rock', 'arctic-alpine', 9, 'rock', [.61,.66], 'alpine-rock-scree', 'midground', .61, .58, bounds(.085,.075), 'none', ['on','beside'], 'front'),
    prop('alpine-lower-rock', 'arctic-alpine', 10, 'rock', [.72,.78], 'alpine-rock-scree', 'gameplay-cover', .74, .72, bounds(.11,.09), 'none', ['behind','on','beside'], 'both'),
    prop('alpine-mountain-flowers', 'arctic-alpine', 2, 'flower', [.42,.8], 'alpine-tundra-slope', 'gameplay-cover', .72, .62, bounds(.08,.12), 'strong', ['behind','beside'], 'both'),
    prop('alpine-near-boulder', 'arctic-alpine', 8, 'rock', [.84,.88], 'alpine-tundra-slope', 'foreground', .93, .9, bounds(.13,.13), 'none', ['behind','on','beside'], 'both'),
    prop('alpine-near-heath', 'arctic-alpine', 7, 'shrub', [.18,.88], 'alpine-tundra-slope', 'foreground', .89, .78, bounds(.1,.14), 'strong', ['behind','beside'], 'both', { rotation: -2 }),
    prop('alpine-near-moss', 'arctic-alpine', 11, 'moss', [.55,.91], 'alpine-tundra-slope', 'foreground', .91, .82, bounds(.12,.08), 'none', ['behind','beside'], 'both'),
  ]),

  layout('willow', [
    prop('willow-far-spruce', 'winter-willow', 3, 'conifer', [.74,.59], 'willow-snowfield', 'background-detail', .35, .42, bounds(.045,.14), 'light', ['beside'], 'behind'),
    prop('willow-snow-shrub', 'winter-willow', 0, 'snowPlant', [.29,.65], 'willow-snowfield', 'midground', .56, .52, bounds(.07,.13), 'moderate', ['behind','beside'], 'both'),
    prop('willow-bare-stems', 'winter-willow', 1, 'snowPlant', [.56,.7], 'willow-snowfield', 'midground', .61, .54, bounds(.065,.15), 'strong', ['behind','beside'], 'both', { flip: true }),
    prop('willow-left-perch', 'winter-willow', 9, 'branch', [.25,.69], 'willow-branch-left', 'gameplay-cover', .68, .72, bounds(.14,.06), 'none', ['behind','on','beside'], 'both', { rotation: 3 }),
    prop('willow-right-perch', 'winter-willow', 10, 'branch', [.87,.68], 'willow-branch-right', 'gameplay-cover', .71, .74, bounds(.14,.065), 'none', ['behind','on','beside'], 'both', { flip: true, rotation: -3 }),
    prop('willow-near-snow-rock', 'winter-willow', 8, 'snowRock', [.74,.88], 'willow-snowfield', 'foreground', .91, .88, bounds(.12,.13), 'none', ['behind','on','beside'], 'both'),
    prop('willow-near-alder', 'winter-willow', 5, 'snowPlant', [.18,.88], 'willow-snowfield', 'foreground', .9, .82, bounds(.1,.19), 'strong', ['behind','beside'], 'behind', { rotation: -2 }),
    prop('willow-near-snow-mound', 'winter-willow', 11, 'snowRock', [.48,.91], 'willow-snowfield', 'foreground', .94, .9, bounds(.13,.11), 'none', ['behind','beside'], 'both'),
  ]),

  layout('river', [
    prop('river-far-willow', 'boreal-interior', 1, 'willow', [.72,.81], 'river-marsh-bench', 'background-detail', .39, .34, bounds(.045,.1), 'moderate', ['beside'], 'front'),
    prop('river-bank-horsetail', 'boreal-interior', 3, 'sedge', [.68,.84], 'river-marsh-bench', 'midground', .62, .52, bounds(.065,.13), 'moderate', ['behind','beside'], 'both'),
    prop('river-silt-rock', 'boreal-interior', 9, 'rock', [.28,.78], 'river-silt-flat', 'midground', .6, .5, bounds(.075,.06), 'none', ['on','beside'], 'front'),
    prop('river-drift-log', 'boreal-interior', 10, 'log', [.41,.82], 'river-silt-flat', 'gameplay-cover', .73, .72, bounds(.15,.06), 'none', ['behind','on','beside'], 'both', { rotation: 2 }),
    prop('river-channel-cover', 'boreal-interior', 12, 'shorelineEdge', [.72,.61], 'river-channel-edge', 'gameplay-cover', .49, .62, bounds(.15,.032), 'light', ['behind','beside'], 'both', { aspectScaleY: .48, occlusionStrength: .29 }),
    prop('river-bank-cover', 'boreal-interior', 13, 'shorelineEdge', [.7,.69], 'river-visible-shore', 'gameplay-cover', .58, .68, bounds(.17,.038), 'light', ['behind','beside'], 'both', { aspectScaleY: .52, flip: true, occlusionStrength: .34 }),
    prop('river-near-grass', 'boreal-interior', 11, 'grass', [.2,.91], 'river-tall-grass', 'foreground', .93, .88, bounds(.11,.2), 'strong', ['behind','beside'], 'both', { rotation: -2 }),
    prop('river-near-willow', 'boreal-interior', 5, 'willow', [.8,.9], 'river-dry-bench', 'foreground', .9, .82, bounds(.1,.18), 'moderate', ['behind','beside'], 'both', { flip: true }),
  ]),
] as const satisfies readonly ScenePropLayout[];

export const scenePropLayoutByLocation: ReadonlyMap<string, ScenePropLayout> = new Map(
  scenePropLayouts.map((entry) => [entry.locationId, entry]),
);
