import { describe, expect, it } from 'vitest';
import { spatialAudio } from './spatial-audio';

describe('spatial audio projection', () => {
  it('pans from scene world X with bounded edges', () => {
    expect(spatialAudio({ worldX: 0, worldWidth: 1_280, mapDepth: 1 }).pan).toBe(-.88);
    expect(spatialAudio({ worldX: 640, worldWidth: 1_280, mapDepth: 1 }).pan).toBe(0);
    expect(spatialAudio({ worldX: 1_280, worldWidth: 1_280, mapDepth: 1 }).pan).toBe(.88);
  });

  it('makes distant, occluded, and rear sources quieter and less immediate', () => {
    const foreground = spatialAudio({ worldX: 640, worldWidth: 1_280, mapDepth: 1 });
    const distant = spatialAudio({ worldX: 640, worldWidth: 1_280, mapDepth: .1 });
    const covered = spatialAudio({ worldX: 640, worldWidth: 1_280, mapDepth: .1, occlusion: .8, rear: true });
    expect(foreground.gain).toBeGreaterThan(distant.gain);
    expect(distant.gain).toBeGreaterThan(covered.gain);
    expect(foreground.lowpassHz).toBeGreaterThan(distant.lowpassHz);
    expect(distant.lowpassHz).toBeGreaterThan(covered.lowpassHz);
  });

  it('keeps gain and filter values inside sensible limits', () => {
    const result = spatialAudio({ worldX: -900, worldWidth: 0, mapDepth: -4, occlusion: 9, rear: true });
    expect(result.pan).toBeGreaterThanOrEqual(-.88);
    expect(result.gain).toBeGreaterThanOrEqual(.16);
    expect(result.gain).toBeLessThanOrEqual(1);
    expect(result.lowpassHz).toBeGreaterThanOrEqual(1_600);
  });
});
