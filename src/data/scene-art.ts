export type HabitatAtlas =
  | 'southcentral-wetland'
  | 'coastal-delta'
  | 'western-tundra'
  | 'boreal-interior'
  | 'southeast-rainforest'
  | 'arctic-alpine'
  | 'aleutian-coast'
  | 'winter-willow';

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
  waterline: HabitatProp[];
  foreground: HabitatProp[];
}

const p = (frame: number, x: number, y: number, scale: number, flip = false): HabitatProp =>
  ({ frame, x, y, scale, ...(flip ? { flip } : {}) });

const scene = (
  locationId: string,
  habitatAtlas: HabitatAtlas,
  midground: HabitatProp[],
  waterline: HabitatProp[],
  foreground: HabitatProp[],
): SceneArt => ({
  locationId,
  background: `assets/scenes/${locationId}.png`,
  habitatAtlas,
  midground,
  waterline,
  foreground,
});

export const sceneArt: SceneArt[] = [
  scene('matsu', 'southcentral-wetland',
    [p(5, .12, .79, .62), p(3, .31, .84, .48), p(6, .84, .8, .53, true), p(2, .94, .84, .46)],
    [p(13, .59, .805, .88), p(12, .75, .79, .72, true)],
    [p(8, .03, 1.02, .92), p(9, .32, 1.03, .86), p(10, .72, 1.02, .76), p(11, .97, 1.02, .9, true)]),
  scene('cook', 'coastal-delta',
    [p(0, .07, .82, .64), p(4, .35, .8, .53), p(7, .78, .79, .5), p(3, .94, .83, .56)],
    [p(12, .18, .76, 1.02), p(15, .43, .79, 1.05), p(13, .68, .8, .92)],
    [p(8, .02, 1.02, .88), p(9, .31, 1.02, .82), p(10, .69, 1.02, .83), p(11, .98, 1.02, .9, true)]),
  scene('copper', 'coastal-delta',
    [p(1, .08, .79, .6), p(6, .28, .82, .48), p(4, .79, .8, .52), p(7, .94, .83, .48)],
    [p(15, .16, .75, .94), p(12, .4, .73, .96), p(13, .65, .77, .94), p(14, .87, .79, .86)],
    [p(8, .02, 1.03, .88), p(9, .34, 1.02, .82), p(10, .7, 1.02, .8), p(11, .98, 1.02, .88)]),
  scene('yk', 'western-tundra',
    [p(0, .08, .81, .56), p(1, .31, .78, .5), p(3, .66, .81, .54), p(4, .91, .8, .48)],
    [p(12, .15, .76, .92), p(13, .39, .78, .98), p(15, .64, .76, .96), p(14, .87, .79, .88)],
    [p(6, .04, 1.02, .86), p(7, .32, 1.02, .82), p(8, .67, 1.02, .8), p(11, .97, 1.02, .9, true)]),
  scene('interior', 'boreal-interior',
    [p(0, .08, .78, .69), p(2, .3, .82, .55), p(5, .74, .8, .52), p(1, .93, .8, .64)],
    [p(13, .62, .79, .92), p(15, .84, .78, .94)],
    [p(8, .02, 1.02, .86), p(10, .34, 1.03, .92), p(11, .69, 1.02, .85), p(9, .98, 1.02, .78, true)]),
  scene('arctic', 'arctic-alpine',
    [p(0, .08, .82, .52), p(1, .33, .83, .48), p(3, .7, .81, .44), p(6, .93, .82, .48)],
    [p(12, .63, .75, .86), p(13, .83, .77, .88)],
    [p(8, .03, 1.02, .86), p(9, .32, 1.02, .8), p(10, .69, 1.02, .86), p(11, .98, 1.02, .88)]),
  scene('aleutian', 'aleutian-coast',
    [p(0, .08, .8, .57), p(4, .32, .82, .5), p(6, .72, .81, .48), p(7, .92, .79, .54)],
    [p(12, .14, .72, .92), p(13, .38, .75, .9), p(14, .63, .8, .86)],
    [p(8, .03, 1.03, .91), p(9, .33, 1.02, .82), p(10, .68, 1.03, .84), p(11, .97, 1.02, .85)]),
  scene('southeast', 'southeast-rainforest',
    [p(0, .08, .77, .7), p(4, .29, .81, .55), p(6, .76, .8, .52), p(1, .94, .78, .66)],
    [p(13, .44, .79, .87), p(15, .66, .77, .9)],
    [p(8, .02, 1.03, .94), p(9, .31, 1.02, .86), p(10, .7, 1.03, .88), p(11, .98, 1.02, .92)]),
  scene('tundra', 'western-tundra',
    [p(0, .08, .82, .54), p(2, .31, .8, .5), p(3, .68, .81, .48), p(5, .92, .82, .48)],
    [p(12, .14, .78, .9), p(13, .39, .77, .94), p(15, .64, .79, .92), p(14, .86, .78, .84)],
    [p(6, .03, 1.02, .86), p(7, .34, 1.02, .8), p(8, .69, 1.02, .82), p(10, .98, 1.02, .86)]),
  scene('alpine', 'arctic-alpine',
    [p(3, .08, .82, .46), p(6, .31, .83, .48), p(4, .68, .82, .44), p(7, .91, .81, .5)],
    [],
    [p(8, .03, 1.02, .9), p(9, .34, 1.02, .84), p(10, .7, 1.02, .88), p(11, .98, 1.02, .9)]),
  scene('willow', 'winter-willow',
    [p(1, .08, .8, .52), p(5, .3, .81, .5), p(2, .7, .8, .48), p(7, .92, .82, .48)],
    [],
    [p(8, .03, 1.02, .9), p(9, .32, 1.02, .84), p(10, .69, 1.02, .88), p(11, .98, 1.02, .92)]),
  scene('river', 'boreal-interior',
    [p(4, .07, .8, .54), p(5, .31, .81, .5), p(6, .72, .8, .48), p(2, .94, .8, .52)],
    [p(12, .36, .78, .9), p(13, .58, .79, .94), p(15, .79, .78, .88)],
    [p(8, .02, 1.02, .86), p(10, .33, 1.02, .88), p(11, .7, 1.02, .84), p(9, .98, 1.02, .8)]),
];

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
