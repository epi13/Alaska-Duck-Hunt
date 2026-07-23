import { describe, expect, it } from 'vitest';
import { huskyBoundLift, huskyFlushMotion, huskyPatrolMotion } from './husky-motion';

describe('Alaskan Husky motion plan', () => {
  it('is deterministic for the same phase and covers the authored patrol poses', () => {
    const sampled = Array.from({ length: 94 }, (_, index) => huskyPatrolMotion(index * 100, 37));
    expect(huskyPatrolMotion(2_000, 37)).toEqual(huskyPatrolMotion(2_000, 37));
    expect(new Set(sampled.map(({ state }) => state))).toEqual(new Set([
      'idle', 'sniff', 'searchWalk', 'searchTrot', 'slowCautious', 'alert', 'lookHiddenBird',
    ]));
  });

  it('aligns bound, reaction, watch, and run states to a flush event', () => {
    expect(huskyFlushMotion(0)?.state).toBe('boundCover');
    expect(huskyFlushMotion(300)?.state).toBe('flushReaction');
    expect(huskyFlushMotion(600)?.state).toBe('stopWatch');
    expect(huskyFlushMotion(1_000)?.state).toBe('run');
    expect(huskyFlushMotion(1_300)).toBeUndefined();
  });

  it('removes the airborne presentation in reduced-motion mode', () => {
    expect(huskyBoundLift(140, false)).toBeCloseTo(18);
    expect(huskyBoundLift(140, true)).toBe(0);
  });
});
