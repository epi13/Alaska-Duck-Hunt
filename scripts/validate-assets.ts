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

for (const path of ['public/assets/icon.svg', 'docs/images/gameplay-concept.png']) {
  await access(path);
}

for (const id of birdIds) {
  const path = `public/assets/birds/${id}.png`;
  const png = await readFile(path);
  const signature = png.subarray(1, 4).toString('ascii');
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (signature !== 'PNG' || width !== 512 || height !== 512) {
    throw new Error(`${path} must be a 512x512 PNG sprite sheet.`);
  }
}

console.log(`Required original assets are present, including ${birdIds.length} bird sheets.`);
