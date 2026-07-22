import { pointInPolygon, projectOntoGeometry, type NormalizedPoint, type SceneMap } from './scene-map';

export type ScenePropLayer = 'background-detail' | 'midground' | 'gameplay-cover' | 'foreground';
export type ScenePropType =
  | 'reed'
  | 'sedge'
  | 'aquaticPlant'
  | 'grass'
  | 'flower'
  | 'shrub'
  | 'willow'
  | 'conifer'
  | 'moss'
  | 'rock'
  | 'snowPlant'
  | 'snowRock'
  | 'log'
  | 'branch'
  | 'driftwood'
  | 'shorelineEdge'
  | 'iceEdge';
export type WindResponse = 'none' | 'light' | 'moderate' | 'strong';
export type BirdPropRelation = 'behind' | 'beside' | 'on';
export type DogPropPass = 'behind' | 'front' | 'both' | 'blocked';

export interface PropOcclusionBounds {
  readonly kind: 'bounds';
  readonly offsetX: number;
  readonly offsetY: number;
  readonly width: number;
  readonly height: number;
}

export interface PropOcclusionPolygon {
  readonly kind: 'polygon';
  readonly points: readonly NormalizedPoint[];
}

export interface ScenePropPlacement {
  readonly id: string;
  readonly atlas: string;
  readonly frame: number;
  readonly type: ScenePropType;
  readonly anchor: NormalizedPoint;
  readonly surfaceRegionId: string;
  readonly layer: ScenePropLayer;
  readonly perspectiveDepth: number;
  readonly baseScale: number;
  readonly origin: readonly [number, number];
  readonly flip?: boolean;
  readonly rotation?: number;
  readonly aspectScaleY?: number;
  readonly occlusion: PropOcclusionBounds | PropOcclusionPolygon;
  readonly occlusionStrength: number;
  readonly wind: WindResponse;
  readonly birdRelations: readonly BirdPropRelation[];
  readonly dogPass: DogPropPass;
}

export interface ScenePropLayout {
  readonly locationId: string;
  readonly placements: readonly ScenePropPlacement[];
}

export interface ScenePropValidation {
  readonly placementId: string;
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface ActorPropDepth {
  readonly depth: number;
  readonly occlusion: number;
  readonly propId?: string;
  readonly relation: 'clear' | 'behind' | 'front';
}

const compatibleSurfaces: Readonly<Record<ScenePropType, readonly string[]>> = {
  reed: ['shallowWater', 'shoreline', 'riverEdge', 'marshGrass', 'tallGrass'],
  sedge: ['shallowWater', 'shoreline', 'riverEdge', 'mudflat', 'marshGrass', 'tallGrass', 'tundraGround'],
  aquaticPlant: ['shallowWater', 'shoreline', 'riverEdge', 'marshGrass'],
  grass: ['shoreline', 'mudflat', 'marshGrass', 'tallGrass', 'tundraGround', 'forestFloor'],
  flower: ['marshGrass', 'tallGrass', 'tundraGround', 'forestFloor', 'rockyCoast'],
  shrub: ['marshGrass', 'tallGrass', 'tundraGround', 'forestFloor', 'rockyCoast'],
  willow: ['marshGrass', 'tallGrass', 'tundraGround', 'forestFloor', 'snowGround', 'riverEdge'],
  conifer: ['forestFloor', 'tundraGround', 'snowGround'],
  moss: ['forestFloor', 'tundraGround', 'rockyCoast'],
  rock: ['shoreline', 'riverEdge', 'mudflat', 'tundraGround', 'snowGround', 'forestFloor', 'rockyCoast'],
  snowPlant: ['snowGround'],
  snowRock: ['snowGround', 'rockyCoast'],
  log: ['shoreline', 'riverEdge', 'mudflat', 'tundraGround', 'forestFloor', 'rockyCoast', 'lowBranch'],
  branch: ['shoreline', 'riverEdge', 'tundraGround', 'snowGround', 'forestFloor', 'rockyCoast', 'lowBranch'],
  driftwood: ['shoreline', 'riverEdge', 'mudflat', 'rockyCoast', 'lowBranch'],
  shorelineEdge: ['shallowWater', 'shoreline', 'riverEdge', 'mudflat', 'rockyCoast'],
  iceEdge: ['shallowWater', 'shoreline', 'riverEdge', 'snowGround'],
};
const supportedAtlases = new Set(['southcentral-wetland', 'coastal-delta', 'western-tundra', 'boreal-interior', 'southeast-rainforest', 'arctic-alpine', 'aleutian-coast', 'winter-willow']);

export function validateScenePropLayout(layout: ScenePropLayout, map: SceneMap): readonly ScenePropValidation[] {
  const seen = new Set<string>();
  return layout.placements.map((placement) => {
    const errors: string[] = [];
    const region = map.regions.find(({ id }) => id === placement.surfaceRegionId);
    if (seen.has(placement.id)) errors.push('duplicate placement id');
    if (layout.locationId !== map.locationId) errors.push('layout and map location ids differ');
    seen.add(placement.id);
    if (!placement.id.startsWith(`${layout.locationId}-`)) errors.push('id must be location-prefixed');
    if (!region) errors.push('unknown surface-region id');
    else {
      if (!compatibleSurfaces[placement.type].includes(region.surface)) errors.push(`${placement.type} is incompatible with ${region.surface}`);
      const projected = projectOntoGeometry(placement.anchor, region.geometry);
      const errorDistance = Math.hypot(projected.x - placement.anchor.x, projected.y - placement.anchor.y);
      const tolerance = region.geometry.kind === 'path' ? .012 : 1e-8;
      if (errorDistance > tolerance) errors.push(`anchor is ${errorDistance.toFixed(4)} from mapped region`);
    }
    if (!Number.isInteger(placement.frame) || placement.frame < 0 || placement.frame > 15) errors.push('frame must be between 0 and 15');
    if (!supportedAtlases.has(placement.atlas)) errors.push('unknown prop atlas');
    if (!inUnit(placement.anchor.x) || !inUnit(placement.anchor.y)) errors.push('anchor must be normalized');
    if (!inUnit(placement.perspectiveDepth)) errors.push('perspective depth must be normalized');
    if (placement.baseScale <= 0) errors.push('base scale must be positive');
    if (Math.abs(placement.rotation ?? 0) > 8) errors.push('rotation exceeds restrained ±8° range');
    if (!inUnit(placement.occlusionStrength)) errors.push('occlusion strength must be normalized');
    const polygon = propOcclusionPolygon(placement);
    if (polygon.length < 3 || polygon.some(({ x, y }) => !inUnit(x) || !inUnit(y))) errors.push('occlusion geometry must be normalized');
    return { placementId: placement.id, valid: errors.length === 0, errors };
  });
}

export function propOcclusionPolygon(placement: ScenePropPlacement): readonly NormalizedPoint[] {
  if (placement.occlusion.kind === 'polygon') return placement.occlusion.points;
  const { offsetX, offsetY, width, height } = placement.occlusion;
  const x = placement.anchor.x + offsetX;
  const y = placement.anchor.y + offsetY;
  return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
}

export function propContainsPoint(placement: ScenePropPlacement, point: NormalizedPoint) {
  return pointInPolygon(point, propOcclusionPolygon(placement));
}

export function scenePropDisplayDepth(placement: ScenePropPlacement): number {
  const ranges: Readonly<Record<ScenePropLayer, readonly [number, number]>> = {
    'background-detail': [12, 22],
    midground: [36, 49],
    'gameplay-cover': [50, 66],
    foreground: [70, 84],
  };
  const range = ranges[placement.layer];
  return range[0] + (range[1] - range[0]) * placement.perspectiveDepth;
}

export function resolveActorPropDepth(
  placements: readonly ScenePropPlacement[],
  point: NormalizedPoint,
  baseDepth: number,
  actor: 'bird' | 'dog',
): ActorPropDepth {
  let result: ActorPropDepth = { depth: baseDepth, occlusion: 0, relation: 'clear' };
  for (const placement of placements) {
    if (!propContainsPoint(placement, point)) continue;
    if (actor === 'bird' && !placement.birdRelations.includes('behind')) continue;
    if (actor === 'dog' && !['behind', 'front', 'both'].includes(placement.dogPass)) continue;
    const forced = actor === 'dog' && (placement.dogPass === 'behind' || placement.dogPass === 'front') ? placement.dogPass : undefined;
    const relation = forced ?? (point.y <= placement.anchor.y ? 'behind' : 'front');
    const propDepth = scenePropDisplayDepth(placement);
    if (relation === 'behind') {
      const occlusion = actor === 'bird' ? placement.occlusionStrength : 0;
      if (occlusion >= result.occlusion || result.relation !== 'behind') result = { depth: propDepth - .5, occlusion, propId: placement.id, relation };
    } else if (result.relation !== 'behind') {
      result = { depth: Math.max(result.depth, propDepth + .5), occlusion: 0, propId: placement.id, relation };
    }
  }
  return result;
}

function inUnit(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}
