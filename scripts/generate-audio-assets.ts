import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { audioAssets } from '../src/data/audio-assets';

const sampleRate = 32_000;
const masterDirectory = 'assets/generated/audio/masters';
const outputDirectory = 'public/assets/audio';
await mkdir(masterDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });

const manifest: Array<Record<string, string | number | boolean>> = [];
for (const asset of audioAssets) {
  const duration = durationFor(asset.id);
  const samples = synthesize(asset.id, duration);
  const wav = encodeWav(samples, sampleRate);
  const masterPath = `${masterDirectory}/${asset.id}.wav`;
  const outputPath = `${outputDirectory}/${asset.id}.ogg`;
  await writeFile(masterPath, wav);
  const encoded = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', masterPath,
    '-c:a', 'libvorbis', '-q:a', asset.loop ? '3' : '4', outputPath,
  ]);
  if (encoded.status !== 0) throw new Error(`ffmpeg failed for ${asset.id}: ${encoded.stderr.toString()}`);
  const processed = await readFile(outputPath);
  manifest.push({
    id: asset.id,
    masterPath,
    processedPath: outputPath,
    masterSha256: createHash('sha256').update(wav).digest('hex'),
    processedSha256: createHash('sha256').update(processed).digest('hex'),
    sampleRate,
    durationSeconds: duration,
    originalProceduralSynthesis: true,
    externalRecordingUsed: false,
    license: 'MIT (original project asset)',
  });
}
await writeFile('assets/generated/audio/manifest.json', `${JSON.stringify({ generatedAt: '2026-07-22', assets: manifest }, null, 2)}\n`);

function durationFor(id: string) {
  if (id.startsWith('music-')) return 8;
  if (id.startsWith('ambience-')) return 6;
  if (id.startsWith('call-')) return id === 'call-crane' ? 1.8 : 1.25;
  if (id === 'weapon-shot') return 1;
  if (id.startsWith('dog-')) return .75;
  if (id.startsWith('wing-') || id.includes('takeoff') || id.includes('rustle')) return .8;
  return .45;
}

function synthesize(id: string, duration: number) {
  const count = Math.round(duration * sampleRate);
  const output = new Float32Array(count);
  let randomState = hash(id);
  const random = () => {
    randomState = (randomState * 1_664_525 + 1_013_904_223) >>> 0;
    return randomState / 0xffff_ffff * 2 - 1;
  };
  let smoothNoise = 0;
  const noise = (smoothing = .75) => {
    smoothNoise = smoothNoise * smoothing + random() * (1 - smoothing);
    return smoothNoise;
  };
  const add = (index: number, value: number) => {
    output[index] = Math.max(-.98, Math.min(.98, output[index]! + value));
  };
  for (let index = 0; index < count; index += 1) {
    const t = index / sampleRate;
    const progress = t / duration;
    const fade = Math.min(1, t / .025, (duration - t) / .06);
    let value = 0;
    if (id.startsWith('ambience-')) {
      const profile = id.slice(9);
      const movement = Math.sin(Math.PI * 2 * t / duration) * .08;
      const base = profile === 'rain' ? noise(.12) : profile === 'surf' ? noise(.9) : noise(.97);
      const water = ['surf', 'river', 'marsh'].includes(profile) ? Math.sin(Math.PI * 2 * (1.2 + movement) * t) * .16 : 0;
      const canopy = profile === 'forest' ? Math.sin(Math.PI * 2 * 5.3 * t) * .035 : 0;
      value = (base * (profile === 'rain' ? .5 : .8) + water + canopy) * .42;
    } else if (id.startsWith('music-')) {
      const section = id.slice(6);
      const bpm = section === 'final' ? 132 : section === 'hunt' ? 108 : section === 'results' ? 88 : 92;
      const beat = t * bpm / 60;
      const sequences: Record<string, number[]> = {
        menu: [45, 52, 57, 52, 48, 55, 60, 55],
        briefing: [43, 50, 55, 50, 46, 53, 58, 53],
        hunt: [45, 52, 55, 57, 48, 55, 57, 60],
        final: [45, 52, 57, 60, 48, 55, 60, 64],
        results: [48, 55, 60, 64, 50, 57, 62, 65],
      };
      const notes = sequences[section] ?? sequences.menu!;
      const note = notes[Math.floor(beat * 2) % notes.length]!;
      const frequency = 440 * 2 ** ((note - 69) / 12);
      const local = (beat * 2) % 1;
      const noteEnvelope = Math.exp(-local * 3.2);
      const pulse = Math.sin(Math.PI * 2 * frequency * t) + .32 * Math.sin(Math.PI * 4 * frequency * t);
      const bassNote = notes[Math.floor(beat / 2) % notes.length]! - 12;
      const bass = Math.sin(Math.PI * 2 * 440 * 2 ** ((bassNote - 69) / 12) * t);
      const percussion = Math.exp(-((beat % 1) * 9)) * noise(.2);
      value = (pulse * noteEnvelope * .22 + bass * .13 + percussion * .08) * fade;
    } else if (id.startsWith('call-')) {
      const calls: Record<string, readonly [number, number, number]> = {
        'call-duck-dabbler': [330, 210, 4],
        'call-duck-diver': [520, 390, 3],
        'call-sea-duck': [620, 460, 2],
        'call-goose-group': [390, 260, 3],
        'call-crane': [920, 650, 2],
        'call-grouse': [180, 115, 7],
        'call-ptarmigan': [260, 170, 6],
      };
      const [start, end, pulses] = calls[id] ?? calls['call-duck-dabbler']!;
      const phase = Math.PI * 2 * (start * t + (end - start) * t * progress * .5);
      const pulse = Math.max(0, Math.sin(Math.PI * pulses * progress));
      value = (Math.sin(phase) * .48 + Math.sin(phase * 2.03) * .18 + noise(.4) * .12) * pulse * fade;
    } else {
      const envelope = Math.exp(-progress * (id === 'weapon-shot' ? 7 : 3.5)) * fade;
      if (id === 'weapon-shot') value = (noise(.08) * .75 + Math.sin(Math.PI * 2 * (92 - 45 * progress) * t) * .5) * envelope;
      else if (id === 'weapon-reload' || id === 'ui-mechanical') {
        const click = Math.exp(-Math.abs(t - .08) * 80) + .8 * Math.exp(-Math.abs(t - .28) * 90);
        value = (noise(.15) * .5 + Math.sin(Math.PI * 2 * 1_200 * t) * .2) * click;
      } else if (id === 'weapon-empty' || id === 'ui-nav') value = (Math.sin(Math.PI * 2 * 720 * t) + noise(.2) * .15) * envelope * .45;
      else if (id.startsWith('wing-') || id.includes('flush') || id.includes('rustle')) {
        const speed = id === 'wing-large' ? 4 : id === 'wing-small' ? 8 : 6;
        value = noise(.72) * Math.max(0, Math.sin(Math.PI * 2 * speed * t)) * envelope * .85;
      } else if (id.includes('water') || id.includes('land')) value = (noise(.84) + Math.sin(Math.PI * 2 * 95 * t) * .15) * envelope * .65;
      else if (id === 'rain-detail') value = noise(.18) * envelope * .7;
      else if (id === 'dog-bark' || id === 'dog-celebrate') value = (Math.sin(Math.PI * 2 * (210 - 70 * progress) * t) + noise(.35) * .55) * envelope * .62;
      else if (id === 'dog-sniff' || id === 'dog-pant' || id === 'dog-movement') {
        const pulse = Math.max(0, Math.sin(Math.PI * 2 * (id === 'dog-movement' ? 5 : 3) * t));
        value = noise(.65) * pulse * envelope * .65;
      } else {
        const frequency = id === 'feedback-protected' ? 190 : id === 'feedback-hit' ? 660 : 310;
        value = (Math.sin(Math.PI * 2 * frequency * t) + .35 * Math.sin(Math.PI * 4 * frequency * t)) * envelope * .42;
      }
    }
    add(index, value * .72);
  }
  return output;
}

function encodeWav(samples: Float32Array, rate: number) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let index = 0; index < samples.length; index += 1) buffer.writeInt16LE(Math.round(samples[index]! * 32_767), 44 + index * 2);
  return buffer;
}

function hash(value: string) {
  let result = 2_166_136_261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16_777_619);
  return result >>> 0;
}
