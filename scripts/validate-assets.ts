import { access, readFile } from 'node:fs/promises';

const birdIds = [
  'brant',
  'canada-goose',
  'crane',
  'goldeneye',
  'grouse',
  'harlequin',
  'mallard',
  'pintail',
  'ptarmigan',
  'snow-goose',
];
const locationIds = [
  'matsu',
  'cook',
  'copper',
  'yk',
  'interior',
  'arctic',
  'aleutian',
  'southeast',
  'tundra',
  'alpine',
  'willow',
  'river',
];

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

for (const path of ['public/assets/icon.svg', 'docs/images/gameplay-concept.png']) {
  await access(path);
}

for (const id of birdIds) {
  const path = `public/assets/birds/${id}.png`;
  const png = await readFile(path);
  const signature = png.subarray(1, 4).toString('ascii');
  const { width, height } = pngSize(png);
  if (signature !== 'PNG' || width !== 512 || height !== 512) {
    throw new Error(`${path} must be a 512x512 PNG sprite sheet.`);
  }
}

for (const id of locationIds) {
  const path = `public/assets/scenes/${id}.png`;
  const { width, height } = pngSize(await readFile(path));
  if (width !== 1280 || height !== 720) {
    throw new Error(`${path} must be a 1280x720 PNG scene plate.`);
  }
}

for (const [path, width, height] of [
  ['public/assets/characters/retriever.png', 512, 512],
  ['public/assets/habitat/wetland.png', 1024, 512],
  ['public/assets/habitat/forest.png', 1024, 512],
  ['public/assets/habitat/arctic.png', 1024, 512],
] as const) {
  const actual = pngSize(await readFile(path));
  if (actual.width !== width || actual.height !== height) {
    throw new Error(`${path} must be ${width}x${height}.`);
  }
}

console.log(
  `Required original assets are present: ${birdIds.length} bird sheets, ${locationIds.length} scene plates, one dog sheet, and three habitat atlases.`,
);
