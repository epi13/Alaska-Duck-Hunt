import { describe, expect, it } from 'vitest';
import { birdBehaviorBySpecies, birdBehaviors } from '../../data/bird-behaviors';
import { birdHabitats, profilesForLocation } from '../../data/bird-habitats';
import { scoreBird } from '../../data/bird-scoring';
import { SeededRandom } from '../rng';
import { disturbanceDelay, flightVector, isTargetableState } from './bird-behavior';
import { createBirdPlan, createFlockPlans } from './bird-plan';
import { transitionBirdState } from './bird-state';

describe('deterministic species behavior', () => {
  it('builds identical plans and flock offsets from identical seeds', () => {
    const profile = birdBehaviorBySpecies.get('teal')!;
    const flock = createFlockPlans(profile, new SeededRandom('same'));
    expect(flock).toEqual(createFlockPlans(profile, new SeededRandom('same')));
    expect(createFlockPlans(profile, new SeededRandom('same'))).not.toEqual(createFlockPlans(profile, new SeededRandom('different')));
    if (flock.length > 1) expect(flock.some((bird) => bird.formationOffsetX !== 0 || bird.formationOffsetY !== 0)).toBe(true);
    if (flock.length > 1) expect(new Set(flock.map((bird) => bird.idleDirection)).size).toBe(2);
  });

  it('matches grounded animation states to the selected surface', () => {
    const profile = birdBehaviorBySpecies.get('mallard')!;
    for (let seed = 0; seed < 40; seed += 1) {
      const plan = createBirdPlan(profile, new SeededRandom(seed));
      if (['openWater', 'shallowWater'].includes(plan.surface)) {
        expect(['swimming', 'diving', 'resting', 'alert']).toContain(plan.initialState);
      } else {
        expect(['foraging', 'walking', 'concealed', 'resting', 'alert']).toContain(plan.initialState);
      }
    }
  });

  it('keeps all sixteen profiles habitat-addressable', () => {
    expect(birdBehaviors).toHaveLength(16);
    expect(birdHabitats).toHaveLength(16);
    expect(profilesForLocation('arctic', birdBehaviors).map((profile) => profile.speciesId)).toEqual(expect.arrayContaining(['eider', 'snow-goose', 'spectacled', 'ptarmigan']));
  });

  it('distinguishes vertical dabbler launch from heavy diver water run', () => {
    expect(birdBehaviorBySpecies.get('mallard')?.takeoffStyle).toBe('verticalLaunch');
    expect(birdBehaviorBySpecies.get('eider')?.takeoffStyle).toBe('longWaterRun');
    expect(birdBehaviorBySpecies.get('teal')?.maximumTurnRate).toBeGreaterThan(birdBehaviorBySpecies.get('eider')!.maximumTurnRate);
  });

  it('models short upland relocation and likely landing', () => {
    const grouse = createBirdPlan(birdBehaviorBySpecies.get('grouse')!, new SeededRandom(14));
    const ptarmigan = birdBehaviorBySpecies.get('ptarmigan')!;
    expect(grouse.flightProfile).toBe('localRelocation');
    expect(flightVector(grouse, 1_200).y).toBeGreaterThan(0);
    expect(ptarmigan.landingProbability).toBeGreaterThan(0.8);
  });

  it('requires dog proximity and preserves concealment as non-targetable', () => {
    const plan = createBirdPlan(birdBehaviorBySpecies.get('mallard')!, new SeededRandom(1));
    expect(disturbanceDelay(plan, { dogX: 0, dogY: 0, birdX: plan.disturbanceRadius + 1, birdY: 0, nowMs: 0 })).toBeUndefined();
    expect(disturbanceDelay(plan, { dogX: 0, dogY: 0, birdX: 4, birdY: 4, nowMs: 0 })).toBeLessThan(plan.reactionDelayMs);
    expect(isTargetableState('concealed', 0)).toBe(false);
    expect(isTargetableState('flying', 0)).toBe(true);
  });

  it('runs the crane reveal sequence before takeoff', () => {
    let state = transitionBirdState('concealed', 'disturbed', { revealBeforeFlush: true });
    expect(state).toBe('revealing');
    state = transitionBirdState(state, 'reveal-complete', { revealBeforeFlush: true });
    expect(state).toBe('standingBonus');
    state = transitionBirdState(state, 'alert-complete', { revealBeforeFlush: true });
    expect(state).toBe('preTakeoff');
  });

  it('awards the standing crane bonus and never awards a protected eider', () => {
    const craneStanding = scoreBird({ speciesId: 'crane', state: 'standingBonus', distance: 0.5, speedRatio: 1, combo: 0 });
    const craneFlying = scoreBird({ speciesId: 'crane', state: 'flying', distance: 0.5, speedRatio: 1, combo: 0 });
    expect(craneStanding.points).toBe(craneFlying.points * 2);
    expect(craneStanding.label).toContain('UPRIGHT');
    expect(scoreBird({ speciesId: 'spectacled', state: 'flying', distance: 1, speedRatio: 1, combo: 9 })).toEqual({ points: 0, protectedPenalty: 1500 });
  });
});
