import { describe, expect, it } from 'vitest';
import { audioCuesForEvent } from './audio-events';

describe('semantic audio event routing', () => {
  it('separates weapon discharge from notices and score feedback', () => {
    expect(audioCuesForEvent({ type: 'weapon-fired' })).toEqual(['weapon-shot']);
    expect(audioCuesForEvent({ type: 'weapon-empty' })).toEqual(['weapon-empty']);
    expect(audioCuesForEvent({ type: 'score-result', result: 'miss' })).toEqual(['feedback-miss']);
    expect(audioCuesForEvent({ type: 'score-result', result: 'protected' })).toEqual(['feedback-protected']);
  });

  it('routes species groups to appropriate restrained call families', () => {
    expect(audioCuesForEvent({ type: 'bird-call', speciesId: 'snow-goose', family: 'goose' })).toEqual(['call-goose-group']);
    expect(audioCuesForEvent({ type: 'bird-call', speciesId: 'crane', family: 'crane' })).toEqual(['call-crane']);
    expect(audioCuesForEvent({ type: 'bird-call', speciesId: 'grouse', family: 'upland' })).toEqual(['call-grouse']);
    expect(audioCuesForEvent({ type: 'bird-call', speciesId: 'ptarmigan', family: 'upland' })).toEqual(['call-ptarmigan']);
    expect(audioCuesForEvent({ type: 'bird-call', speciesId: 'mallard', family: 'dabbler' })).toEqual(['call-duck-dabbler']);
  });

  it('adds surface and size-specific movement cues', () => {
    expect(audioCuesForEvent({ type: 'bird-takeoff', family: 'goose', surface: 'shallowWater' })).toEqual(['wing-large', 'water-takeoff']);
    expect(audioCuesForEvent({ type: 'bird-flush', speciesId: 'grouse', family: 'upland', surface: 'forestFloor' })).toEqual(['wing-medium', 'vegetation-rustle', 'call-grouse']);
    expect(audioCuesForEvent({ type: 'bird-flush', speciesId: 'ptarmigan', family: 'upland', surface: 'snowGround' })).toEqual(['wing-medium', 'vegetation-rustle', 'call-ptarmigan']);
    expect(audioCuesForEvent({ type: 'bird-land', surface: 'openWater' })).toEqual(['water-land']);
    expect(audioCuesForEvent({ type: 'dog-vocalization', vocalization: 'sniff' })).toEqual(['dog-sniff']);
    expect(audioCuesForEvent({ type: 'environment-one-shot', sound: 'rain' })).toEqual(['rain-detail']);
  });
});
