export type HabitatAtlas =
  | 'southcentral-wetland'
  | 'coastal-delta'
  | 'western-tundra'
  | 'boreal-interior'
  | 'southeast-rainforest'
  | 'arctic-alpine'
  | 'aleutian-coast'
  | 'winter-willow';

export interface SceneArt {
  locationId: string;
  background: string;
}

const scene = (locationId: string): SceneArt => ({
  locationId,
  background: `assets/scenes/${locationId}.png`,
});

export const sceneArt: SceneArt[] = [
  'matsu', 'cook', 'copper', 'yk', 'interior', 'arctic', 'aleutian', 'southeast', 'tundra', 'alpine', 'willow', 'river',
].map(scene);

export const sceneArtByLocation = new Map(sceneArt.map((entry) => [entry.locationId, entry]));

export const habitatAtlasPaths: Record<HabitatAtlas, string> = {
  'southcentral-wetland': 'assets/habitat/regions/southcentral-wetland.png',
  'coastal-delta': 'assets/habitat/regions/coastal-delta.png',
  'western-tundra': 'assets/habitat/regions/western-tundra.png',
  'boreal-interior': 'assets/habitat/regions/boreal-interior.png',
  'southeast-rainforest': 'assets/habitat/regions/southeast-rainforest.png',
  'arctic-alpine': 'assets/habitat/regions/arctic-alpine.png',
  'aleutian-coast': 'assets/habitat/regions/aleutian-coast.png',
  'winter-willow': 'assets/habitat/regions/winter-willow.png',
};

export const retrieverSheet = {
  key: 'alaska-field-retriever',
  path: 'assets/characters/retriever.png',
  frameWidth: 128,
  frameHeight: 128,
} as const;
