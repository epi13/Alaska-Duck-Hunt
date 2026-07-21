import { describe, expect, it } from 'vitest';
import { BIRD_STATES } from '../core/birds/bird-state';
import { birdSprites, birdSpriteBySpecies } from './bird-sprites';
import { species } from './content';

describe('bird sprite atlas manifest', () => {
  it('maps every species to a unique, named two-variant atlas without fallbacks', () => {
    expect(birdSprites).toHaveLength(16);
    expect(new Set(birdSprites.map((sprite) => sprite.speciesId)).size).toBe(16);
    expect(new Set(birdSprites.map((sprite) => sprite.textureKey)).size).toBe(16);
    expect(new Set(species.map((entry) => entry.id))).toEqual(new Set(birdSprites.map((sprite) => sprite.speciesId)));
    for (const sprite of birdSprites) {
      expect(sprite.variants).toHaveLength(2);
      expect(sprite.imagePath).toBe(`assets/birds/${sprite.speciesId}/atlas.png`);
      expect(sprite.atlasPath).toBe(`assets/birds/${sprite.speciesId}/atlas.json`);
      expect(sprite.previewPath).toBe(`assets/birds/${sprite.speciesId}/preview.png`);
      expect(sprite.animations.flying?.frames.length).toBeGreaterThanOrEqual(3);
      expect(sprite.targetableStates).toContain('flying');
      expect(birdSpriteBySpecies.get(sprite.speciesId)).toBe(sprite);
    }
  });

  it('only refers to typed bird states', () => {
    const valid = new Set(BIRD_STATES);
    for (const sprite of birdSprites) for (const state of Object.keys(sprite.animations)) expect(valid.has(state as never)).toBe(true);
  });
});
