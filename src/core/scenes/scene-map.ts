import type { BirdSurface } from '../birds/bird-plan';
import type { SeededRandom } from '../rng';

export interface NormalizedPoint {
  readonly x: number;
  readonly y: number;
}

export type SceneGeometry =
  | { readonly kind: 'polygon'; readonly points: readonly NormalizedPoint[] }
  | { readonly kind: 'path'; readonly points: readonly NormalizedPoint[] };

export interface SceneRegion {
  readonly id: string;
  readonly surface: BirdSurface;
  readonly geometry: SceneGeometry;
  readonly depth: readonly [number, number];
  readonly displayDepth: number;
  readonly objectScale: readonly [number, number];
  readonly anchorHeight?: number;
  readonly birdFamilies?: readonly string[];
  readonly species?: readonly string[];
  readonly occludedBy?: readonly string[];
}

export interface SceneArea {
  readonly id: string;
  readonly polygon: readonly NormalizedPoint[];
  readonly displayDepth?: number;
}

export interface DogPatrolPath {
  readonly id: string;
  readonly points: readonly NormalizedPoint[];
  readonly displayDepth: number;
  readonly objectScale: readonly [number, number];
}

export interface SceneMap {
  readonly version: 1;
  readonly locationId: string;
  readonly sourceSize: readonly [number, number];
  readonly regions: readonly SceneRegion[];
  readonly dogPatrolPaths: readonly DogPatrolPath[];
  readonly noSpawnAreas: readonly SceneArea[];
  readonly foregroundOcclusionAreas: readonly SceneArea[];
}

export interface SceneMapQuery {
  readonly speciesId?: string;
  readonly birdFamily?: string;
  readonly visibleBounds?: Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;
}

export interface SampledScenePoint {
  readonly regionId: string;
  readonly surface: BirdSurface;
  readonly point: NormalizedPoint;
  readonly depth: number;
  readonly displayDepth: number;
  readonly scale: number;
  readonly anchorHeight: number;
  readonly occlusionAreaIds: readonly string[];
}

export interface SceneCoordinateTransform {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
}

const EPSILON = 1e-9;

export function createCoverTransform(
  sourceSize: readonly [number, number],
  worldSize: readonly [number, number],
): SceneCoordinateTransform {
  const scale = Math.max(worldSize[0] / sourceSize[0], worldSize[1] / sourceSize[1]);
  return {
    scale,
    offsetX: (worldSize[0] - sourceSize[0] * scale) / 2,
    offsetY: (worldSize[1] - sourceSize[1] * scale) / 2,
    sourceWidth: sourceSize[0],
    sourceHeight: sourceSize[1],
  };
}

export function normalizedToWorld(point: NormalizedPoint, transform: SceneCoordinateTransform): NormalizedPoint {
  return { x: transform.offsetX + point.x * transform.sourceWidth * transform.scale, y: transform.offsetY + point.y * transform.sourceHeight * transform.scale };
}

export function worldToNormalized(point: NormalizedPoint, transform: SceneCoordinateTransform): NormalizedPoint {
  return { x: (point.x - transform.offsetX) / (transform.sourceWidth * transform.scale), y: (point.y - transform.offsetY) / (transform.sourceHeight * transform.scale) };
}

export function regionsForSurface(
  map: SceneMap,
  surface: BirdSurface,
  query: SceneMapQuery = {},
): readonly SceneRegion[] {
  return map.regions.filter((region) =>
    region.surface === surface
    && (!region.species || !query.speciesId || region.species.includes(query.speciesId))
    && (!region.birdFamilies || !query.birdFamily || region.birdFamilies.includes(query.birdFamily))
    && (!query.visibleBounds || geometryIntersectsBounds(region.geometry, query.visibleBounds)),
  );
}

export function sampleScenePoint(
  map: SceneMap,
  surface: BirdSurface,
  rng: SeededRandom,
  query: SceneMapQuery = {},
): SampledScenePoint | undefined {
  const regions = regionsForSurface(map, surface, query);
  if (!regions.length) return undefined;
  const region = rng.pick(regions);
  const point = sampleGeometry(region.geometry, rng, map.noSpawnAreas, query.visibleBounds);
  if (!point) return undefined;
  const depth = interpolate(region.depth, point.y);
  const scale = interpolate(region.objectScale, depth);
  const occlusionAreaIds = map.foregroundOcclusionAreas
    .filter((area) => pointInPolygon(point, area.polygon))
    .map((area) => area.id);
  return {
    regionId: region.id,
    surface,
    point,
    depth,
    displayDepth: region.displayDepth,
    scale,
    anchorHeight: region.anchorHeight ?? point.y,
    occlusionAreaIds: [...(region.occludedBy ?? []), ...occlusionAreaIds],
  };
}

export function pointInPolygon(point: NormalizedPoint, polygon: readonly NormalizedPoint[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index]!;
    const b = polygon[previous]!;
    if (distanceToSegment(point, a, b).distance <= EPSILON) return true;
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function projectOntoGeometry(point: NormalizedPoint, geometry: SceneGeometry): NormalizedPoint {
  if (geometry.kind === 'polygon' && pointInPolygon(point, geometry.points)) return point;
  return nearestPointOnSegments(point, geometry.points, geometry.kind === 'polygon');
}

export function samplePathAt(path: readonly NormalizedPoint[], progress: number): NormalizedPoint {
  if (!path.length) throw new RangeError('A path requires at least one point.');
  if (path.length === 1) return path[0]!;
  const lengths = path.slice(1).map((point, index) => distance(path[index]!, point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (total <= EPSILON) return path[0]!;
  let remaining = Math.min(1, Math.max(0, progress)) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index]!;
    if (remaining <= length || index === lengths.length - 1) {
      const ratio = length <= EPSILON ? 0 : remaining / length;
      const start = path[index]!;
      const end = path[index + 1]!;
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= length;
  }
  return path[path.length - 1]!;
}

export function validateSceneMap(map: SceneMap): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const register = (id: string) => {
    if (!id.trim()) errors.push('Scene-map ids must not be empty.');
    if (ids.has(id)) errors.push(`Duplicate scene-map id: ${id}`);
    ids.add(id);
  };
  if (map.sourceSize[0] <= 0 || map.sourceSize[1] <= 0) errors.push('Source dimensions must be positive.');
  for (const region of map.regions) {
    register(region.id);
    const minimum = region.geometry.kind === 'polygon' ? 3 : 2;
    if (region.geometry.points.length < minimum) errors.push(`${region.id} requires at least ${minimum} points.`);
    validatePoints(region.id, region.geometry.points, errors);
    if (region.depth[0] > region.depth[1]) errors.push(`${region.id} has an inverted depth range.`);
    if (region.objectScale[0] <= 0 || region.objectScale[0] > region.objectScale[1]) errors.push(`${region.id} has an invalid object scale range.`);
  }
  for (const path of map.dogPatrolPaths) {
    register(path.id);
    if (path.points.length < 2) errors.push(`${path.id} requires at least two points.`);
    validatePoints(path.id, path.points, errors);
  }
  for (const area of [...map.noSpawnAreas, ...map.foregroundOcclusionAreas]) {
    register(area.id);
    if (area.polygon.length < 3) errors.push(`${area.id} requires at least three points.`);
    validatePoints(area.id, area.polygon, errors);
  }
  return errors;
}

function validatePoints(id: string, points: readonly NormalizedPoint[], errors: string[]) {
  if (points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1)) {
    errors.push(`${id} contains a point outside normalized bounds.`);
  }
}

function sampleGeometry(
  geometry: SceneGeometry,
  rng: SeededRandom,
  exclusions: readonly SceneArea[],
  visibleBounds?: SceneMapQuery['visibleBounds'],
): NormalizedPoint | undefined {
  if (geometry.kind === 'path') {
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const point = samplePathAt(geometry.points, rng.next());
      if (isAllowed(point, exclusions, visibleBounds)) return point;
    }
    return undefined;
  }
  const xs = geometry.points.map(({ x }) => x);
  const ys = geometry.points.map(({ y }) => y);
  const minX = Math.max(Math.min(...xs), visibleBounds?.minX ?? 0);
  const maxX = Math.min(Math.max(...xs), visibleBounds?.maxX ?? 1);
  const minY = Math.max(Math.min(...ys), visibleBounds?.minY ?? 0);
  const maxY = Math.min(Math.max(...ys), visibleBounds?.maxY ?? 1);
  if (minX > maxX || minY > maxY) return undefined;
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const point = { x: minX + rng.next() * (maxX - minX), y: minY + rng.next() * (maxY - minY) };
    if (pointInPolygon(point, geometry.points) && isAllowed(point, exclusions, visibleBounds)) return point;
  }
  return undefined;
}

function isAllowed(point: NormalizedPoint, exclusions: readonly SceneArea[], bounds?: SceneMapQuery['visibleBounds']) {
  return (!bounds || (point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY))
    && !exclusions.some((area) => pointInPolygon(point, area.polygon));
}

function geometryIntersectsBounds(geometry: SceneGeometry, bounds: NonNullable<SceneMapQuery['visibleBounds']>) {
  return geometry.points.some((point) => point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY);
}

function nearestPointOnSegments(point: NormalizedPoint, points: readonly NormalizedPoint[], closed: boolean) {
  if (!points.length) throw new RangeError('Geometry requires at least one point.');
  if (points.length === 1) return points[0]!;
  let best = { point: points[0]!, distance: Number.POSITIVE_INFINITY };
  const segmentCount = closed ? points.length : points.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const candidate = distanceToSegment(point, points[index]!, points[(index + 1) % points.length]!);
    if (candidate.distance < best.distance) best = candidate;
  }
  return best.point;
}

function distanceToSegment(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const squared = dx * dx + dy * dy;
  const ratio = squared <= EPSILON ? 0 : Math.min(1, Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squared));
  const projected = { x: start.x + ratio * dx, y: start.y + ratio * dy };
  return { point: projected, distance: distance(point, projected) };
}

function distance(a: NormalizedPoint, b: NormalizedPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function interpolate(range: readonly [number, number], factor: number) {
  const value = Math.min(1, Math.max(0, factor));
  return range[0] + (range[1] - range[0]) * value;
}
