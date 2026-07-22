import { describe, expect, it } from 'vitest';
import type { BirdSurface } from '../birds/bird-plan';
import { SeededRandom } from '../rng';
import { sceneMapByLocation, sceneMaps } from '../../data/scene-maps';
import { locations } from '../../data/content';
import {
  createCoverTransform,
  normalizedToWorld,
  pointInPolygon,
  projectOntoGeometry,
  regionsForSurface,
  sampleScenePoint,
  validateSceneMap,
  worldToNormalized,
  type SceneMap,
} from './scene-map';

const simpleMap: SceneMap = {
  version: 1,
  locationId: 'test',
  sourceSize: [1280, 720],
  regions: [{
    id: 'test-water',
    surface: 'openWater',
    geometry: { kind: 'polygon', points: [{ x: .2, y: .5 }, { x: .8, y: .5 }, { x: .8, y: .9 }, { x: .2, y: .9 }] },
    depth: [.4, .9],
    displayDepth: 42,
    objectScale: [.7, 1.1],
  }],
  dogPatrolPaths: [{ id: 'test-dog', points: [{ x: .1, y: .9 }, { x: .9, y: .85 }], displayDepth: 58, objectScale: [.8, 1] }],
  noSpawnAreas: [{ id: 'test-island', polygon: [{ x: .45, y: .65 }, { x: .55, y: .65 }, { x: .55, y: .75 }, { x: .45, y: .75 }] }],
  foregroundOcclusionAreas: [{ id: 'test-reeds', polygon: [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: 1 }, { x: .2, y: 1 }] }],
};

describe('semantic scene-map geometry', () => {
  it('looks up polygon regions by surface and detects contained points', () => {
    expect(regionsForSurface(simpleMap, 'openWater').map(({ id }) => id)).toEqual(['test-water']);
    expect(pointInPolygon({ x: .3, y: .6 }, simpleMap.regions[0]!.geometry.points)).toBe(true);
    expect(pointInPolygon({ x: .1, y: .6 }, simpleMap.regions[0]!.geometry.points)).toBe(false);
  });

  it('samples deterministically and excludes no-spawn polygons', () => {
    const first = sampleScenePoint(simpleMap, 'openWater', new SeededRandom('scene-seed'));
    const second = sampleScenePoint(simpleMap, 'openWater', new SeededRandom('scene-seed'));
    expect(first).toEqual(second);
    expect(first).toBeDefined();
    expect(pointInPolygon(first!.point, simpleMap.noSpawnAreas[0]!.polygon)).toBe(false);
  });

  it('projects onto a shoreline segment', () => {
    const projected = projectOntoGeometry(
      { x: .5, y: .2 },
      { kind: 'path', points: [{ x: .1, y: .7 }, { x: .9, y: .7 }] },
    );
    expect(projected.x).toBeCloseTo(.5);
    expect(projected.y).toBeCloseTo(.7);
  });

  it('converts normalized coordinates through desktop, tablet, and mobile cover crops', () => {
    for (const size of [[1280, 720], [820, 620], [390, 844]] as const) {
      const transform = createCoverTransform([1280, 720], size);
      const normalized = { x: .52, y: .76 };
      const world = normalizedToWorld(normalized, transform);
      expect(worldToNormalized(world, transform)).toEqual(expect.objectContaining({ x: expect.closeTo(.52), y: expect.closeTo(.76) }));
    }
    expect(createCoverTransform([1280, 720], [390, 844]).offsetX).toBeLessThan(0);
  });

  it('rejects surfaces with no authored region', () => {
    expect(sampleScenePoint(simpleMap, 'forestFloor' as BirdSurface, new SeededRandom(4))).toBeUndefined();
  });
});

describe('authored scene-map catalog', () => {
  it('has a valid, non-placeholder map for every location', () => {
    expect(sceneMaps.map(({ locationId }) => locationId)).toEqual(locations.map(({ id }) => id));
    const signatures = new Set<string>();
    for (const map of sceneMaps) {
      expect(validateSceneMap(map), map.locationId).toEqual([]);
      expect(map.regions.length, map.locationId).toBeGreaterThanOrEqual(3);
      expect(map.dogPatrolPaths.length, map.locationId).toBeGreaterThan(0);
      expect(map.noSpawnAreas.length, map.locationId).toBeGreaterThan(0);
      expect(map.foregroundOcclusionAreas.length, map.locationId).toBeGreaterThan(0);
      expect(map.regions.every(({ id }) => id.startsWith(`${map.locationId}-`))).toBe(true);
      signatures.add(JSON.stringify(map.regions.map(({ surface, geometry }) => [surface, geometry.points])));
      expect(sceneMapByLocation.get(map.locationId)).toBe(map);
    }
    expect(signatures.size).toBe(locations.length);
  });
});
