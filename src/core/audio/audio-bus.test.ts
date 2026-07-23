import { describe, expect, it } from 'vitest';
import { AUDIO_BUSES, AudioBusState } from './audio-bus';

describe('audio bus settings', () => {
  it('supports independent gains and mute', () => {
    const state = new AudioBusState();
    state.setGain('master', .8);
    state.setGain('birds', .25);
    state.setGain('dog', .7);
    expect(state.effectiveGain('birds')).toBeCloseTo(.2);
    expect(state.effectiveGain('dog')).toBeCloseTo(.56);
    state.setMuted('birds', true);
    expect(state.effectiveGain('birds')).toBe(0);
    expect(state.effectiveGain('dog')).toBeCloseTo(.56);
  });

  it('clamps settings and master mute silences every bus', () => {
    const state = new AudioBusState();
    state.setGain('music', 5);
    state.setGain('ambience', -1);
    expect(state.snapshot().gains.music).toBe(1);
    expect(state.snapshot().gains.ambience).toBe(0);
    state.setMuted('master', true);
    for (const bus of AUDIO_BUSES) expect(state.effectiveGain(bus)).toBe(0);
  });
});
