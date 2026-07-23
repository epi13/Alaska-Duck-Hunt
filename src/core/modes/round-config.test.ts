import { describe, expect, it } from 'vitest';
import { createRoundConfig } from '../../data/mode-configs';
import { type GameMode } from '../../data/content';
import { evaluateRound, validateRoundConfig } from './round-config';

const modes: readonly GameMode[] = [
  'campaign',
  'classic',
  'endless',
  'species',
  'identification',
  'time',
  'practice',
  'daily',
  'custom',
];

describe('RoundConfig generation', () => {
  it.each(modes)('creates a valid serializable %s configuration', (mode) => {
    const config = createRoundConfig(
      mode,
      mode === 'campaign' ? { roundIndex: 2 } : {},
      new Date('2026-07-22T23:59:59Z'),
    );
    expect(validateRoundConfig(config)).toEqual([]);
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
    expect(config.mode).toBe(mode);
    expect(config.targetSpeciesIds.length).toBeGreaterThan(0);
    expect(config.seed).not.toBe('');
  });

  it('uses distinct classic, endless, identification, time, and practice rules', () => {
    const classic = createRoundConfig('classic');
    const endless = createRoundConfig('endless');
    const identification = createRoundConfig('identification');
    const time = createRoundConfig('time', { durationSeconds: 30 });
    const practice = createRoundConfig('practice', {
      durationSeconds: 180,
      magazineSize: 12,
      speedMultiplier: 0.75,
      assists: { aimAssist: true },
    });

    expect(classic.objective.kind).toBe('hits');
    expect(classic.ammunition.reloads).toBe(2);
    expect(endless.endless).toBe(true);
    expect(endless.durationSeconds).toBeNull();
    expect(endless.passRequirements.maxMistakes).toBe(3);
    expect(identification.objective.kind).toBe('identification');
    expect(identification.scoring.protectedPenalty).toBeGreaterThan(
      classic.scoring.protectedPenalty,
    );
    expect(time.durationSeconds).toBe(30);
    expect(time.scoring.timeBonusPerSecond).toBeGreaterThan(0);
    expect(practice.ammunition.magazineSize).toBe(12);
    expect(practice.speedMultiplier).toBe(0.75);
    expect(practice.assists.aimAssist).toBe(true);
    expect(practice.passRequirements.minScore).toBe(0);
  });

  it('centers species challenge spawning on the chosen compatible target', () => {
    const config = createRoundConfig('species', {
      targetSpeciesIds: ['eider'],
      locationId: 'arctic',
    });
    expect(config.targetSpeciesIds).toEqual(['eider']);
    expect(config.spawnSpecies.find(({ speciesId }) => speciesId === 'eider')?.weight).toBe(8);
    expect(config.spawnSpecies.filter(({ role }) => role !== 'target').length).toBeGreaterThan(0);
  });

  it('uses a stable UTC date basis for the daily challenge', () => {
    const first = createRoundConfig('daily', {}, new Date('2026-07-22T00:00:01Z'));
    const second = createRoundConfig('daily', {}, new Date('2026-07-22T23:59:59Z'));
    const next = createRoundConfig('daily', {}, new Date('2026-07-23T00:00:00Z'));
    expect(first).toEqual(second);
    expect(first.challengeDate).toBe('2026-07-22');
    expect(first.seed).toBe('daily:2026-07-22');
    expect(next.seed).toBe('daily:2026-07-23');
    expect(next).not.toEqual(first);
  });

  it('evaluates mode-specific pass and identification requirements', () => {
    const config = createRoundConfig('identification');
    const failed = evaluateRound(config, {
      score: 900,
      hits: 4,
      shots: 6,
      accuracy: 67,
      identificationAccuracy: 67,
      protectedHits: 0,
      nonTargetHits: 2,
      misses: 0,
      elapsedSeconds: 75,
    });
    const passed = evaluateRound(config, {
      score: 1_200,
      hits: 5,
      shots: 5,
      accuracy: 100,
      identificationAccuracy: 100,
      protectedHits: 0,
      nonTargetHits: 0,
      misses: 0,
      elapsedSeconds: 75,
    });
    expect(failed.passed).toBe(false);
    expect(failed.failures).toContain('80% identification accuracy');
    expect(passed.passed).toBe(true);
  });

  it('treats the endless mistake budget as a failure threshold', () => {
    const config = createRoundConfig('endless');
    const evaluation = evaluateRound(config, {
      score: 500,
      hits: 3,
      shots: 6,
      accuracy: 50,
      identificationAccuracy: 75,
      protectedHits: 0,
      nonTargetHits: 0,
      misses: 3,
      elapsedSeconds: 40,
    });
    expect(evaluation.passed).toBe(false);
    expect(evaluation.failures).toContain('Fewer than 3 mistakes');
  });

  it('validates custom limits rather than accepting unsafe values', () => {
    const valid = createRoundConfig('custom', {
      durationSeconds: 180,
      magazineSize: 20,
      flockCap: 30,
      difficulty: 5,
    });
    expect(validateRoundConfig(valid)).toEqual([]);
    expect(valid.durationSeconds).toBe(180);
    expect(valid.ammunition.magazineSize).toBe(20);
    expect(valid.flockCap).toBe(30);
    expect(() =>
      createRoundConfig('custom', {
        targetSpeciesIds: [],
        magazineSize: 21,
      }),
    ).toThrow(/Select at least one target species.*Magazine size/);
  });
});
