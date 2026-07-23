export const AUDIO_BUSES = ['master', 'music', 'ambience', 'effects', 'birds', 'dog', 'UI'] as const;
export type AudioBus = (typeof AUDIO_BUSES)[number];

export interface AudioBusSnapshot {
  readonly gains: Readonly<Record<AudioBus, number>>;
  readonly muted: Readonly<Record<AudioBus, boolean>>;
}
const DEFAULT_GAINS: Record<AudioBus, number> = {
  master: 0.65,
  music: 0.55,
  ambience: 0.6,
  effects: 0.72,
  birds: 0.68,
  dog: 0.62,
  UI: 0.5,
};

const clampGain = (value: number) => Math.min(1, Math.max(0, value));

export class AudioBusState {
  private readonly gains = { ...DEFAULT_GAINS };
  private readonly muted = Object.fromEntries(AUDIO_BUSES.map((bus) => [bus, false])) as Record<AudioBus, boolean>;

  setGain(bus: AudioBus, value: number) {
    this.gains[bus] = clampGain(value);
  }

  setMuted(bus: AudioBus, muted: boolean) {
    this.muted[bus] = muted;
  }

  effectiveGain(bus: AudioBus): number {
    if (this.muted.master || this.muted[bus]) return 0;
    return this.gains.master * (bus === 'master' ? 1 : this.gains[bus]);
  }

  snapshot(): AudioBusSnapshot {
    return { gains: { ...this.gains }, muted: { ...this.muted } };
  }
}
