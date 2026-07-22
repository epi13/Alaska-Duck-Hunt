import { describe, expect, it } from 'vitest';
import { locations } from './content';
import { habitatAtlasPaths, sceneArt } from './scene-art';
import { scenePropLayouts } from './scene-props';

describe('scene art manifest', () => {
  it('covers every location exactly once', () => {
    expect(sceneArt.map((entry) => entry.locationId)).toEqual(locations.map((entry) => entry.id));
    expect(new Set(sceneArt.map((entry) => entry.background)).size).toBe(locations.length);
  });

  it('keeps placement authority in the per-location prop layouts', () => {
    expect(scenePropLayouts.map(({ locationId }) => locationId)).toEqual(locations.map(({ id }) => id));
    expect(Object.values(habitatAtlasPaths).every((path) => path.endsWith('.png'))).toBe(true);
    expect(sceneArt.every((entry) => !('midground' in entry) && !('foreground' in entry))).toBe(true);
  });
});
