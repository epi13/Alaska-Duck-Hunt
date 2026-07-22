import type { BirdSurface } from '../core/birds/bird-plan';
import type { DogPatrolPath, NormalizedPoint, SceneArea, SceneMap, SceneRegion } from '../core/scenes/scene-map';

type Pair = readonly [number, number];
const points = (pairs: readonly Pair[]): NormalizedPoint[] => pairs.map(([x, y]) => ({ x, y }));
const poly = (
  id: string,
  surface: BirdSurface,
  pairs: readonly Pair[],
  depth: readonly [number, number],
  displayDepth: number,
  objectScale: readonly [number, number],
  options: Partial<Pick<SceneRegion, 'anchorHeight' | 'birdFamilies' | 'species' | 'occludedBy'>> = {},
): SceneRegion => ({ id, surface, geometry: { kind: 'polygon', points: points(pairs) }, depth, displayDepth, objectScale, ...options });
const path = (
  id: string,
  surface: BirdSurface,
  pairs: readonly Pair[],
  depth: readonly [number, number],
  displayDepth: number,
  objectScale: readonly [number, number],
  options: Partial<Pick<SceneRegion, 'anchorHeight' | 'birdFamilies' | 'species' | 'occludedBy'>> = {},
): SceneRegion => ({ id, surface, geometry: { kind: 'path', points: points(pairs) }, depth, displayDepth, objectScale, ...options });
const patrol = (id: string, pairs: readonly Pair[], displayDepth = 58, objectScale: readonly [number, number] = [0.72, 0.96]): DogPatrolPath =>
  ({ id, points: points(pairs), displayDepth, objectScale });
const area = (id: string, pairs: readonly Pair[], displayDepth?: number): SceneArea =>
  ({ id, polygon: points(pairs), ...(displayDepth === undefined ? {} : { displayDepth }) });
const scene = (
  locationId: string,
  regions: readonly SceneRegion[],
  dogPatrolPaths: readonly DogPatrolPath[],
  noSpawnAreas: readonly SceneArea[],
  foregroundOcclusionAreas: readonly SceneArea[],
): SceneMap => ({ version: 1, locationId, sourceSize: [1280, 720], regions, dogPatrolPaths, noSpawnAreas, foregroundOcclusionAreas });

export const sceneMaps = [
  scene('matsu', [
    poly('matsu-pond', 'openWater', [[.02,.68],[.31,.65],[.54,.67],[.65,.75],[.53,.82],[.16,.82],[.02,.78]], [.48,.7], 42, [.68,.91]),
    poly('matsu-slough', 'shallowWater', [[.49,.66],[.99,.62],[.99,.76],[.82,.78],[.64,.74]], [.5,.72], 43, [.7,.92]),
    path('matsu-waterline', 'shoreline', [[.02,.81],[.19,.82],[.38,.8],[.54,.82],[.67,.76],[.82,.78],[.99,.76]], [.62,.78], 46, [.8,1.02]),
    poly('matsu-mud-pocket', 'mudflat', [[.42,.77],[.57,.76],[.64,.82],[.51,.86],[.39,.83]], [.68,.82], 47, [.84,1.02]),
    poly('matsu-sedge', 'marshGrass', [[.13,.77],[.44,.78],[.58,.88],[.37,.96],[.08,.91]], [.7,.92], 52, [.88,1.08]),
    poly('matsu-tall-meadow', 'tallGrass', [[.5,.79],[.99,.75],[.99,.95],[.64,.94]], [.7,.94], 55, [.88,1.12]),
    poly('matsu-spruce-floor', 'forestFloor', [[0,.8],[.18,.79],[.29,.98],[0,.98]], [.75,.95], 54, [.9,1.12]),
    path('matsu-fallen-spruce', 'lowBranch', [[.02,.77],[.17,.79],[.31,.75],[.43,.79]], [.64,.75], 57, [.84,1.02], { birdFamilies: ['upland'] }),
  ], [patrol('matsu-marsh-patrol', [[-.0,.91],[.16,.88],[.34,.9],[.53,.87],[.73,.9],[1,.87]])],
  [area('matsu-sky', [[0,0],[1,0],[1,.57],[.72,.59],[.4,.54],[0,.61]])],
  [area('matsu-foreground-reeds', [[0,.88],[1,.86],[1,1],[0,1]], 72)]),

  scene('cook', [
    poly('cook-tidal-water', 'openWater', [[0,.57],[.56,.57],[.73,.65],[.55,.72],[.17,.7],[0,.65]], [.42,.68], 41, [.64,.9]),
    poly('cook-braided-shallows', 'shallowWater', [[.15,.62],[.98,.57],[1,.72],[.72,.77],[.48,.7],[.18,.76]], [.5,.75], 44, [.72,.98]),
    path('cook-tide-line', 'shoreline', [[0,.68],[.16,.72],[.34,.7],[.51,.74],[.68,.72],[.84,.77],[1,.72]], [.58,.79], 46, [.78,1.03]),
    poly('cook-main-mudflat', 'mudflat', [[0,.67],[.2,.73],[.48,.72],[.72,.77],[1,.73],[1,.88],[.72,.85],[.42,.88],[.14,.83],[0,.86]], [.62,.86], 48, [.8,1.06]),
    poly('cook-saltmarsh', 'marshGrass', [[.08,.77],[.34,.78],[.47,.97],[.04,.96]], [.72,.96], 53, [.9,1.13]),
    poly('cook-high-grass', 'tallGrass', [[.52,.78],[1,.76],[1,.98],[.61,.96]], [.72,.97], 55, [.9,1.14]),
  ], [patrol('cook-mudflat-patrol', [[0,.88],[.18,.86],[.36,.89],[.55,.86],[.75,.89],[1,.86]])],
  [area('cook-sky', [[0,0],[1,0],[1,.52],[.78,.55],[.48,.49],[0,.52]])],
  [area('cook-foreground-grass', [[0,.9],[.22,.85],[.45,.94],[.75,.89],[1,.91],[1,1],[0,1]], 72)]),

  scene('copper', [
    poly('copper-main-channel', 'openWater', [[0,.57],[.38,.58],[.56,.64],[.47,.73],[.19,.75],[0,.7]], [.43,.7], 41, [.66,.92]),
    poly('copper-braided-water', 'shallowWater', [[.35,.58],[1,.57],[1,.73],[.81,.76],[.62,.68],[.48,.74]], [.48,.76], 44, [.7,.98]),
    path('copper-channel-edge', 'shoreline', [[0,.72],[.18,.76],[.37,.72],[.52,.77],[.67,.7],[.82,.77],[1,.74]], [.61,.8], 46, [.79,1.03]),
    path('copper-river-edge', 'riverEdge', [[.03,.66],[.23,.68],[.4,.64],[.58,.7],[.76,.64],[.98,.68]], [.55,.74], 45, [.74,.98]),
    poly('copper-silt-bars', 'mudflat', [[.13,.68],[.38,.66],[.55,.74],[.44,.82],[.17,.8]], [.62,.82], 48, [.82,1.04]),
    poly('copper-sedge-islands', 'marshGrass', [[.49,.71],[.99,.68],[1,.89],[.77,.85],[.61,.9]], [.67,.9], 52, [.86,1.1]),
    poly('copper-delta-grass', 'tallGrass', [[0,.78],[.49,.77],[.62,.98],[0,.98]], [.74,.97], 55, [.9,1.14]),
    poly('copper-dry-tundra', 'tundraGround', [[.58,.79],[1,.77],[1,.98],[.66,.97]], [.76,.97], 54, [.9,1.14]),
  ], [patrol('copper-sedge-patrol', [[0,.91],[.17,.88],[.37,.9],[.56,.87],[.75,.91],[1,.88]])],
  [area('copper-sky', [[0,0],[1,0],[1,.53],[.76,.55],[.53,.49],[.28,.54],[0,.5]])],
  [area('copper-foreground-sedge', [[0,.88],[.28,.86],[.47,.92],[.69,.88],[1,.9],[1,1],[0,1]], 72)]),

  scene('yk', [
    poly('yk-open-slough', 'openWater', [[0,.58],[.42,.57],[.58,.65],[.49,.74],[.18,.75],[0,.69]], [.44,.7], 41, [.66,.92]),
    poly('yk-tidal-channels', 'shallowWater', [[.35,.56],[1,.57],[1,.74],[.74,.76],[.59,.68],[.48,.74]], [.49,.76], 44, [.71,.98]),
    path('yk-slough-shore', 'shoreline', [[0,.71],[.19,.76],[.37,.72],[.53,.77],[.67,.7],[.84,.77],[1,.73]], [.6,.8], 46, [.79,1.04]),
    path('yk-river-edge', 'riverEdge', [[.02,.64],[.2,.67],[.39,.63],[.56,.69],[.76,.63],[.99,.67]], [.54,.73], 45, [.73,.97]),
    poly('yk-dark-mud', 'mudflat', [[.1,.68],[.38,.67],[.52,.75],[.4,.82],[.12,.8]], [.62,.82], 48, [.81,1.04]),
    poly('yk-sedge', 'marshGrass', [[.48,.72],[1,.69],[1,.9],[.74,.86],[.6,.91]], [.68,.91], 52, [.86,1.11]),
    poly('yk-high-grass', 'tallGrass', [[0,.78],[.5,.77],[.61,.98],[0,.98]], [.74,.97], 55, [.9,1.14]),
    poly('yk-tundra-bench', 'tundraGround', [[.56,.8],[1,.78],[1,.98],[.64,.97]], [.77,.97], 54, [.91,1.14]),
  ], [patrol('yk-tundra-patrol', [[0,.91],[.19,.88],[.38,.91],[.58,.88],[.77,.91],[1,.89]])],
  [area('yk-sky', [[0,0],[1,0],[1,.52],[.72,.54],[.45,.5],[0,.52]])],
  [area('yk-foreground-tundra', [[0,.89],[.25,.86],[.46,.93],[.71,.88],[1,.91],[1,1],[0,1]], 72)]),

  scene('interior', [
    poly('interior-slough', 'openWater', [[.48,.57],[.99,.56],[1,.76],[.79,.79],[.61,.72],[.49,.66]], [.45,.75], 41, [.67,.97]),
    poly('interior-littoral', 'shallowWater', [[.41,.65],[.65,.66],[.82,.75],[.66,.83],[.44,.79]], [.57,.81], 44, [.76,1.03]),
    path('interior-bank', 'shoreline', [[.39,.74],[.52,.77],[.65,.75],[.79,.8],[.99,.77]], [.66,.83], 47, [.83,1.06]),
    path('interior-river-edge', 'riverEdge', [[.48,.65],[.62,.68],[.77,.67],[.9,.7],[1,.68]], [.55,.73], 45, [.75,.98]),
    poly('interior-marsh', 'marshGrass', [[.35,.74],[.61,.77],[.69,.94],[.34,.96]], [.7,.95], 53, [.88,1.14]),
    poly('interior-tall-sedge', 'tallGrass', [[.65,.78],[1,.76],[1,.96],[.7,.95]], [.76,.96], 55, [.92,1.15]),
    poly('interior-spruce-floor', 'forestFloor', [[0,.67],[.38,.7],[.46,.98],[0,.98]], [.62,.97], 54, [.82,1.15]),
    poly('interior-dry-floor', 'tundraGround', [[.14,.78],[.56,.79],[.63,.98],[.1,.98]], [.75,.97], 54, [.9,1.14]),
    path('interior-fallen-trunk', 'lowBranch', [[0,.76],[.13,.78],[.27,.75],[.4,.8]], [.65,.78], 58, [.84,1.04], { birdFamilies: ['upland'] }),
  ], [patrol('interior-floor-patrol', [[0,.9],[.17,.87],[.34,.91],[.53,.88],[.72,.91],[1,.88]])],
  [area('interior-sky', [[0,0],[1,0],[1,.5],[.72,.54],[.46,.48],[.2,.52],[0,.48]])],
  [area('interior-foreground-brush', [[0,.86],[.28,.85],[.5,.92],[.75,.87],[1,.9],[1,1],[0,1]], 73)]),

  scene('arctic', [
    poly('arctic-main-pond', 'openWater', [[0,.54],[.48,.54],[.61,.63],[.5,.72],[.17,.71],[0,.66]], [.4,.68], 41, [.63,.9]),
    poly('arctic-braided-shallows', 'shallowWater', [[.42,.53],[1,.55],[1,.7],[.77,.74],[.6,.66],[.5,.72]], [.46,.73], 44, [.68,.96]),
    path('arctic-pond-shore', 'shoreline', [[0,.68],[.18,.72],[.37,.69],[.52,.74],[.69,.68],[.84,.74],[1,.7]], [.57,.77], 46, [.76,1.01]),
    path('arctic-channel-edge', 'riverEdge', [[.45,.6],[.58,.63],[.72,.61],[.86,.65],[1,.63]], [.51,.69], 45, [.72,.94]),
    poly('arctic-mudflat', 'mudflat', [[.14,.66],[.39,.65],[.52,.73],[.4,.8],[.13,.78]], [.6,.8], 48, [.79,1.02]),
    poly('arctic-wet-sedge', 'marshGrass', [[.48,.69],[1,.67],[1,.87],[.73,.83],[.59,.88]], [.65,.88], 52, [.84,1.08]),
    poly('arctic-tussocks', 'tallGrass', [[0,.75],[.5,.75],[.61,.98],[0,.98]], [.71,.97], 55, [.88,1.14]),
    poly('arctic-tundra-terrace', 'tundraGround', [[.53,.77],[1,.75],[1,.98],[.62,.97]], [.74,.97], 54, [.89,1.14]),
    poly('arctic-snow-patches', 'snowGround', [[.05,.77],[.22,.74],[.32,.83],[.18,.88],[.04,.85]], [.72,.87], 55, [.88,1.06], { birdFamilies: ['upland'] }),
  ], [patrol('arctic-tussock-patrol', [[0,.9],[.2,.87],[.39,.9],[.58,.87],[.78,.9],[1,.88]])],
  [area('arctic-sky', [[0,0],[1,0],[1,.48],[.73,.5],[.48,.46],[.23,.5],[0,.47]])],
  [area('arctic-foreground-willow', [[0,.88],[.23,.85],[.45,.92],[.7,.87],[1,.9],[1,1],[0,1]], 72)]),

  scene('aleutian', [
    poly('aleutian-near-sea', 'openWater', [[0,.43],[.61,.43],[.71,.52],[.58,.66],[.18,.67],[0,.61]], [.32,.63], 40, [.56,.86]),
    poly('aleutian-surf', 'shallowWater', [[0,.57],[.52,.55],[.66,.62],[.57,.7],[.16,.72],[0,.67]], [.49,.71], 44, [.69,.94]),
    path('aleutian-surf-line', 'shoreline', [[0,.67],[.16,.71],[.33,.68],[.49,.72],[.62,.66]], [.58,.76], 47, [.77,1]),
    poly('aleutian-rock-platform', 'rockyCoast', [[.52,.55],[1,.48],[1,.95],[.69,.91],[.57,.74]], [.52,.95], 52, [.73,1.16]),
    poly('aleutian-coastal-meadow', 'tundraGround', [[.3,.72],[.71,.73],[.76,.97],[.23,.98]], [.69,.97], 54, [.87,1.14]),
    poly('aleutian-coastal-grass', 'marshGrass', [[0,.74],[.35,.72],[.4,.98],[0,.98]], [.7,.97], 55, [.88,1.14]),
    path('aleutian-driftwood-perch', 'lowBranch', [[.66,.83],[.79,.78],[.91,.82]], [.75,.84], 59, [.91,1.08], { birdFamilies: ['upland'] }),
  ], [patrol('aleutian-rock-patrol', [[0,.89],[.14,.86],[.31,.9],[.49,.86],[.67,.9],[.84,.85],[1,.89]], 60, [.76,1])],
  [area('aleutian-sky', [[0,0],[1,0],[1,.39],[.73,.43],[.5,.37],[.25,.41],[0,.37]])],
  [area('aleutian-foreground-rocks', [[0,.85],[.23,.82],[.43,.91],[.68,.84],[1,.88],[1,1],[0,1]], 74)]),

  scene('southeast', [
    poly('southeast-inlet', 'openWater', [[.3,.5],[.88,.5],[1,.61],[.86,.73],[.51,.73],[.34,.64]], [.37,.7], 40, [.6,.91]),
    poly('southeast-estuary-shallows', 'shallowWater', [[.22,.62],[.54,.6],[.7,.7],[.57,.8],[.29,.76]], [.54,.78], 44, [.74,1]),
    path('southeast-waterline', 'shoreline', [[.2,.71],[.36,.75],[.51,.72],[.67,.78],[.83,.73],[.98,.76]], [.62,.8], 47, [.8,1.04]),
    path('southeast-river-edge', 'riverEdge', [[.31,.61],[.47,.64],[.62,.61],[.78,.65],[.91,.62]], [.51,.7], 45, [.72,.95]),
    poly('southeast-rocky-bank', 'rockyCoast', [[.66,.61],[1,.57],[1,.91],[.77,.87],[.64,.76]], [.58,.89], 52, [.77,1.12]),
    poly('southeast-estuary-grass', 'marshGrass', [[.15,.71],[.47,.73],[.55,.95],[.12,.97]], [.68,.96], 54, [.86,1.14]),
    poly('southeast-rainforest-floor', 'forestFloor', [[0,.59],[.28,.62],[.38,.98],[0,.98]], [.54,.97], 55, [.75,1.15]),
    path('southeast-low-hemlock', 'lowBranch', [[0,.66],[.13,.63],[.25,.69],[.38,.65]], [.55,.69], 59, [.76,.96], { birdFamilies: ['upland'] }),
  ], [patrol('southeast-bank-patrol', [[0,.9],[.16,.86],[.34,.9],[.52,.87],[.7,.91],[.86,.86],[1,.89]])],
  [area('southeast-sky', [[0,0],[1,0],[1,.43],[.77,.47],[.52,.4],[.26,.46],[0,.4]])],
  [area('southeast-foreground-ferns', [[0,.84],[.2,.82],[.42,.92],[.7,.85],[1,.89],[1,1],[0,1]], 74)]),

  scene('tundra', [
    poly('tundra-lake', 'openWater', [[0,.51],[.52,.5],[.68,.6],[.58,.72],[.17,.72],[0,.66]], [.38,.68], 40, [.61,.91]),
    poly('tundra-pond-complex', 'shallowWater', [[.4,.52],[1,.53],[1,.71],[.77,.74],[.61,.65],[.53,.73]], [.45,.74], 44, [.68,.97]),
    path('tundra-waterline', 'shoreline', [[0,.68],[.18,.73],[.37,.69],[.54,.75],[.69,.68],[.85,.75],[1,.71]], [.57,.78], 46, [.76,1.02]),
    path('tundra-channel-edge', 'riverEdge', [[.43,.59],[.58,.62],[.72,.59],[.87,.64],[1,.61]], [.5,.68], 45, [.71,.94]),
    poly('tundra-peat-mud', 'mudflat', [[.13,.66],[.39,.65],[.53,.73],[.4,.81],[.12,.79]], [.6,.81], 48, [.79,1.03]),
    poly('tundra-wet-sedge', 'marshGrass', [[.48,.7],[1,.67],[1,.88],[.73,.84],[.59,.89]], [.66,.89], 52, [.85,1.09]),
    poly('tundra-cotton-grass', 'tallGrass', [[0,.75],[.51,.75],[.61,.98],[0,.98]], [.71,.97], 55, [.88,1.14]),
    poly('tundra-hummocks', 'tundraGround', [[.52,.77],[1,.75],[1,.98],[.62,.97]], [.74,.97], 54, [.89,1.14]),
    poly('tundra-lingering-snow', 'snowGround', [[.04,.77],[.2,.74],[.31,.83],[.17,.88],[.03,.85]], [.72,.87], 55, [.87,1.06], { birdFamilies: ['upland'] }),
  ], [patrol('tundra-hummock-patrol', [[0,.9],[.2,.87],[.39,.9],[.58,.87],[.78,.9],[1,.88]])],
  [area('tundra-sky', [[0,0],[1,0],[1,.46],[.75,.49],[.49,.44],[.23,.49],[0,.45]])],
  [area('tundra-foreground-lichen', [[0,.88],[.23,.85],[.46,.92],[.71,.87],[1,.9],[1,1],[0,1]], 72)]),

  scene('alpine', [
    poly('alpine-tundra-slope', 'tundraGround', [[0,.55],[.2,.5],[.4,.58],[.58,.49],[.78,.57],[1,.48],[1,.98],[0,.98]], [.45,.97], 53, [.67,1.15]),
    poly('alpine-snowfields', 'snowGround', [[.13,.53],[.31,.48],[.42,.57],[.31,.68],[.12,.65]], [.46,.68], 55, [.68,.94], { birdFamilies: ['upland'] }),
    poly('alpine-rock-scree', 'rockyCoast', [[.42,.57],[.67,.48],[.86,.59],[.8,.84],[.52,.81]], [.51,.84], 56, [.72,1.06]),
  ], [patrol('alpine-scree-patrol', [[0,.88],[.16,.83],[.32,.87],[.49,.81],[.66,.86],[.83,.82],[1,.86]], 59, [.72,1])],
  [area('alpine-sky', [[0,0],[1,0],[1,.38],[.76,.42],[.5,.36],[.25,.42],[0,.37]])],
  [area('alpine-foreground-rocks', [[0,.87],[.22,.82],[.45,.91],[.7,.84],[1,.88],[1,1],[0,1]], 73)]),

  scene('willow', [
    poly('willow-snowfield', 'snowGround', [[0,.53],[.22,.49],[.43,.57],[.62,.5],[.81,.58],[1,.51],[1,.98],[0,.98]], [.44,.97], 53, [.66,1.15], { birdFamilies: ['upland'] }),
    poly('willow-exposed-tundra', 'tundraGround', [[.18,.67],[.52,.62],[.71,.76],[.57,.91],[.22,.88]], [.61,.9], 54, [.79,1.09]),
    poly('willow-scrub-floor', 'forestFloor', [[0,.7],[.27,.65],[.38,.98],[0,.98]], [.65,.97], 55, [.82,1.15]),
    path('willow-branch-left', 'lowBranch', [[.02,.67],[.13,.59],[.25,.69],[.38,.62]], [.52,.7], 59, [.72,.96], { birdFamilies: ['upland'] }),
    path('willow-branch-right', 'lowBranch', [[.61,.66],[.74,.59],[.87,.68],[.98,.62]], [.53,.7], 59, [.73,.97], { birdFamilies: ['upland'] }),
  ], [patrol('willow-snow-patrol', [[0,.9],[.17,.84],[.34,.89],[.51,.83],[.68,.88],[.84,.84],[1,.88]])],
  [area('willow-sky', [[0,0],[1,0],[1,.39],[.76,.43],[.49,.37],[.24,.43],[0,.38]])],
  [area('willow-foreground-brush', [[0,.85],[.2,.81],[.43,.92],[.7,.83],[1,.88],[1,1],[0,1]], 74)]),

  scene('river', [
    poly('river-main-water', 'openWater', [[0,.54],[.54,.53],[.7,.62],[.61,.73],[.19,.73],[0,.67]], [.41,.69], 40, [.63,.92]),
    poly('river-backwater', 'shallowWater', [[.42,.54],[1,.55],[1,.72],[.77,.75],[.62,.66],[.54,.74]], [.47,.75], 44, [.69,.98]),
    path('river-visible-shore', 'shoreline', [[0,.69],[.18,.74],[.37,.7],[.54,.76],[.7,.69],[.85,.76],[1,.72]], [.58,.79], 46, [.77,1.03]),
    path('river-channel-edge', 'riverEdge', [[.41,.61],[.58,.64],[.72,.61],[.87,.65],[1,.63]], [.51,.7], 45, [.72,.95]),
    poly('river-silt-flat', 'mudflat', [[.12,.67],[.39,.66],[.54,.74],[.41,.82],[.11,.8]], [.61,.82], 48, [.8,1.04]),
    poly('river-marsh-bench', 'marshGrass', [[.48,.71],[1,.68],[1,.89],[.73,.85],[.59,.9]], [.67,.9], 52, [.85,1.1]),
    poly('river-tall-grass', 'tallGrass', [[0,.76],[.51,.76],[.61,.98],[0,.98]], [.72,.97], 55, [.89,1.14]),
    poly('river-dry-bench', 'tundraGround', [[.53,.78],[1,.76],[1,.98],[.62,.97]], [.75,.97], 54, [.9,1.14]),
  ], [patrol('river-bank-patrol', [[0,.9],[.19,.87],[.38,.91],[.57,.87],[.77,.91],[1,.88]])],
  [area('river-sky', [[0,0],[1,0],[1,.48],[.74,.51],[.49,.46],[.23,.51],[0,.47]])],
  [area('river-foreground-grass', [[0,.88],[.24,.85],[.46,.93],[.71,.87],[1,.9],[1,1],[0,1]], 72)]),
] as const satisfies readonly SceneMap[];

export const sceneMapByLocation: ReadonlyMap<string, SceneMap> = new Map(
  sceneMaps.map((map) => [map.locationId, map]),
);
