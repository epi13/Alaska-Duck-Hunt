export interface SpatialAudioInput {
  readonly worldX: number;
  readonly worldWidth: number;
  readonly mapDepth: number;
  readonly occlusion?: number;
  readonly rear?: boolean;
}
export interface SpatialAudioResult {
  readonly pan: number;
  readonly gain: number;
  readonly lowpassHz: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function spatialAudio(input: SpatialAudioInput): SpatialAudioResult {
  const width = Math.max(1, input.worldWidth);
  const normalizedX = clamp(input.worldX / width, 0, 1);
  const depth = clamp(input.mapDepth, 0, 1);
  const occlusion = clamp(input.occlusion ?? 0, 0, 1);
  const pan = clamp((normalizedX * 2 - 1) * 0.88, -0.88, 0.88);
  const depthGain = 0.3 + depth * 0.7;
  const coverGain = 1 - occlusion * 0.46;
  const rearGain = input.rear ? 0.78 : 1;
  return {
    pan,
    gain: clamp(depthGain * coverGain * rearGain, 0.16, 1),
    lowpassHz: clamp(3_200 + depth * 12_800 - occlusion * 2_200 - (input.rear ? 1_400 : 0), 1_600, 16_000),
  };
}
