import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Family = 'dabbler' | 'diver' | 'goose' | 'upland' | 'crane';
type Sheet = { name: string; source?: string; deriveFrom?: string; modulate?: string };
type SpeciesPack = { id: string; family: Family; size?: number; sheets: [Sheet, Sheet] };
const individualTreatments = ['natural', 'alternate'] as const;

const keyedRoot = 'assets/generated/bird-atlases/keyed';
const outputRoot = 'public/assets/birds';
const workRoot = 'assets/generated/bird-atlases/processed';
const chromaTool = '/home/epi13/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py';

const packs: SpeciesPack[] = [
  { id: 'mallard', family: 'dabbler', sheets: [{ name: 'drake', source: 'mallard-drake.png' }, { name: 'hen', source: 'mallard-hen.png' }] },
  { id: 'pintail', family: 'dabbler', sheets: [{ name: 'drake', source: 'pintail-drake.png' }, { name: 'hen', source: 'pintail-hen.png' }] },
  { id: 'wigeon', family: 'dabbler', sheets: [{ name: 'drake', source: 'wigeon-drake.png' }, { name: 'hen', source: 'wigeon-hen.png' }] },
  { id: 'teal', family: 'dabbler', sheets: [{ name: 'drake', source: 'teal-drake.png' }, { name: 'hen', source: 'teal-hen.png' }] },
  { id: 'scaup', family: 'diver', sheets: [{ name: 'drake', source: 'scaup-drake.png' }, { name: 'hen', source: 'scaup-hen.png' }] },
  { id: 'eider', family: 'diver', sheets: [{ name: 'drake', source: 'eider-drake.png' }, { name: 'hen', source: 'eider-hen.png' }] },
  { id: 'harlequin', family: 'diver', sheets: [{ name: 'drake', source: 'harlequin-drake.png' }, { name: 'hen', source: 'harlequin-hen.png' }] },
  { id: 'goldeneye', family: 'diver', sheets: [{ name: 'drake', source: 'goldeneye-drake.png' }, { name: 'hen', source: 'goldeneye-hen.png' }] },
  { id: 'goose', family: 'goose', sheets: [{ name: 'adult', source: 'goose-adult.png' }, { name: 'juvenile', source: 'goose-juvenile.png' }] },
  { id: 'canada-goose', family: 'goose', sheets: [{ name: 'adult', source: 'canada-goose-adult.png' }, { name: 'juvenile', source: 'canada-goose-juvenile.png' }] },
  { id: 'snow-goose', family: 'goose', sheets: [{ name: 'white', source: 'snow-goose-white.png' }, { name: 'blue', source: 'snow-goose-blue.png' }] },
  { id: 'brant', family: 'goose', sheets: [{ name: 'adult', source: 'brant-adult.png' }, { name: 'juvenile', source: 'brant-juvenile.png' }] },
  { id: 'crane', family: 'crane', size: 768, sheets: [{ name: 'gray-adult', source: 'crane-gray-adult.png' }, { name: 'rust-stained', source: 'crane-rust-stained.png' }] },
  { id: 'grouse', family: 'upland', sheets: [{ name: 'male', source: 'grouse-male.png' }, { name: 'female', source: 'grouse-female.png' }] },
  { id: 'ptarmigan', family: 'upland', sheets: [{ name: 'summer', source: 'ptarmigan-summer.png' }, { name: 'winter', source: 'ptarmigan-winter.png' }] },
  { id: 'spectacled', family: 'diver', sheets: [{ name: 'drake', source: 'spectacled-drake.png' }, { name: 'hen', source: 'spectacled-hen.png' }] },
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
  const biologicalSheets = new Map<string, string>();
  const processed = new Map<string, string>();
  for (const sheet of pack.sheets) {
    const destination = path.join(workRoot, `${pack.id}-${sheet.name}-natural.png`);
    if (sheet.source) {
      const source = path.join(keyedRoot, sheet.source);
      const resized = path.join(workRoot, `${pack.id}-${sheet.name}-keyed.png`);
      const normalizeBackground = [
        'spectacled-drake.png',
        'ptarmigan-summer.png',
        'snow-goose-blue.png',
        'grouse-male.png',
        'pintail-hen.png',
        'wigeon-hen.png',
        'teal-hen.png',
        'scaup-hen.png',
        'eider-hen.png',
        'harlequin-hen.png',
        'grouse-female.png',
        'spectacled-hen.png',
        'goose-juvenile.png',
        'canada-goose-juvenile.png',
        'brant-juvenile.png',
      ].includes(sheet.source);
      if (normalizeBackground) {
        const fuzz = ['grouse-male.png', 'grouse-female.png'].includes(sheet.source) ? '20%' : sheet.source.endsWith('-hen.png') ? '14%' : '8%';
        run('magick', [source, '-resize', `${sheetSize}x${sheetSize}!`, '-alpha', 'off', '-fuzz', fuzz, '-fill', '#FF00FF', '-draw', 'color 0,0 floodfill', '-draw', `color ${sheetSize - 1},0 floodfill`, '-draw', `color 0,${sheetSize - 1} floodfill`, '-draw', `color ${sheetSize - 1},${sheetSize - 1} floodfill`, resized]);
      } else {
        run('magick', [source, '-resize', `${sheetSize}x${sheetSize}!`, resized]);
      }
      run('python', [chromaTool, '--input', resized, '--out', destination, '--key-color', '#FF00FF', '--soft-matte', '--transparent-threshold', '18', '--opaque-threshold', '86', '--edge-contract', '1', '--spill-cleanup', '--force']);
    } else {
      const base = biologicalSheets.get(sheet.deriveFrom!);
      if (!base) throw new Error(`Cannot derive ${pack.id}/${sheet.name}.`);
      run('magick', [base, '-modulate', sheet.modulate!, destination]);
    }
    biologicalSheets.set(sheet.name, destination);
    processed.set(`${sheet.name}/natural`, destination);
    const alternate = path.join(workRoot, `${pack.id}-${sheet.name}-alternate.png`);
    // A restrained brightness/saturation treatment preserves field marks and avoids false identification cues.
    run('magick', [destination, '-modulate', '98,104,100', alternate]);
    processed.set(`${sheet.name}/alternate`, alternate);
  }

  const destinationDir = path.join(outputRoot, pack.id);
  mkdirSync(destinationDir, { recursive: true });
  const atlasPng = path.join(destinationDir, 'atlas.png');
  const orderedSheets = pack.sheets.flatMap((sheet) =>
    individualTreatments.map((treatment) => processed.get(`${sheet.name}/${treatment}`)!));
  run('magick', [...orderedSheets, '+append', atlasPng]);

  const frames: Record<string, object> = {};
  pack.sheets.forEach((sheet, sheetIndex) => {
    individualTreatments.forEach((treatment, treatmentIndex) => {
      poses[pack.family].forEach((pose, index) => {
        const x = (sheetIndex * individualTreatments.length + treatmentIndex) * sheetSize + (index % 4) * frameSize;
        const y = Math.floor(index / 4) * frameSize;
        frames[`${sheet.name}/${treatment}/${pose}/0`] = {
          frame: { x, y, w: frameSize, h: frameSize },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: frameSize, h: frameSize },
          sourceSize: { w: frameSize, h: frameSize },
        };
      });
    });
  });
  writeFileSync(path.join(destinationDir, 'atlas.json'), JSON.stringify({ frames, meta: {
    app: 'Alaska Duck Hunt original atlas packer',
    version: '3',
    image: 'atlas.png',
    format: 'RGBA8888',
    size: { w: sheetSize * pack.sheets.length * individualTreatments.length, h: sheetSize },
    scale: '1',
    speciesId: pack.id,
    family: pack.family,
    biologicalVariants: pack.sheets.map((sheet) => sheet.name),
    individualVisualVariants: individualTreatments,
    assetBudget: {
      biologicalVariants: pack.sheets.length,
      individualTreatmentsPerVariant: individualTreatments.length,
      framesPerTreatment: poses[pack.family].length,
      totalFrames: pack.sheets.length * individualTreatments.length * poses[pack.family].length,
    },
  } }, null, 2) + '\n');

  const previewFrames = pack.family === 'crane' ? [2, 3, 8, 10] : [5, 7, 9, 11];
  const crops = previewFrames.map((index, cropIndex) => {
    const crop = path.join(workRoot, `${pack.id}-preview-${cropIndex}.png`);
    run('magick', [processed.get(`${pack.sheets[0].name}/natural`)!, '-crop', `${frameSize}x${frameSize}+${(index % 4) * frameSize}+${Math.floor(index / 4) * frameSize}`, '+repage', crop]);
    return crop;
  });
  run('magick', [...crops, '+append', path.join(destinationDir, 'preview.png')]);
}

console.log(`Packed ${packs.length} species atlases with ${individualTreatments.length} bounded individual treatments per biological variant.`);
