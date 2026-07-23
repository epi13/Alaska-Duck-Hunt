export type HuskyMotionState =
  | 'idle'
  | 'sniff'
  | 'searchWalk'
  | 'searchTrot'
  | 'run'
  | 'slowCautious'
  | 'alert'
  | 'lookHiddenBird'
  | 'boundCover'
  | 'flushReaction'
  | 'stopWatch'
  | 'celebrate'
  | 'turnTransition';

export interface HuskyMotionPhase {
  readonly state: HuskyMotionState;
  readonly speedFactor: number;
}

const patrolPhases = [
  { durationMs: 500, state: 'idle', speedFactor: 0 },
  { durationMs: 750, state: 'sniff', speedFactor: 0.3 },
  { durationMs: 3_200, state: 'searchWalk', speedFactor: 0.78 },
  { durationMs: 3_600, state: 'searchTrot', speedFactor: 1 },
  { durationMs: 800, state: 'slowCautious', speedFactor: 0.48 },
  { durationMs: 450, state: 'alert', speedFactor: 0 },
  { durationMs: 500, state: 'lookHiddenBird', speedFactor: 0 },
] as const satisfies readonly ({ readonly durationMs: number } & HuskyMotionPhase)[];

const patrolDuration = patrolPhases.reduce((sum, phase) => sum + phase.durationMs, 0);

export function huskyPatrolMotion(nowMs: number, phaseOffsetMs: number): HuskyMotionPhase {
  let elapsed = ((nowMs + phaseOffsetMs) % patrolDuration + patrolDuration) % patrolDuration;
  for (const phase of patrolPhases) {
    if (elapsed < phase.durationMs) return phase;
    elapsed -= phase.durationMs;
  }
  return patrolPhases[2];
}

export function huskyFlushMotion(elapsedMs: number): HuskyMotionPhase | undefined {
  if (elapsedMs < 0) return undefined;
  if (elapsedMs < 280) return { state: 'boundCover', speedFactor: 1.25 };
  if (elapsedMs < 540) return { state: 'flushReaction', speedFactor: 0 };
  if (elapsedMs < 900) return { state: 'stopWatch', speedFactor: 0 };
  if (elapsedMs < 1_300) return { state: 'run', speedFactor: 1.35 };
  return undefined;
}

export function huskyBoundLift(elapsedMs: number, reducedMotion: boolean): number {
  if (reducedMotion || elapsedMs < 0 || elapsedMs >= 280) return 0;
  return Math.sin((elapsedMs / 280) * Math.PI) * 18;
}
