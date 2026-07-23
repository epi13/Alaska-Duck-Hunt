import type { BirdFamily } from '../birds/bird-placement';
import type { BirdSurface } from '../birds/bird-plan';
import type { AudioCueId } from './audio-cues';

export type AudioRouteEvent =
  | { readonly type: 'weapon-fired' }
  | { readonly type: 'weapon-empty' }
  | { readonly type: 'weapon-reloaded' }
  | { readonly type: 'score-result'; readonly result: 'hit' | 'miss' | 'protected' }
  | { readonly type: 'bird-call'; readonly speciesId: string; readonly family: BirdFamily }
  | { readonly type: 'bird-flush'; readonly speciesId: string; readonly family: BirdFamily; readonly surface: BirdSurface }
  | { readonly type: 'bird-takeoff'; readonly family: BirdFamily; readonly surface: BirdSurface }
  | { readonly type: 'bird-land'; readonly surface: BirdSurface }
  | { readonly type: 'dog-vocalization'; readonly vocalization: 'sniff' | 'bark' | 'pant' | 'movement' | 'celebrate' }
  | { readonly type: 'environment-one-shot'; readonly sound: 'rain' | 'water' | 'vegetation' };

export function audioCuesForEvent(event: AudioRouteEvent): readonly AudioCueId[] {
  switch (event.type) {
    case 'weapon-fired': return ['weapon-shot'];
    case 'weapon-empty': return ['weapon-empty'];
    case 'weapon-reloaded': return ['weapon-reload', 'ui-mechanical'];
    case 'score-result': return [event.result === 'protected' ? 'feedback-protected' : event.result === 'hit' ? 'feedback-hit' : 'feedback-miss'];
    case 'bird-call': return [birdCallCue(event.speciesId, event.family)];
    case 'bird-flush': {
      const movement: AudioCueId[] = [wingCue(event.family), isWater(event.surface) ? 'water-takeoff' : 'vegetation-rustle'];
      if (event.speciesId === 'grouse') movement.push('call-grouse');
      if (event.speciesId === 'ptarmigan') movement.push('call-ptarmigan');
      return movement;
    }
    case 'bird-takeoff': return [wingCue(event.family), isWater(event.surface) ? 'water-takeoff' : 'ground-flush'];
    case 'bird-land': return [isWater(event.surface) ? 'water-land' : 'ground-land'];
    case 'dog-vocalization': return [`dog-${event.vocalization}`];
    case 'environment-one-shot': return [event.sound === 'water' ? 'water-land' : event.sound === 'vegetation' ? 'vegetation-rustle' : 'rain-detail'];
  }
}

function birdCallCue(speciesId: string, family: BirdFamily): AudioCueId {
  if (speciesId === 'crane') return 'call-crane';
  if (speciesId === 'grouse') return 'call-grouse';
  if (speciesId === 'ptarmigan') return 'call-ptarmigan';
  if (family === 'goose') return 'call-goose-group';
  if (family === 'diver') return 'call-duck-diver';
  if (family === 'seaDuck') return 'call-sea-duck';
  return 'call-duck-dabbler';
}

function wingCue(family: BirdFamily): AudioCueId {
  if (family === 'goose' || family === 'crane') return 'wing-large';
  if (family === 'upland' || family === 'dabbler') return 'wing-medium';
  return 'wing-small';
}

function isWater(surface: BirdSurface) {
  return ['openWater', 'shallowWater', 'riverEdge'].includes(surface);
}
