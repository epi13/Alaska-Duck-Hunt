import type { AudioBus } from '../core/audio/audio-bus';
import type { AudioCueId } from '../core/audio/audio-cues';
export type { AudioCueId } from '../core/audio/audio-cues';

export interface AudioAssetDefinition {
  readonly id: AudioCueId;
  readonly path: string;
  readonly masterPath: string;
  readonly bus: AudioBus;
  readonly loop: boolean;
  readonly baseGain: number;
  readonly maxVoices: number;
  readonly spatial: boolean;
}

const effect = (id: AudioCueId, bus: AudioBus, baseGain: number, maxVoices: number, spatial = false): AudioAssetDefinition => ({
  id,
  path: `assets/audio/${id}.ogg`,
  masterPath: `assets/generated/audio/masters/${id}.wav`,
  bus,
  loop: false,
  baseGain,
  maxVoices,
  spatial,
});

const loop = (id: AudioCueId, bus: AudioBus, baseGain: number): AudioAssetDefinition => ({
  id,
  path: `assets/audio/${id}.ogg`,
  masterPath: `assets/generated/audio/masters/${id}.wav`,
  bus,
  loop: true,
  baseGain,
  maxVoices: 1,
  spatial: false,
});

export const audioAssets: readonly AudioAssetDefinition[] = [
  effect('ui-nav', 'UI', .42, 3), effect('ui-mechanical', 'UI', .48, 2),
  effect('weapon-shot', 'effects', .9, 2), effect('weapon-reload', 'effects', .72, 2), effect('weapon-empty', 'effects', .62, 2),
  effect('feedback-hit', 'effects', .48, 2), effect('feedback-miss', 'effects', .3, 2), effect('feedback-protected', 'UI', .72, 1),
  effect('wing-small', 'birds', .38, 5, true), effect('wing-medium', 'birds', .46, 5, true), effect('wing-large', 'birds', .54, 5, true),
  effect('water-takeoff', 'effects', .5, 4, true), effect('water-land', 'effects', .42, 4, true),
  effect('ground-flush', 'effects', .45, 4, true), effect('ground-land', 'effects', .3, 4, true), effect('vegetation-rustle', 'ambience', .4, 4, true),
  effect('rain-detail', 'ambience', .32, 3, true),
  effect('call-duck-dabbler', 'birds', .4, 2, true), effect('call-duck-diver', 'birds', .35, 2, true),
  effect('call-sea-duck', 'birds', .38, 2, true), effect('call-goose-group', 'birds', .48, 2, true),
  effect('call-crane', 'birds', .5, 1, true), effect('call-grouse', 'birds', .38, 2, true), effect('call-ptarmigan', 'birds', .36, 2, true),
  effect('dog-sniff', 'dog', .34, 2, true), effect('dog-bark', 'dog', .55, 2, true), effect('dog-pant', 'dog', .3, 1, true),
  effect('dog-movement', 'dog', .28, 2, true), effect('dog-celebrate', 'dog', .48, 1, true),
  loop('ambience-wind', 'ambience', .24), loop('ambience-rain', 'ambience', .25), loop('ambience-surf', 'ambience', .3),
  loop('ambience-river', 'ambience', .28), loop('ambience-tundra', 'ambience', .2), loop('ambience-forest', 'ambience', .2),
  loop('ambience-marsh', 'ambience', .22), loop('ambience-snow', 'ambience', .18),
  loop('music-menu', 'music', .3), loop('music-briefing', 'music', .28), loop('music-hunt', 'music', .27),
  loop('music-final', 'music', .34), loop('music-results', 'music', .32),
] as const;

export const audioAssetById = new Map(audioAssets.map((asset) => [asset.id, asset]));

export const locationAmbience: Readonly<Record<string, readonly AudioCueId[]>> = {
  matsu: ['ambience-marsh', 'ambience-wind'],
  cook: ['ambience-surf', 'ambience-wind'],
  copper: ['ambience-river', 'ambience-marsh'],
  yk: ['ambience-tundra', 'ambience-wind'],
  interior: ['ambience-forest', 'ambience-wind'],
  arctic: ['ambience-snow', 'ambience-wind'],
  aleutian: ['ambience-surf', 'ambience-rain'],
  southeast: ['ambience-forest', 'ambience-rain'],
  tundra: ['ambience-tundra', 'ambience-wind'],
  alpine: ['ambience-wind', 'ambience-snow'],
  willow: ['ambience-snow', 'ambience-forest'],
  river: ['ambience-river', 'ambience-forest'],
};
