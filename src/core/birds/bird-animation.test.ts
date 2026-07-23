import { describe, expect, it } from 'vitest';
import { birdBehaviorBySpecies } from '../../data/bird-behaviors';
import { SeededRandom } from '../rng';
import { animationStartFrame, isLoopingBirdAnimation, shouldStartAnimation } from './bird-animation';
import { createFlockPlans } from './bird-plan';

describe('deterministic bird animation playback', () => {
  it('maps different loop phases to different starting frames', () => {
    expect(animationStartFrame(0.1, 4, true)).toBe(0);
    expect(animationStartFrame(0.7, 4, true)).toBe(2);
  });

  it('reproduces phases, rates, and starting frames for a repeated seed', () => {
    const profile = birdBehaviorBySpecies.get('mallard')!;
    const starts = (seed: string) => createFlockPlans(profile, new SeededRandom(seed), 6)
      .map(({ animationPhase, animationRateMultiplier }) => ({
        frame: animationStartFrame(animationPhase, 4, true),
        animationPhase,
        animationRateMultiplier,
      }));
    expect(starts('loop-replay')).toEqual(starts('loop-replay'));
    expect(starts('loop-replay')).not.toEqual(starts('another-round'));
  });

  it('always starts timed one-shots at their intended first frame', () => {
    expect(isLoopingBirdAnimation('takeoff', -1)).toBe(false);
    expect(animationStartFrame(0.87, 5, isLoopingBirdAnimation('takeoff', -1))).toBe(0);
  });

  it('does not request a restart while the same loop remains active', () => {
    expect(shouldStartAnimation('mallard-drake-natural-flying', 'mallard-drake-natural-flying')).toBe(false);
    expect(shouldStartAnimation('mallard-drake-natural-resting', 'mallard-drake-natural-flying')).toBe(true);
  });

  it('keeps every sampled rate inside the species profile limits', () => {
    for (const profile of birdBehaviorBySpecies.values()) {
      for (let seed = 0; seed < 12; seed += 1) {
        for (const bird of createFlockPlans(profile, new SeededRandom(`${profile.speciesId}-${seed}`), 8)) {
          expect(bird.animationRateMultiplier).toBeGreaterThanOrEqual(profile.animationRateMultiplier[0]);
          expect(bird.animationRateMultiplier).toBeLessThanOrEqual(profile.animationRateMultiplier[1]);
        }
      }
    }
  });
});

