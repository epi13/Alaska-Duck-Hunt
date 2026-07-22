import type { SeededRandom } from '../rng';
import type { BirdState } from './bird-state';

export type BirdSurface =
  | 'openWater'
  | 'shallowWater'
  | 'mudflat'
  | 'shoreline'
  | 'marshGrass'
  | 'tallGrass'
  | 'tundraGround'
  | 'snowGround'
  | 'forestFloor'
  | 'lowBranch'
  | 'rockyCoast'
  | 'riverEdge';

export type FlightProfile =
  | 'directFlight'
  | 'dartingFlight'
  | 'lowCoastalFlight'
  | 'heavyMarineFlight'
  | 'gooseFormationFlight'
  | 'shortFlushFlight'
  | 'craneFlight'
  | 'circlingReturn'
  | 'localRelocation';

export type Formation = 'single' | 'pair' | 'cluster' | 'line' | 'vee' | 'wave';

export interface BirdPlanProfile {
  speciesId: string;
  variants: readonly string[];
  surfaces: readonly BirdSurface[];
  initialStates: readonly BirdState[];
  flightProfile: FlightProfile;
  speed: readonly [number, number];
  acceleration: number;
  climbRate: readonly [number, number];
  preferredAltitude: readonly [number, number];
  maximumTurnRate: number;
  flightDurationMs: readonly [number, number];
  reactionDelayMs: readonly [number, number];
  alertDurationMs: readonly [number, number];
  disturbanceRadius: readonly [number, number];
  flockSize: readonly [number, number];
  formation: readonly Formation[];
  formationSpacing: readonly [number, number];
  landingProbability: number;
  returnProbability: number;
  revealBeforeFlush: boolean;
  revealDurationMs?: readonly [number, number];
}

export interface BirdPlan {
  speciesId: string;
  variant: string;
  surface: BirdSurface;
  initialState: BirdState;
  flightProfile: FlightProfile;
  speed: number;
  acceleration: number;
  climbRate: number;
  preferredAltitude: number;
  maximumTurnRate: number;
  flightDurationMs: number;
  reactionDelayMs: number;
  alertDurationMs: number;
  disturbanceRadius: number;
  flockSize: number;
  formation: Formation;
  formationSpacing: number;
  willLand: boolean;
  willReturn: boolean;
  revealBeforeFlush: boolean;
  revealDurationMs: number;
  direction: -1 | 1;
  idleDirection: -1 | 1;
  spawnX: number;
  spawnY: number;
  phase: number;
  formationOffsetX: number;
  formationOffsetY: number;
}

const ranged = (rng: SeededRandom, range: readonly [number, number]) =>
  range[0] + rng.next() * (range[1] - range[0]);

export function createBirdPlan(profile: BirdPlanProfile, rng: SeededRandom): BirdPlan {
  const surface = rng.pick(profile.surfaces);
  return {
    speciesId: profile.speciesId,
    variant: rng.pick(profile.variants),
    surface,
    initialState: rng.pick(initialStatesForSurface(surface, profile.initialStates)),
    flightProfile: profile.flightProfile,
    speed: ranged(rng, profile.speed),
    acceleration: profile.acceleration,
    climbRate: ranged(rng, profile.climbRate),
    preferredAltitude: ranged(rng, profile.preferredAltitude),
    maximumTurnRate: profile.maximumTurnRate,
    flightDurationMs: Math.round(ranged(rng, profile.flightDurationMs)),
    reactionDelayMs: Math.round(ranged(rng, profile.reactionDelayMs)),
    alertDurationMs: Math.round(ranged(rng, profile.alertDurationMs)),
    disturbanceRadius: ranged(rng, profile.disturbanceRadius),
    flockSize: rng.int(profile.flockSize[0], profile.flockSize[1]),
    formation: rng.pick(profile.formation),
    formationSpacing: ranged(rng, profile.formationSpacing),
    willLand: rng.next() < profile.landingProbability,
    willReturn: rng.next() < profile.returnProbability,
    revealBeforeFlush: profile.revealBeforeFlush,
    revealDurationMs: Math.round(ranged(rng, profile.revealDurationMs ?? [900, 1_300])),
    direction: rng.next() < 0.5 ? -1 : 1,
    idleDirection: rng.next() < 0.5 ? -1 : 1,
    spawnX: 0.16 + rng.next() * 0.68,
    spawnY: rng.next(),
    phase: rng.next() * Math.PI * 2,
    formationOffsetX: 0,
    formationOffsetY: 0,
  };
}

export function initialStatesForSurface(
  surface: BirdSurface,
  states: readonly BirdState[],
): readonly BirdState[] {
  const allowed: readonly BirdState[] = surface === 'lowBranch'
    ? ['perched', 'concealed', 'resting', 'alert']
    : ['openWater', 'shallowWater', 'riverEdge'].includes(surface)
      ? ['swimming', 'diving', 'resting', 'alert']
      : ['foraging', 'walking', 'concealed', 'resting', 'alert'];
  const compatible = states.filter((state) => allowed.includes(state));
  return compatible.length ? compatible : ['resting'];
}

export function createFlockPlans(
  profile: BirdPlanProfile,
  rng: SeededRandom,
  cap = 8,
): BirdPlan[] {
  const leader = createBirdPlan(profile, rng);
  const count = Math.min(cap, leader.flockSize);
  return Array.from({ length: count }, (_, index) => {
    const centered = index - (count - 1) / 2;
    const rank = Math.abs(centered);
    const [formationOffsetX, formationOffsetY] = formationOffset(leader.formation, centered, rank, index);
    return {
      ...leader,
      reactionDelayMs: leader.reactionDelayMs + index * rng.int(70, 210),
      spawnX: Math.min(0.9, Math.max(0.1, leader.spawnX + formationOffsetX)),
      phase: leader.phase + index * 0.62,
      idleDirection: index % 2 === 0 ? leader.idleDirection : leader.idleDirection === 1 ? -1 : 1,
      formationOffsetX,
      formationOffsetY,
    };
  });
}

function formationOffset(formation: Formation, centered: number, rank: number, index: number): [number, number] {
  switch (formation) {
    case 'vee': return [centered * 0.04, rank * 0.028];
    case 'wave': return [centered * 0.038, (index % 2 === 0 ? -1 : 1) * 0.018];
    case 'cluster': return [centered * 0.028, Math.sin(index * 1.7) * 0.022];
    case 'pair': return [centered * 0.045, centered * 0.012];
    case 'line': return [centered * 0.046, centered * 0.006];
    default: return [0, 0];
  }
}
