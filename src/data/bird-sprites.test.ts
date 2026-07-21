import { describe, expect, it } from 'vitest';
import { birdSprites, birdSpriteBySpecies } from './bird-sprites';
import { species } from './content';

describe('bird sprite manifest', () => {
  it('maps ten unique illustrated species to four documented variants', () => {
    expect(birdSprites).toHaveLength(10);
    expect(new Set(birdSprites.map((sprite) => sprite.speciesId)).size).toBe(10);
    expect(new Set(birdSprites.map((sprite) => sprite.textureKey)).size).toBe(10);
    for (const sprite of birdSprites) {
      expect(sprite.variants).toHaveLength(4);
      expect(sprite.path).toBe(`assets/birds/${sprite.speciesId}.png`);
      expect(species.find((entry) => entry.id === sprite.speciesId)?.target).toBe(true);
      expect(birdSpriteBySpecies.get(sprite.speciesId)).toBe(sprite);
    }
  });
});
