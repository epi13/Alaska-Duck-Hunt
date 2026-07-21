export type HabitatAtlas = 'wetland' | 'forest' | 'arctic';

export interface HabitatProp {
  frame: number;
  x: number;
  y: number;
  scale: number;
  flip?: boolean;
}

export interface SceneArt {
  locationId: string;
  background: string;
  habitatAtlas: HabitatAtlas;
  midground: HabitatProp[];
  foreground: HabitatProp[];
}

const wetlandMid: HabitatProp[] = [
  { frame: 3, x: 0.1, y: 0.79, scale: 0.72 },
  { frame: 2, x: 0.54, y: 0.82, scale: 0.58, flip: true },
  { frame: 5, x: 0.87, y: 0.83, scale: 0.68 },
];
const wetlandFront: HabitatProp[] = [
  { frame: 0, x: 0.02, y: 1.02, scale: 1.08 },
  { frame: 4, x: 0.34, y: 1.03, scale: 0.92 },
  { frame: 7, x: 0.72, y: 1.02, scale: 1.04, flip: true },
  { frame: 1, x: 0.98, y: 1.02, scale: 0.98 },
];
const forestMid: HabitatProp[] = [
  { frame: 0, x: 0.08, y: 0.78, scale: 0.83 },
  { frame: 1, x: 0.61, y: 0.83, scale: 0.64 },
  { frame: 7, x: 0.91, y: 0.84, scale: 0.7, flip: true },
];
const forestFront: HabitatProp[] = [
  { frame: 4, x: 0.02, y: 1.03, scale: 1.02 },
  { frame: 3, x: 0.31, y: 1.02, scale: 0.92 },
  { frame: 6, x: 0.68, y: 1.03, scale: 1.0 },
  { frame: 5, x: 0.97, y: 1.03, scale: 0.96, flip: true },
];
const arcticMid: HabitatProp[] = [
  { frame: 0, x: 0.1, y: 0.83, scale: 0.62 },
  { frame: 2, x: 0.56, y: 0.84, scale: 0.57 },
  { frame: 6, x: 0.9, y: 0.82, scale: 0.67, flip: true },
];
const arcticFront: HabitatProp[] = [
  { frame: 4, x: 0.03, y: 1.03, scale: 1.08 },
  { frame: 5, x: 0.34, y: 1.03, scale: 0.92 },
  { frame: 6, x: 0.7, y: 1.03, scale: 0.96, flip: true },
  { frame: 7, x: 0.97, y: 1.03, scale: 1.02 },
];

const scene = (
  locationId: string,
  habitatAtlas: HabitatAtlas,
  midground: HabitatProp[],
  foreground: HabitatProp[],
): SceneArt => ({
  locationId,
  background: `assets/scenes/${locationId}.png`,
  habitatAtlas,
  midground,
  foreground,
});

export const sceneArt: SceneArt[] = [
  scene('matsu', 'wetland', wetlandMid, wetlandFront),
  scene('cook', 'wetland', wetlandMid, wetlandFront),
  scene('copper', 'wetland', wetlandMid, wetlandFront),
  scene('yk', 'wetland', wetlandMid, wetlandFront),
  scene('interior', 'forest', forestMid, forestFront),
  scene('arctic', 'arctic', arcticMid, arcticFront),
  scene('aleutian', 'forest', forestMid, forestFront),
  scene('southeast', 'forest', forestMid, forestFront),
  scene('tundra', 'wetland', wetlandMid, wetlandFront),
  scene('alpine', 'forest', forestMid, forestFront),
  scene('willow', 'arctic', arcticMid, arcticFront),
  scene('river', 'wetland', wetlandMid, wetlandFront),
];

export const sceneArtByLocation = new Map(sceneArt.map((entry) => [entry.locationId, entry]));

export const habitatAtlasPaths: Record<HabitatAtlas, string> = {
  wetland: 'assets/habitat/wetland.png',
  forest: 'assets/habitat/forest.png',
  arctic: 'assets/habitat/arctic.png',
};

export const retrieverSheet = {
  key: 'alaska-field-retriever',
  path: 'assets/characters/retriever.png',
  frameWidth: 128,
  frameHeight: 128,
} as const;
