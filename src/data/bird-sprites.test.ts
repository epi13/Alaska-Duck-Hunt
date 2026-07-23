import { describe, expect, it } from 'vitest';
import { BIRD_STATES } from '../core/birds/bird-state';
import { birdPlacementCompatibility } from '../core/birds/bird-placement';
import { birdBehaviors } from './bird-behaviors';
import { birdSprites, birdSpriteBySpecies, contactAnchorFor } from './bird-sprites';
import { species } from './content';

describe('bird sprite atlas manifest', () => {
  it('maps every species to a bounded biological and individual-treatment atlas without fallbacks', () => {
    expect(birdSprites).toHaveLength(16);
    expect(new Set(birdSprites.map((sprite) => sprite.speciesId)).size).toBe(16);
    expect(new Set(birdSprites.map((sprite) => sprite.textureKey)).size).toBe(16);
    expect(new Set(species.map((entry) => entry.id))).toEqual(new Set(birdSprites.map((sprite) => sprite.speciesId)));
    for (const sprite of birdSprites) {
      expect(sprite.biologicalVariants).toHaveLength(2);
      expect(sprite.individualVisualVariants).toEqual(['natural', 'alternate']);
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

  it('authors every state-specific contact required by compatible spawn pairs', () => {
    for (const profile of birdBehaviors) {
      const sprite = birdSpriteBySpecies.get(profile.speciesId)!;
      for (const surface of profile.surfaces) for (const state of profile.initialStates) {
        const compatibility = birdPlacementCompatibility(profile.speciesId, profile.family, state, surface);
        if (!compatibility.compatible) continue;
        const anchor = contactAnchorFor(sprite, state, compatibility.contact);
        expect(anchor.x, `${profile.speciesId}/${state}/${compatibility.contact}`).toBeGreaterThanOrEqual(0);
        expect(anchor.x).toBeLessThanOrEqual(1);
        expect(anchor.y).toBeGreaterThanOrEqual(0);
        expect(anchor.y).toBeLessThanOrEqual(1);
      }
    }
  });
});
