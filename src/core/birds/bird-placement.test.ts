import { describe, expect, it } from 'vitest';
import { birdBehaviors } from '../../data/bird-behaviors';
import { SeededRandom } from '../rng';
import { createBirdPlan } from './bird-plan';
import { assertBirdPlacement, birdPlacementCompatibility, type BirdFamily } from './bird-placement';

describe('bird surface-state compatibility', () => {
  it('covers every bird family with deterministic valid plans', () => {
    const families = new Set<BirdFamily>();
    for (const profile of birdBehaviors) {
      families.add(profile.family);
      const first = createBirdPlan(profile, new SeededRandom(`placement-${profile.speciesId}`));
      const second = createBirdPlan(profile, new SeededRandom(`placement-${profile.speciesId}`));
      expect(first).toEqual(second);
      expect(assertBirdPlacement(
        first.speciesId,
        profile.family,
        first.initialState,
        first.surface,
        first.surface === 'lowBranch' ? 'test-perch' : undefined,
      ).compatible).toBe(true);
      expect(['flying', 'distant', 'banking', 'climbing', 'descending', 'landing', 'returning']).not.toContain(first.initialState);
    }
    expect(families).toEqual(new Set<BirdFamily>(['dabbler', 'diver', 'seaDuck', 'goose', 'crane', 'upland']));
  });

  it('separates water, ground, perch, rock, snow, and concealment locomotion', () => {
    expect(birdPlacementCompatibility('mallard', 'dabbler', 'swimming', 'openWater').contact).toBe('waterline');
    expect(birdPlacementCompatibility('grouse', 'upland', 'walking', 'forestFloor').contact).toBe('feet');
    expect(birdPlacementCompatibility('ptarmigan', 'upland', 'foraging', 'snowGround').contact).toBe('belly');
    expect(birdPlacementCompatibility('harlequin', 'seaDuck', 'resting', 'rockyCoast').compatible).toBe(true);
    expect(assertBirdPlacement('grouse', 'upland', 'perched', 'lowBranch', 'interior-low-branch').contact).toBe('branchGrip');
    expect(birdPlacementCompatibility('crane', 'crane', 'concealed', 'tallGrass').contact).toBe('concealedBaseline');
  });

  it('rejects cross-surface states, missing perches, and implicit airborne starts', () => {
    expect(() => assertBirdPlacement('mallard', 'dabbler', 'swimming', 'forestFloor')).toThrow(/requires mapped open or shallow water/);
    expect(() => assertBirdPlacement('grouse', 'upland', 'walking', 'openWater')).toThrow(/requires mapped dry or wet ground/);
    expect(() => assertBirdPlacement('grouse', 'upland', 'perched', 'lowBranch')).toThrow(/missing perch id/);
    expect(() => assertBirdPlacement('mallard', 'dabbler', 'flying', 'openWater')).toThrow(/explicit airborne wave/);
    expect(assertBirdPlacement('mallard', 'dabbler', 'flying', 'openWater', undefined, true).locomotion).toBe('airborne');
  });
});
