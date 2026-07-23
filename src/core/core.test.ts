import { describe, expect, it } from 'vitest';
import { translateControllerPacket } from './input';
import { generateRound, type RoundSettings } from './round-generator';
import { dailySeed, SeededRandom } from './rng';
import { accuracy, applyShot, initialScore } from './scoring';
import { createDefaultSave, migrateSave, parseSave, SAVE_VERSION, serializeSave } from './save';

describe('deterministic generation', () => {
  it('repeats random sequences', () => {
    expect(Array.from({ length: 8 }, () => new SeededRandom('same').next())).not.toEqual([]);
    const a = new SeededRandom('same'); const b = new SeededRandom('same');
    expect(Array.from({ length: 8 }, () => a.next())).toEqual(Array.from({ length: 8 }, () => b.next()));
  });
  it('reproduces a round and changes with another seed', () => {
    const settings: RoundSettings = { seed: 'delta', durationMs: 20_000, difficulty: 3, species: [{ id: 'mallard', role: 'target', weight: 4, speed: [80, 120], behaviors: ['arc', 's-turn'] }, { id: 'swan', role: 'protected', weight: 1, speed: [50, 70], behaviors: ['straight'] }] };
    expect(generateRound(settings)).toEqual(generateRound(settings));
    expect(generateRound(settings)).not.toEqual(generateRound({ ...settings, seed: 'echo' }));
  });
  it('uses a stable UTC daily seed', () =>
    expect(dailySeed(new Date('2026-07-19T23:00:00Z'))).toBe('2026-07-19'));
});

describe('scoring', () => {
  it('rewards valid streaks and resets on misses', () => {
    let state = initialScore();
    state = applyShot(state, { role: 'target', reactionMs: 400, distance: 0.8, cleanHit: true });
    state = applyShot(state, { role: 'target' });
    expect(state.combo).toBe(2); expect(state.score).toBeGreaterThan(1_000); expect(accuracy(state)).toBe(1);
    state = applyShot(state, { role: 'miss' });
    expect(state.combo).toBe(0); expect(accuracy(state)).toBeCloseTo(2 / 3);
  });
  it('applies a strong protected penalty without negative totals', () => expect(applyShot(initialScore(), { role: 'protected' }).score).toBe(0));
});

describe('save compatibility', () => {
  it('migrates partial legacy data and recovers corruption', () => {
    const migrated = migrateSave({ version: 1, profile: { name: 'Avery' }, stats: { shots: 4 } });
    expect(migrated.version).toBe(SAVE_VERSION); expect(migrated.profile.name).toBe('Avery'); expect(migrated.stats.shots).toBe(4);
    expect(parseSave('{broken')).toEqual(createDefaultSave());
    expect(parseSave(serializeSave(migrated))).toEqual(migrated);
  });
  it('migrates the legacy campaign location alias while preserving unrelated data', () => {
    const migrated = migrateSave({
      version: 2,
      campaign: {
        completedMissions: ['matsu-wetlands'],
        unlockedLocations: ['matsu-wetlands', 'cook'],
      },
      settings: { masterVolume: 0.25 },
      records: { highScores: { classic: 1234 } },
    });
    expect(migrated.campaign.completedLocations).toEqual(['matsu']);
    expect(migrated.campaign.unlockedLocations).toEqual(['matsu', 'cook']);
    expect(migrated.settings.masterVolume).toBe(0.25);
    expect(migrated.records.highScores.classic).toBe(1234);
  });
});

describe('controller translation', () => {
  it('normalizes aim and trigger packets', () => {
    expect(translateControllerPacket({ type: 'aim', x: 2, y: -1, timestamp: 4 })).toMatchObject({ action: 'aim', x: 1, y: 0 });
    expect(translateControllerPacket({ type: 'trigger', pressed: true, timestamp: 5 })).toMatchObject({ action: 'fire', phase: 'pressed' });
  });
});
