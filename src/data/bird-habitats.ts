import type { BirdSurface } from '../core/birds/bird-plan';
import type { BirdBehaviorProfile } from './bird-behaviors';

export interface BirdHabitatAffinity {
  speciesId: string;
  locations: readonly string[];
  preferredSurfaces: readonly BirdSurface[];
}

export const birdHabitats: readonly BirdHabitatAffinity[] = [
  { speciesId: 'mallard', locations: ['matsu', 'cook', 'copper', 'yk', 'interior', 'southeast', 'tundra', 'river'], preferredSurfaces: ['shallowWater', 'shoreline', 'marshGrass'] },
  { speciesId: 'pintail', locations: ['matsu', 'cook', 'copper', 'yk', 'arctic', 'tundra', 'river'], preferredSurfaces: ['shallowWater', 'mudflat', 'marshGrass'] },
  { speciesId: 'wigeon', locations: ['matsu', 'cook', 'copper', 'yk', 'southeast', 'tundra', 'river'], preferredSurfaces: ['shoreline', 'marshGrass', 'shallowWater'] },
  { speciesId: 'teal', locations: ['matsu', 'cook', 'copper', 'yk', 'interior', 'arctic', 'tundra', 'river'], preferredSurfaces: ['shallowWater', 'mudflat', 'marshGrass'] },
  { speciesId: 'scaup', locations: ['cook', 'copper', 'yk', 'arctic', 'aleutian', 'southeast', 'tundra'], preferredSurfaces: ['openWater', 'shallowWater'] },
  { speciesId: 'eider', locations: ['cook', 'arctic', 'aleutian'], preferredSurfaces: ['openWater', 'rockyCoast', 'shoreline'] },
  { speciesId: 'harlequin', locations: ['cook', 'aleutian', 'southeast'], preferredSurfaces: ['openWater', 'rockyCoast', 'riverEdge'] },
  { speciesId: 'goldeneye', locations: ['matsu', 'cook', 'copper', 'interior', 'southeast', 'river'], preferredSurfaces: ['openWater', 'riverEdge', 'shallowWater'] },
  { speciesId: 'goose', locations: ['matsu', 'cook', 'copper', 'yk', 'arctic', 'tundra', 'river'], preferredSurfaces: ['marshGrass', 'tundraGround', 'mudflat'] },
  { speciesId: 'canada-goose', locations: ['matsu', 'cook', 'copper', 'interior', 'southeast', 'tundra', 'river'], preferredSurfaces: ['marshGrass', 'shoreline', 'shallowWater'] },
  { speciesId: 'snow-goose', locations: ['copper', 'yk', 'arctic', 'tundra', 'river'], preferredSurfaces: ['tundraGround', 'marshGrass', 'mudflat'] },
  { speciesId: 'brant', locations: ['cook', 'yk', 'arctic', 'aleutian'], preferredSurfaces: ['shoreline', 'mudflat', 'shallowWater'] },
  { speciesId: 'crane', locations: ['matsu', 'copper', 'yk', 'interior', 'tundra', 'river'], preferredSurfaces: ['tallGrass', 'marshGrass', 'tundraGround'] },
  { speciesId: 'grouse', locations: ['matsu', 'interior', 'southeast', 'alpine', 'willow'], preferredSurfaces: ['forestFloor', 'lowBranch'] },
  { speciesId: 'ptarmigan', locations: ['matsu', 'interior', 'arctic', 'tundra', 'alpine', 'willow'], preferredSurfaces: ['tundraGround', 'snowGround', 'marshGrass'] },
  { speciesId: 'spectacled', locations: ['yk', 'arctic', 'tundra'], preferredSurfaces: ['shallowWater', 'marshGrass', 'openWater'] },
];

export const birdHabitatBySpecies = new Map(
  birdHabitats.map((entry) => [entry.speciesId, entry] as const),
);

export function profilesForLocation<T extends BirdBehaviorProfile>(
  locationId: string,
  profiles: readonly T[],
): T[] {
  return profiles.filter((profile) =>
    birdHabitatBySpecies.get(profile.speciesId)?.locations.includes(locationId),
  );
}
