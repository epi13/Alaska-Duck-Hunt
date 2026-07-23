import type { BirdState } from './bird-state';

const TIMED_ONE_SHOT_STATES = new Set<BirdState>([
  'revealing',
  'alert',
  'preTakeoff',
  'takeoff',
  'landing',
  'hit',
  'falling',
]);

export function isLoopingBirdAnimation(state: BirdState, repeat: number): boolean {
  return repeat === -1 && !TIMED_ONE_SHOT_STATES.has(state);
}

export function animationStartFrame(animationPhase: number, frameCount: number, looping: boolean): number {
  if (!looping || frameCount <= 1) return 0;
  const normalized = ((animationPhase % 1) + 1) % 1;
  return Math.min(frameCount - 1, Math.floor(normalized * frameCount));
}

export function shouldStartAnimation(currentKey: string | undefined, nextKey: string): boolean {
  return currentKey !== nextKey;
}

