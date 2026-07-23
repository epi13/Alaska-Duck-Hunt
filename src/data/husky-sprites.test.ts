import { describe, expect, it } from 'vitest';
import { huskyAnimationByState, huskySprite, type HuskyAnimationState } from './husky-sprites';

const requiredStates: readonly HuskyAnimationState[] = [
  'idle', 'sniff', 'searchWalk', 'searchTrot', 'run', 'slowCautious', 'alert',
  'lookHiddenBird', 'boundCover', 'flushReaction', 'stopWatch', 'celebrate', 'turnTransition',
];

describe('Alaskan Husky sprite manifest', () => {
  it('provides every gameplay and presentation state under neutral husky names', () => {
    expect([...huskyAnimationByState.keys()]).toEqual(requiredStates);
    expect(huskySprite.characterId).toBe('alaska-husky');
    expect(huskySprite.imagePath).toBe('assets/characters/alaska-husky/atlas.png');
  });

  it('keeps movement cycles animated and every frame uniquely mapped', () => {
    for (const state of ['searchWalk', 'searchTrot', 'run'] as const) {
      expect(huskyAnimationByState.get(state)?.frames).toHaveLength(2);
    }
    const frames = huskySprite.animations.flatMap(({ frames }) => frames);
    expect(new Set(frames).size).toBe(16);
    expect(huskySprite.contactAnchor).toEqual({ x: 0.5, y: 0.875 });
  });
});
