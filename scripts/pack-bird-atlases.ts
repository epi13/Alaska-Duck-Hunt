import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Family = 'dabbler' | 'diver' | 'goose' | 'upland' | 'crane';
type Sheet = { name: string; source?: string; deriveFrom?: string; modulate?: string };
type SpeciesPack = { id: string; family: Family; size?: number; sheets: [Sheet, Sheet] };

const keyedRoot = 'assets/generated/bird-atlases/keyed';
const outputRoot = 'public/assets/birds';
const workRoot = 'assets/generated/bird-atlases/processed';
const chromaTool = '/home/epi13/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py';

const packs: SpeciesPack[] = [
  { id: 'mallard', family: 'dabbler', sheets: [{ name: 'drake', source: 'mallard-drake.png' }, { name: 'hen', source: 'mallard-hen.png' }] },
  { id: 'pintail', family: 'dabbler', sheets: [{ name: 'drake', source: 'pintail-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '82,78,92' }] },
  { id: 'wigeon', family: 'dabbler', sheets: [{ name: 'drake', source: 'wigeon-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '83,70,95' }] },
  { id: 'teal', family: 'dabbler', sheets: [{ name: 'drake', source: 'teal-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '78,62,96' }] },
  { id: 'scaup', family: 'diver', sheets: [{ name: 'drake', source: 'scaup-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '72,58,90' }] },
  { id: 'eider', family: 'diver', sheets: [{ name: 'drake', source: 'eider-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '68,50,88' }] },
  { id: 'harlequin', family: 'diver', sheets: [{ name: 'drake', source: 'harlequin-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '72,48,92' }] },
  { id: 'goldeneye', family: 'diver', sheets: [{ name: 'drake', source: 'goldeneye-drake.png' }, { name: 'hen', source: 'goldeneye-hen.png' }] },
  { id: 'goose', family: 'goose', sheets: [{ name: 'adult', source: 'goose-adult.png' }, { name: 'juvenile', deriveFrom: 'adult', modulate: '88,68,94' }] },
  { id: 'canada-goose', family: 'goose', sheets: [{ name: 'adult', source: 'canada-goose-adult.png' }, { name: 'small-adult', deriveFrom: 'adult', modulate: '88,78,97' }] },
  { id: 'snow-goose', family: 'goose', sheets: [{ name: 'white', source: 'snow-goose-white.png' }, { name: 'blue', source: 'snow-goose-blue.png' }] },
  { id: 'brant', family: 'goose', sheets: [{ name: 'adult', source: 'brant-adult.png' }, { name: 'small-adult', deriveFrom: 'adult', modulate: '82,72,94' }] },
  { id: 'crane', family: 'crane', size: 768, sheets: [{ name: 'gray-adult', source: 'crane-gray-adult.png' }, { name: 'rust-stained', source: 'crane-rust-stained.png' }] },
  { id: 'grouse', family: 'upland', sheets: [{ name: 'male', source: 'grouse-male.png' }, { name: 'female', deriveFrom: 'male', modulate: '84,64,94' }] },
  { id: 'ptarmigan', family: 'upland', sheets: [{ name: 'summer', source: 'ptarmigan-summer.png' }, { name: 'winter', source: 'ptarmigan-winter.png' }] },
  { id: 'spectacled', family: 'diver', sheets: [{ name: 'drake', source: 'spectacled-drake.png' }, { name: 'hen', deriveFrom: 'drake', modulate: '72,46,90' }] },
];

const poses: Record<Family, string[]> = {
  dabbler: ['concealed', 'resting', 'foraging', 'alert', 'preTakeoff', 'walking', 'takeoff', 'landing', 'climbing', 'flying-up', 'flying', 'flying-down', 'banking', 'descending', 'hit', 'falling'],
  diver: ['resting', 'swimming', 'preDive', 'diving', 'surfacing', 'alert', 'preTakeoff', 'takeoff', 'climbing', 'flying-up', 'flying', 'flying-down', 'banking', 'landing', 'hit', 'falling'],
  goose: ['resting', 'foraging', 'sentry', 'alert', 'walking', 'alert-call', 'preTakeoff', 'run', 'takeoff', 'flying-up', 'flying', 'flying-down', 'banking', 'landing', 'hit', 'falling'],
  upland: ['concealed', 'resting', 'walking', 'foraging', 'alert', 'preTakeoff', 'hop', 'takeoff', 'flying-up', 'flying', 'flying-down', 'glide', 'descending', 'landing', 'hit', 'falling'],
  crane: ['concealed', 'foraging', 'revealing', 'standingBonus', 'standing', 'alert', 'preTakeoff', 'run', 'takeoff', 'flying-up', 'flying', 'flying-down', 'landing', 'display', 'hit', 'falling'],
};

function run(command: string, args: string[]) {
  execFileSync(command, args, { stdio: 'inherit' });
}

mkdirSync(outputRoot, { recursive: true });
mkdirSync(workRoot, { recursive: true });

for (const pack of packs) {
  const sheetSize = pack.size ?? 512;
  const frameSize = sheetSize / 4;
  const processed = new Map<string, string>();
  for (const sheet of pack.sheets) {
    const destination = path.join(workRoot, `${pack.id}-${sheet.name}.png`);
    if (sheet.source) {
      const source = path.join(keyedRoot, sheet.source);
      const resized = path.join(workRoot, `${pack.id}-${sheet.name}-keyed.png`);
      const normalizeBackground = ['spectacled-drake.png', 'ptarmigan-summer.png', 'snow-goose-blue.png', 'grouse-male.png'].includes(sheet.source);
      if (normalizeBackground) {
        const fuzz = sheet.source === 'grouse-male.png' ? '20%' : '8%';
        run('magick', [source, '-resize', `${sheetSize}x${sheetSize}!`, '-alpha', 'off', '-fuzz', fuzz, '-fill', '#FF00FF', '-draw', 'color 0,0 floodfill', '-draw', `color ${sheetSize - 1},0 floodfill`, '-draw', `color 0,${sheetSize - 1} floodfill`, '-draw', `color ${sheetSize - 1},${sheetSize - 1} floodfill`, resized]);
      } else {
        run('magick', [source, '-resize', `${sheetSize}x${sheetSize}!`, resized]);
      }
      run('python', [chromaTool, '--input', resized, '--out', destination, '--key-color', '#FF00FF', '--soft-matte', '--transparent-threshold', '18', '--opaque-threshold', '86', '--edge-contract', '1', '--spill-cleanup', '--force']);
    } else {
      const base = processed.get(sheet.deriveFrom!);
      if (!base) throw new Error(`Cannot derive ${pack.id}/${sheet.name}.`);
      run('magick', [base, '-modulate', sheet.modulate!, destination]);
    }
    processed.set(sheet.name, destination);
  }

  const destinationDir = path.join(outputRoot, pack.id);
  mkdirSync(destinationDir, { recursive: true });
  const atlasPng = path.join(destinationDir, 'atlas.png');
  run('magick', [processed.get(pack.sheets[0].name)!, processed.get(pack.sheets[1].name)!, '+append', atlasPng]);

  const frames: Record<string, object> = {};
  pack.sheets.forEach((sheet, sheetIndex) => {
    poses[pack.family].forEach((pose, index) => {
      const x = sheetIndex * sheetSize + (index % 4) * frameSize;
      const y = Math.floor(index / 4) * frameSize;
      frames[`${sheet.name}/${pose}/0`] = {
        frame: { x, y, w: frameSize, h: frameSize },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameSize, h: frameSize },
        sourceSize: { w: frameSize, h: frameSize },
      };
    });
  });
  writeFileSync(path.join(destinationDir, 'atlas.json'), JSON.stringify({ frames, meta: { app: 'Alaska Duck Hunt original atlas packer', version: '2', image: 'atlas.png', format: 'RGBA8888', size: { w: sheetSize * 2, h: sheetSize }, scale: '1', speciesId: pack.id, family: pack.family, variants: pack.sheets.map((sheet) => sheet.name) } }, null, 2) + '\n');

  const previewFrames = pack.family === 'crane' ? [2, 3, 8, 10] : [5, 7, 9, 11];
  const crops = previewFrames.map((index, cropIndex) => {
    const crop = path.join(workRoot, `${pack.id}-preview-${cropIndex}.png`);
    run('magick', [processed.get(pack.sheets[0].name)!, '-crop', `${frameSize}x${frameSize}+${(index % 4) * frameSize}+${Math.floor(index / 4) * frameSize}`, '+repage', crop]);
    return crop;
  });
  run('magick', [...crops, '+append', path.join(destinationDir, 'preview.png')]);
}

console.log(`Packed ${packs.length} species atlases with named frames and previews.`);
