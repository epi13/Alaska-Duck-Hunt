import type { BirdPlan } from './bird-plan';
import type { BirdState } from './bird-state';

export interface Disturbance {
  dogX: number;
  dogY: number;
  birdX: number;
  birdY: number;
  nowMs: number;
}

export function disturbanceDelay(plan: BirdPlan, event: Disturbance): number | undefined {
  const distance = Math.hypot(event.birdX - event.dogX, event.birdY - event.dogY);
  if (distance > plan.disturbanceRadius) return undefined;
  const proximity = 1 - distance / plan.disturbanceRadius;
  return Math.max(0, Math.round(plan.reactionDelayMs * (1 - proximity * 0.45)));
}

export function isTargetableState(state: BirdState, occlusion: number): boolean {
  if (occlusion >= 0.72) return false;
  return !['concealed', 'revealing', 'hit', 'falling', 'escaped'].includes(state);
}

export interface FlightVector {
  x: number;
  y: number;
  rotation: number;
}

export function flightVector(plan: BirdPlan, elapsedMs: number): FlightVector {
  const t = elapsedMs / 1_000;
  const direction = plan.direction;
  const baseX = direction * (plan.speed + plan.acceleration * t);
  switch (plan.flightProfile) {
    case 'dartingFlight':
      return {
        x: baseX,
        y: -plan.climbRate * 0.35 + Math.sin(t * 5.8 + plan.phase) * 95,
        rotation: Math.sin(t * 5.8 + plan.phase) * 0.2,
      };
    case 'lowCoastalFlight':
      return { x: baseX, y: Math.sin(t * 2.1 + plan.phase) * 18, rotation: 0 };
    case 'heavyMarineFlight':
      return { x: baseX * 0.88, y: -plan.climbRate * 0.18, rotation: -direction * 0.025 };
    case 'gooseFormationFlight':
      return { x: baseX * 0.84, y: -plan.climbRate * 0.28 + Math.sin(t + plan.phase) * 12, rotation: 0 };
    case 'shortFlushFlight':
      return { x: baseX * 0.78, y: elapsedMs < 850 ? -plan.climbRate : plan.climbRate * 0.12, rotation: -direction * 0.06 };
    case 'craneFlight':
      return { x: baseX * 0.62, y: -plan.climbRate * 0.22 + Math.sin(t * 0.8 + plan.phase) * 16, rotation: 0 };
    case 'circlingReturn':
      return { x: baseX * Math.cos(t * 0.7), y: Math.sin(t * 1.4 + plan.phase) * 48, rotation: Math.sin(t * 0.7) * 0.18 };
    case 'localRelocation':
      return { x: baseX * 0.55, y: elapsedMs < 600 ? -plan.climbRate * 0.85 : plan.climbRate * 0.28, rotation: 0 };
    default:
      return { x: baseX, y: -plan.climbRate * 0.16 + Math.sin(t * 1.6 + plan.phase) * 16, rotation: 0 };
  }
}
