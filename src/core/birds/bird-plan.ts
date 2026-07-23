import { SeededRandom } from '../rng';
import type { BirdState } from './bird-state';
import { birdPlacementCompatibility, type BirdFamily } from './bird-placement';

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
export type BiologicalVariantPolicy = 'independent' | 'flock-consistent' | 'mixed-required';
export type IndividualVisualVariant = 'natural' | 'alternate';
export type PosePreference = 'primary' | 'alternate';

export interface BirdPlanProfile {
  speciesId: string;
  family: BirdFamily;
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
  biologicalVariantPolicy: BiologicalVariantPolicy;
  individualScale: readonly [number, number];
  animationRateMultiplier: readonly [number, number];
  speedOffsetRatio: readonly [number, number];
  reactionOffsetMs: readonly [number, number];
  glideTimingOffsetMs: readonly [number, number];
  localPathOffset: readonly [number, number];
  landingProbability: number;
  returnProbability: number;
  revealBeforeFlush: boolean;
  revealDurationMs?: readonly [number, number];
}

export interface BirdPlan {
  speciesId: string;
  biologicalVariant: string;
  individualVisualSeed: number;
  individualVisualVariant: IndividualVisualVariant;
  scaleMultiplier: number;
  animationPhase: number;
  animationRateMultiplier: number;
  posePreference: PosePreference;
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
  movementPhase: number;
  speedOffset: number;
  reactionOffsetMs: number;
  glideTimingOffsetMs: number;
  localPathOffset: number;
  formationOffsetX: number;
  formationOffsetY: number;
}

const ranged = (rng: SeededRandom, range: readonly [number, number]) =>
  range[0] + rng.next() * (range[1] - range[0]);

export function createBirdPlan(profile: BirdPlanProfile, rng: SeededRandom, allowAirborneStart = false): BirdPlan {
  const pairs = profile.surfaces.flatMap((surface) => profile.initialStates
    .filter((state) => birdPlacementCompatibility(profile.speciesId, profile.family, state, surface, allowAirborneStart).compatible)
    .map((state) => ({ surface, state })));
  if (!pairs.length) throw new RangeError(`${profile.speciesId} has no compatible initial state and surface.`);
  const { surface, state: initialState } = rng.pick(pairs);
  const sampledBiologicalVariant = rng.pick(profile.variants);
  const biologicalVariant = profile.speciesId === 'ptarmigan'
    ? surface === 'snowGround' ? 'winter' : 'summer'
    : sampledBiologicalVariant;
  return {
    speciesId: profile.speciesId,
    biologicalVariant,
    individualVisualSeed: rng.int(1, 2_147_483_647),
    individualVisualVariant: 'natural',
    scaleMultiplier: 1,
    animationPhase: 0,
    animationRateMultiplier: 1,
    posePreference: 'primary',
    surface,
    initialState,
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
    movementPhase: rng.next() * Math.PI * 2,
    speedOffset: 0,
    reactionOffsetMs: 0,
    glideTimingOffsetMs: 0,
    localPathOffset: 0,
    formationOffsetX: 0,
    formationOffsetY: 0,
  };
}

export function initialStatesForSurface(
  surface: BirdSurface,
  states: readonly BirdState[],
  speciesId = 'mallard',
  family: BirdFamily = 'dabbler',
): readonly BirdState[] {
  return states.filter((state) => birdPlacementCompatibility(speciesId, family, state, surface).compatible);
}

export function createFlockPlans(
  profile: BirdPlanProfile,
  rng: SeededRandom,
  cap = 8,
): BirdPlan[] {
  const leader = createBirdPlan(profile, rng);
  const count = Math.min(cap, leader.flockSize);
  const flockVisualSeed = rng.int(1, 2_147_483_647);
  const treatmentOffset = new SeededRandom(flockVisualSeed).int(0, 1);
  return Array.from({ length: count }, (_, index) => {
    const memberRng = rng.fork(`flock-${flockVisualSeed}-member-${index}`);
    const individualVisualSeed = memberRng.int(1, 2_147_483_647);
    const visualRng = new SeededRandom(individualVisualSeed);
    const rank = Math.ceil(index / 2);
    const centered = index === 0 ? 0 : (index % 2 === 0 ? 1 : -1) * rank;
    const [baseOffsetX, baseOffsetY] = formationOffset(leader.formation, centered, rank, index, leader.formationSpacing);
    const formationJitter = index === 0 ? [0, 0] as const : [ranged(memberRng, [-0.006, 0.006]), ranged(memberRng, [-0.004, 0.004])] as const;
    const speedOffset = ranged(memberRng, profile.speedOffsetRatio) * leader.speed;
    const reactionOffsetMs = Math.round(ranged(memberRng, profile.reactionOffsetMs));
    return {
      ...leader,
      biologicalVariant: memberBiologicalVariant(profile, leader.biologicalVariant, memberRng, index, count),
      individualVisualSeed,
      individualVisualVariant: (index + treatmentOffset) % 2 === 0 ? 'natural' : 'alternate',
      scaleMultiplier: stratifiedValue(() => visualRng.next(), profile.individualScale, index),
      animationPhase: (visualRng.next() + index * 0.381_966_011_25) % 1,
      animationRateMultiplier: stratifiedValue(() => visualRng.next(), profile.animationRateMultiplier, index),
      posePreference: index % 2 === 0 ? 'primary' : 'alternate',
      speed: leader.speed + speedOffset,
      speedOffset,
      reactionDelayMs: Math.max(0, leader.reactionDelayMs + reactionOffsetMs),
      reactionOffsetMs,
      glideTimingOffsetMs: Math.round(ranged(memberRng, profile.glideTimingOffsetMs)),
      localPathOffset: ranged(memberRng, profile.localPathOffset),
      movementPhase: leader.movementPhase + ranged(memberRng, [-0.24, 0.24]),
      idleDirection: index % 2 === 0 ? leader.idleDirection : leader.idleDirection === 1 ? -1 : 1,
      formationOffsetX: baseOffsetX + formationJitter[0],
      formationOffsetY: baseOffsetY + formationJitter[1],
    };
  });
}

function memberBiologicalVariant(
  profile: BirdPlanProfile,
  leaderVariant: string,
  rng: SeededRandom,
  index: number,
  count: number,
): string {
  if (profile.biologicalVariantPolicy === 'flock-consistent') return leaderVariant;
  if (profile.biologicalVariantPolicy === 'mixed-required' && count > 1) {
    if (index === 0) return leaderVariant;
    if (index === 1) return profile.variants.find((variant) => variant !== leaderVariant) ?? leaderVariant;
  }
  return rng.pick(profile.variants);
}

function stratifiedValue(
  next: () => number,
  range: readonly [number, number],
  index: number,
): number {
  const bins = 4;
  const width = (range[1] - range[0]) / bins;
  const bin = index % bins;
  return range[0] + width * (bin + next());
}

function formationOffset(formation: Formation, centered: number, rank: number, index: number, spacing: number): [number, number] {
  const spacingScale = spacing / 64;
  switch (formation) {
    case 'vee': return [centered * 0.04 * spacingScale, rank * 0.028 * spacingScale];
    case 'wave': return [centered * 0.038 * spacingScale, (index % 2 === 0 ? -1 : 1) * 0.018 * spacingScale];
    case 'cluster': return [centered * 0.028 * spacingScale, Math.sin(index * 1.7) * 0.022 * spacingScale];
    case 'pair': return [centered * 0.045 * spacingScale, centered * 0.012 * spacingScale];
    case 'line': return [centered * 0.046 * spacingScale, centered * 0.006 * spacingScale];
    default: return [0, 0];
  }
}
