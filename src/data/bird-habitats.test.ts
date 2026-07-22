import { describe, expect, it } from 'vitest';
import { birdBehaviors } from './bird-behaviors';
import { birdHabitatBySpecies, profilesForLocation } from './bird-habitats';
import { sceneMaps } from './scene-maps';

describe('location-aware bird habitat', () => {
  it('limits species and surfaces to their location affinity', () => {
    const alpine = profilesForLocation('alpine', birdBehaviors);
    expect(alpine.map((profile) => profile.speciesId)).toEqual(['ptarmigan']);
    expect(alpine[0]?.surfaces).toEqual(['tundraGround', 'snowGround']);
  });

  it('gives every eligible profile a visible compatible spawn zone', () => {
    for (const { locationId, regions } of sceneMaps) {
      for (const profile of profilesForLocation(locationId, birdBehaviors)) {
        expect(
          profile.surfaces.every((surface) => regions.some((region) => region.surface === surface)),
          `${locationId}/${profile.speciesId} has a surface without a scene-map region`,
        ).toBe(true);
        expect(birdHabitatBySpecies.get(profile.speciesId)?.locations).toContain(locationId);
      }
    }
  });
});
