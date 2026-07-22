import { describe, expect, it } from 'vitest';
import { locations } from '../../data/content';
import { isTargetableState } from '../birds/bird-behavior';
import { sceneMapByLocation } from '../../data/scene-maps';
import { scenePropLayouts } from '../../data/scene-props';
import {
  propContainsPoint,
  resolveActorPropDepth,
  scenePropDisplayDepth,
  validateScenePropLayout,
  type ScenePropLayout,
  type ScenePropPlacement,
} from './scene-props';

describe('authored scene prop layouts', () => {
  it('validates every placement against its authored semantic map region', () => {
    expect(scenePropLayouts.map(({ locationId }) => locationId)).toEqual(locations.map(({ id }) => id));
    for (const layout of scenePropLayouts) {
      const map = sceneMapByLocation.get(layout.locationId)!;
      expect(validateScenePropLayout(layout, map).filter(({ valid }) => !valid), layout.locationId).toEqual([]);
      expect(layout.placements.length, layout.locationId).toBeGreaterThanOrEqual(8);
      expect(layout.placements.some(({ layer }) => layer === 'background-detail')).toBe(true);
      expect(layout.placements.some(({ layer }) => layer === 'gameplay-cover')).toBe(true);
      expect(layout.placements.some(({ layer }) => layer === 'foreground')).toBe(true);
    }
  });

  it('uses a visibly distinct stable composition signature for all twelve locations', () => {
    const signatures = scenePropLayouts.map((layout) => JSON.stringify(layout.placements.map(({ atlas, frame, anchor, layer, surfaceRegionId }) => ({ atlas, frame, anchor, layer, surfaceRegionId }))));
    expect(new Set(signatures).size).toBe(locations.length);
  });

  it('places occlusion around anchors and resolves actors behind or in front spatially', () => {
    const placement = scenePropLayouts[2]!.placements.find(({ id }) => id === 'copper-sedge-screen')!;
    expect(propContainsPoint(placement, placement.anchor)).toBe(true);
    const behind = resolveActorPropDepth([placement], { x: placement.anchor.x, y: placement.anchor.y - .02 }, 42, 'bird');
    expect(behind.relation).toBe('behind');
    expect(behind.depth).toBeLessThan(scenePropDisplayDepth(placement));
    expect(behind.occlusion).toBe(placement.occlusionStrength);
    expect(isTargetableState('resting', behind.occlusion)).toBe(false);
    const front = resolveActorPropDepth([placement], { x: placement.anchor.x, y: placement.anchor.y + .005 }, 42, 'dog');
    expect(front.relation).toBe('front');
    expect(front.depth).toBeGreaterThan(scenePropDisplayDepth(placement));
  });

  it('rejects an incompatible floating plant placement', () => {
    const source = scenePropLayouts[2]!.placements[0]!;
    const invalid: ScenePropPlacement = { ...source, id: 'copper-invalid-reed', type: 'reed', surfaceRegionId: 'copper-main-channel', anchor: { x: .2, y: .65 } };
    const layout: ScenePropLayout = { locationId: 'copper', placements: [invalid] };
    const validation = validateScenePropLayout(layout, sceneMapByLocation.get('copper')!)[0]!;
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(' ')).toContain('incompatible with openWater');
  });
});
