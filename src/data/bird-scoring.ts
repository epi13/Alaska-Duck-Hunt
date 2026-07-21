import type { BirdState } from '../core/birds/bird-state';

export interface BirdScoringProfile {
  speciesId: string;
  role: 'target' | 'protected';
  baseScore: number;
  protectedPenalty: number;
  stateMultipliers: Partial<Record<BirdState, number>>;
  specialLabels?: Partial<Record<BirdState, string>>;
}

const defaultMultipliers: Partial<Record<BirdState, number>> = {
  resting: 0.8,
  foraging: 0.85,
  walking: 0.9,
  swimming: 0.9,
  perched: 0.85,
  alert: 1,
  preTakeoff: 1.08,
  takeoff: 1.18,
  flying: 1,
  banking: 1.1,
  climbing: 1.08,
  descending: 1.05,
  distant: 0.75,
};

const baseScores: Record<string, number> = {
  mallard: 120,
  pintail: 145,
  wigeon: 135,
  teal: 190,
  scaup: 150,
  eider: 165,
  harlequin: 185,
  goldeneye: 180,
  goose: 175,
  'canada-goose': 160,
  'snow-goose': 155,
  brant: 170,
  crane: 260,
  grouse: 185,
  ptarmigan: 175,
};

export const birdScoring: readonly BirdScoringProfile[] = [
  ...Object.entries(baseScores).map(([speciesId, baseScore]) => ({
    speciesId,
    role: 'target' as const,
    baseScore,
    protectedPenalty: 0,
    stateMultipliers:
      speciesId === 'crane'
        ? { ...defaultMultipliers, standingBonus: 2, flying: 1 }
        : defaultMultipliers,
    specialLabels:
      speciesId === 'crane' ? ({ standingBonus: 'UPRIGHT CRANE BONUS' } as const) : undefined,
  })),
  {
    speciesId: 'spectacled',
    role: 'protected',
    baseScore: 0,
    protectedPenalty: 1_500,
    stateMultipliers: {},
  },
];

export const birdScoringBySpecies = new Map(
  birdScoring.map((entry) => [entry.speciesId, entry] as const),
);

export interface BirdScoreInput {
  speciesId: string;
  state: BirdState;
  distance: number;
  speedRatio: number;
  combo: number;
}

export interface BirdScoreResult {
  points: number;
  protectedPenalty: number;
  label?: string;
}

export function scoreBird(input: BirdScoreInput): BirdScoreResult {
  const profile = birdScoringBySpecies.get(input.speciesId);
  if (!profile) return { points: 0, protectedPenalty: 0 };
  if (profile.role === 'protected') {
    return { points: 0, protectedPenalty: profile.protectedPenalty };
  }
  const stateMultiplier = profile.stateMultipliers[input.state] ?? 1;
  const distanceMultiplier = 0.85 + Math.min(1, Math.max(0, input.distance)) * 0.35;
  const difficultyMultiplier = 0.9 + Math.min(1.5, Math.max(0.5, input.speedRatio)) * 0.2;
  const comboMultiplier = 1 + Math.min(1.25, Math.max(0, input.combo) * 0.08);
  return {
    points: Math.round(
      profile.baseScore * stateMultiplier * distanceMultiplier * difficultyMultiplier * comboMultiplier,
    ),
    protectedPenalty: 0,
    label: profile.specialLabels?.[input.state],
  };
}
