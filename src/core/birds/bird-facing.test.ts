import { describe, expect, it } from 'vitest';
import { shouldFlipSprite } from './bird-facing';

describe('sprite facing', () => {
  it('normalizes left- and right-authored sheets to either travel direction', () => {
    expect(shouldFlipSprite('right', 1)).toBe(false);
    expect(shouldFlipSprite('right', -1)).toBe(true);
    expect(shouldFlipSprite('left', -1)).toBe(false);
    expect(shouldFlipSprite('left', 1)).toBe(true);
  });
});
