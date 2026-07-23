import { access, copyFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const sourceScene = 'public/assets/scenes/copper.png';
const masterDirectory = 'assets/generated/ui/start-screen/masters';
const master = `${masterDirectory}/copper-river-master.png`;
const outputDirectory = 'public/assets/ui';
const output = `${outputDirectory}/start-copper-river.webp`;

await mkdir(masterDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });
await access(sourceScene);
await copyFile(sourceScene, master);

const result = spawnSync('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  master,
  '-c:v',
  'libwebp',
  '-quality',
  '88',
  '-preset',
  'picture',
  '-an',
  output,
]);
if (result.status !== 0)
  throw new Error(`Unable to generate start-screen background: ${result.stderr.toString()}`);
