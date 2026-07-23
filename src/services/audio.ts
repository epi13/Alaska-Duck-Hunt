import { AudioBusState, AUDIO_BUSES, type AudioBus } from '../core/audio/audio-bus';
import type { AudioCueId } from '../core/audio/audio-cues';
import { audioCuesForEvent, type AudioRouteEvent } from '../core/audio/audio-events';
import { spatialAudio, type SpatialAudioInput, type SpatialAudioResult } from '../core/audio/spatial-audio';
import { audioAssetById, audioAssets, locationAmbience } from '../data/audio-assets';

interface ActiveVoice {
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
  readonly filter: BiquadFilterNode;
  readonly panner: StereoPannerNode;
  readonly baseGain: number;
  readonly spatial: boolean;
  readonly startedAt: number;
}

export interface AudioTelemetry {
  readonly cue: AudioCueId;
  readonly bus: AudioBus;
  readonly status: 'played' | 'loaded' | 'blocked' | 'stopped';
  readonly pan?: number;
  readonly gain?: number;
  readonly lowpassHz?: number;
  readonly voices?: number;
}

export class AudioManager {
  private context?: AudioContext;
  private masterNode?: GainNode;
  private readonly busNodes = new Map<AudioBus, GainNode>();
  private readonly buffers = new Map<AudioCueId, Promise<AudioBuffer>>();
  private readonly voices = new Map<AudioCueId, ActiveVoice[]>();
  private readonly loops = new Map<AudioCueId, ActiveVoice>();
  private readonly busState = new AudioBusState();
  private desiredMusic?: AudioCueId;
  private desiredAmbience = new Set<AudioCueId>();
  private dogPosition?: SpatialAudioInput;
  private unlocked = false;
  private sceneGeneration = 0;

  get muted() {
    return this.busState.snapshot().muted.master;
  }

  set muted(value: boolean) {
    this.setBusMuted('master', value);
  }

  get ready() {
    return this.unlocked && this.context?.state === 'running';
  }

  get settings() {
    return this.busState.snapshot();
  }

  async unlock() {
    if (!this.context) this.createGraph();
    if (this.context?.state === 'suspended') await this.context.resume();
    this.unlocked = this.context?.state === 'running';
    this.emitState();
    if (this.unlocked) {
      void this.preload(['ui-nav', 'weapon-shot', 'weapon-empty', 'weapon-reload']);
      if (this.desiredMusic && !this.loops.has(this.desiredMusic)) void this.play(this.desiredMusic, undefined, 700);
      for (const id of this.desiredAmbience) if (!this.loops.has(id)) void this.play(id, undefined, 900);
    }
  }

  async preload(ids: readonly AudioCueId[] = audioAssets.map(({ id }) => id)) {
    await Promise.allSettled(ids.map((id) => this.load(id)));
  }

  setBusGain(bus: AudioBus, gain: number) {
    this.busState.setGain(bus, gain);
    this.applyBus(bus);
    this.emitState();
  }

  setBusMuted(bus: AudioBus, muted: boolean) {
    this.busState.setMuted(bus, muted);
    this.applyBus(bus);
    this.emitState();
  }

  async play(id: AudioCueId, spatial?: SpatialAudioInput, fadeInMs = 12): Promise<void> {
    const definition = audioAssetById.get(id);
    const context = this.context;
    const generation = this.sceneGeneration;
    if (!definition || !context || !this.unlocked || context.state !== 'running') {
      if (definition) this.emit({ cue: id, bus: definition.bus, status: 'blocked' });
      return;
    }
    const buffer = await this.load(id).catch(() => undefined);
    if (!buffer || context.state !== 'running') return;
    if (generation !== this.sceneGeneration && definition.bus !== 'music' && definition.bus !== 'UI') return;
    if (definition.bus === 'music' && this.desiredMusic && this.desiredMusic !== id) return;
    if (definition.bus === 'ambience' && this.desiredAmbience.size && !this.desiredAmbience.has(id)) return;
    const active = (this.voices.get(id) ?? []).filter(({ source }) => Boolean(source));
    while (active.length >= definition.maxVoices) this.stopVoice(active.shift()!, 18);

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const panner = context.createStereoPanner();
    const gain = context.createGain();
    const resolved = definition.spatial && spatial ? spatialAudio(spatial) : undefined;
    source.buffer = buffer;
    source.loop = definition.loop;
    filter.type = 'lowpass';
    filter.frequency.value = resolved?.lowpassHz ?? 18_000;
    panner.pan.value = resolved?.pan ?? 0;
    const targetGain = definition.baseGain * (resolved?.gain ?? 1);
    gain.gain.setValueAtTime(fadeInMs > 0 ? 0.0001 : targetGain, context.currentTime);
    gain.gain.linearRampToValueAtTime(targetGain, context.currentTime + fadeInMs / 1_000);
    source.connect(filter).connect(panner).connect(gain).connect(this.busNodes.get(definition.bus)!);

    const voice = {
      source,
      gain,
      filter,
      panner,
      baseGain: definition.baseGain,
      spatial: definition.spatial,
      startedAt: context.currentTime,
    };
    active.push(voice);
    this.voices.set(id, active);
    if (definition.loop) this.loops.set(id, voice);
    source.onended = () => this.removeVoice(id, voice);
    source.start();
    this.emit({
      cue: id,
      bus: definition.bus,
      status: 'played',
      pan: resolved?.pan,
      gain: targetGain,
      lowpassHz: resolved?.lowpassHz,
      voices: active.length,
    });
  }

  route(event: AudioRouteEvent, spatial?: SpatialAudioInput) {
    for (const cue of audioCuesForEvent(event)) {
      const position = event.type === 'dog-vocalization' ? this.dogPosition : spatial;
      void this.play(cue, position);
    }
  }

  setDogPosition(position: SpatialAudioInput) {
    this.dogPosition = position;
    const context = this.context;
    if (!context) return;
    const resolved = spatialAudio(position);
    for (const [id, active] of this.voices) {
      if (audioAssetById.get(id)?.bus !== 'dog') continue;
      for (const voice of active) {
        if (!voice.spatial) continue;
        voice.panner.pan.setTargetAtTime(resolved.pan, context.currentTime, .045);
        voice.gain.gain.setTargetAtTime(voice.baseGain * resolved.gain, context.currentTime, .045);
        voice.filter.frequency.setTargetAtTime(resolved.lowpassHz, context.currentTime, .06);
      }
    }
  }

  setAmbience(locationId: string) {
    const next = new Set<AudioCueId>(locationAmbience[locationId] ?? ['ambience-wind']);
    this.desiredAmbience = next;
    for (const [id, voice] of this.loops) {
      if (audioAssetById.get(id)?.bus === 'ambience' && !next.has(id)) {
        this.stopVoice(voice, 650);
        this.loops.delete(id);
      }
    }
    for (const id of next) if (!this.loops.has(id)) void this.play(id, undefined, 900);
  }

  setMusic(section: 'menu' | 'briefing' | 'hunt' | 'final' | 'results') {
    const id = `music-${section}` as AudioCueId;
    this.desiredMusic = id;
    for (const [cue, voice] of this.loops) {
      if (audioAssetById.get(cue)?.bus === 'music' && cue !== id) {
        this.stopVoice(voice, 600);
        this.loops.delete(cue);
      }
    }
    if (!this.loops.has(id)) void this.play(id, undefined, 700);
  }

  async pause() {
    if (this.context?.state === 'running') await this.context.suspend();
    this.emitState();
  }

  async resume() {
    await this.unlock();
  }

  cleanupScene() {
    this.sceneGeneration += 1;
    for (const [id, active] of this.voices) {
      const bus = audioAssetById.get(id)?.bus;
      if (bus !== 'music' && bus !== 'UI') {
        for (const voice of active) this.stopVoice(voice, 180);
        this.loops.delete(id);
      }
    }
    this.desiredAmbience.clear();
    this.dogPosition = undefined;
  }

  nav() {
    void this.play('ui-nav');
  }

  success() {
    this.setMusic('results');
    void this.play('feedback-hit');
  }

  private createGraph() {
    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.masterNode = this.context.createGain();
    this.masterNode.connect(this.context.destination);
    for (const bus of AUDIO_BUSES) {
      if (bus === 'master') continue;
      const node = this.context.createGain();
      node.connect(this.masterNode);
      this.busNodes.set(bus, node);
    }
    this.applyAllBuses();
  }

  private async load(id: AudioCueId): Promise<AudioBuffer> {
    const existing = this.buffers.get(id);
    if (existing) return existing;
    const definition = audioAssetById.get(id);
    if (!definition || !this.context) throw new Error(`Cannot load unknown or locked audio cue ${id}.`);
    const pending = fetch(definition.path)
      .then((response) => {
        if (!response.ok) throw new Error(`Audio request failed: ${definition.path} (${response.status})`);
        return response.arrayBuffer();
      })
      .then((bytes) => this.context!.decodeAudioData(bytes))
      .then((buffer) => {
        this.emit({ cue: id, bus: definition.bus, status: 'loaded' });
        return buffer;
      });
    this.buffers.set(id, pending);
    return pending;
  }

  private stopVoice(voice: ActiveVoice, fadeMs: number) {
    const context = this.context;
    if (!context) return;
    const end = context.currentTime + fadeMs / 1_000;
    voice.gain.gain.cancelScheduledValues(context.currentTime);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), context.currentTime);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, end);
    try {
      voice.source.stop(end + .01);
    } catch {
      // An already-ended source needs no further cleanup.
    }
  }

  private removeVoice(id: AudioCueId, voice: ActiveVoice) {
    const remaining = (this.voices.get(id) ?? []).filter((entry) => entry !== voice);
    if (remaining.length) this.voices.set(id, remaining);
    else this.voices.delete(id);
    if (this.loops.get(id) === voice) this.loops.delete(id);
    this.emit({ cue: id, bus: audioAssetById.get(id)?.bus ?? 'effects', status: 'stopped', voices: remaining.length });
  }

  private applyAllBuses() {
    for (const bus of AUDIO_BUSES) this.applyBus(bus);
  }

  private applyBus(bus: AudioBus) {
    const context = this.context;
    if (!context) return;
    const snapshot = this.busState.snapshot();
    const value = snapshot.muted[bus] ? 0 : snapshot.gains[bus];
    const node = bus === 'master' ? this.masterNode : this.busNodes.get(bus);
    node?.gain.setTargetAtTime(value, context.currentTime, .025);
  }

  private emit(detail: AudioTelemetry) {
    window.dispatchEvent(new CustomEvent('adh-audio', { detail }));
  }

  private emitState() {
    window.dispatchEvent(new CustomEvent('adh-audio-state', {
      detail: { unlocked: this.unlocked, contextState: this.context?.state ?? 'none', ...this.settings },
    }));
  }
}

export type { SpatialAudioInput, SpatialAudioResult };
