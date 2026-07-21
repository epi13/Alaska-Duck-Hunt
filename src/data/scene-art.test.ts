import { describe, expect, it } from 'vitest';
import { locations } from './content';
import { habitatAtlasPaths, sceneArt } from './scene-art';

describe('scene art manifest', () => {
  it('covers every location exactly once', () => {
    expect(sceneArt.map((entry) => entry.locationId)).toEqual(locations.map((entry) => entry.id));
    expect(new Set(sceneArt.map((entry) => entry.background)).size).toBe(locations.length);
  });

  it('provides two playable occlusion planes', () => {
    for (const entry of sceneArt) {
      expect(entry.midground.length).toBeGreaterThanOrEqual(3);
      expect(entry.foreground.length).toBeGreaterThanOrEqual(4);
      expect(habitatAtlasPaths[entry.habitatAtlas]).toMatch(/\.png$/);
    }
  });
});
