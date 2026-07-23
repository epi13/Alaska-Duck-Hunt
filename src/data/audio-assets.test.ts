import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { audioAssets, locationAmbience } from './audio-assets';

describe('offline licensed audio catalog', () => {
  it('has unique, bounded definitions for every required category', () => {
    expect(new Set(audioAssets.map(({ id }) => id)).size).toBe(audioAssets.length);
    expect(audioAssets.length).toBe(42);
    expect(new Set(audioAssets.map(({ bus }) => bus))).toEqual(new Set(['music', 'ambience', 'effects', 'birds', 'dog', 'UI']));
    for (const asset of audioAssets) {
      expect(asset.path).toBe(`assets/audio/${asset.id}.ogg`);
      expect(asset.masterPath).toBe(`assets/generated/audio/masters/${asset.id}.wav`);
      expect(asset.baseGain).toBeGreaterThan(0);
      expect(asset.baseGain).toBeLessThanOrEqual(1);
      expect(asset.maxVoices).toBeGreaterThan(0);
    }
  });

  it('ships every processed cue offline and retains separate masters', async () => {
    const runtime = new Set((await readdir('public/assets/audio')).filter((name) => name.endsWith('.ogg')));
    const masters = new Set(await readdir('assets/generated/audio/masters'));
    for (const asset of audioAssets) {
      expect(runtime.has(`${asset.id}.ogg`)).toBe(true);
      expect(masters.has(`${asset.id}.wav`)).toBe(true);
      expect((await readFile(`public/${asset.path}`)).subarray(0, 4).toString('ascii')).toBe('OggS');
    }
  });

  it('records complete redistribution rights and covers every location', async () => {
    const manifest = JSON.parse(await readFile('assets/generated/audio/manifest.json', 'utf8')) as {
      assets: Array<{ id: string; originalProceduralSynthesis: boolean; externalRecordingUsed: boolean; license: string }>;
    };
    expect(manifest.assets.map(({ id }) => id).sort()).toEqual(audioAssets.map(({ id }) => id).sort());
    expect(manifest.assets.every(({ originalProceduralSynthesis, externalRecordingUsed, license }) =>
      originalProceduralSynthesis && !externalRecordingUsed && license.includes('MIT'))).toBe(true);
    expect(Object.keys(locationAmbience)).toHaveLength(12);
    expect(Object.values(locationAmbience).every((cues) => cues.length === 2 && cues.every((cue) => audioAssets.some(({ id }) => id === cue)))).toBe(true);
  });
});
