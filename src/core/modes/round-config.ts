import type { Weather } from '../round-generator';

export type GameMode =
  | 'campaign'
  | 'classic'
  | 'endless'
  | 'species'
  | 'identification'
  | 'time'
  | 'practice'
  | 'daily'
  | 'custom';

export interface AmmunitionRules {
  readonly magazineSize: number;
  readonly reloads: number | 'unlimited';
  readonly reloadAllowed: boolean;
}

export interface ProtectedLookalikeRules {
  readonly enabled: boolean;
  readonly speciesIds: readonly string[];
  readonly warningRequired: boolean;
}

export interface RoundScoringRules {
  readonly targetMultiplier: number;
  readonly accuracyBonus: number;
  readonly missPenalty: number;
  readonly nonTargetPenalty: number;
  readonly protectedPenalty: number;
  readonly timeBonusPerSecond: number;
}

export type RoundObjective =
  | { readonly kind: 'score'; readonly target: number; readonly description: string }
  | { readonly kind: 'hits'; readonly target: number; readonly description: string }
  | { readonly kind: 'identification'; readonly target: number; readonly description: string }
  | { readonly kind: 'survival'; readonly target: number; readonly description: string };

export interface PassRequirements {
  readonly minScore: number;
  readonly minHits: number;
  readonly minAccuracy: number;
  readonly minIdentificationAccuracy: number;
  readonly maxProtectedHits: number;
  readonly maxMistakes?: number;
}

export interface RoundAssists {
  readonly aimAssist: boolean;
  readonly identificationLabels: boolean;
  readonly trajectoryGuide: boolean;
}

export interface RoundSpeciesRule {
  readonly speciesId: string;
  readonly role: 'target' | 'non-target' | 'protected';
  readonly weight: number;
}

export interface RoundPlayerOptions {
  readonly locationId?: string;
  readonly targetSpeciesIds?: readonly string[];
  readonly durationSeconds?: number;
  readonly magazineSize?: number;
  readonly reloads?: number | 'unlimited';
  readonly difficulty?: number;
  readonly speedMultiplier?: number;
  readonly weather?: Weather;
  readonly flockCap?: number;
  readonly assists?: Partial<RoundAssists>;
  readonly includeProtected?: boolean;
  readonly seed?: string;
  readonly roundIndex?: number;
}

export interface RoundConfig {
  readonly version: 1;
  readonly mode: GameMode;
  readonly locationId: string;
  readonly seed: string;
  readonly challengeDate?: string;
  readonly durationSeconds: number | null;
  readonly endless: boolean;
  readonly ammunition: AmmunitionRules;
  readonly targetSpeciesIds: readonly string[];
  readonly protectedLookalikes: ProtectedLookalikeRules;
  readonly spawnSpecies: readonly RoundSpeciesRule[];
  readonly flockCap: number;
  readonly spawnCadenceMs: number;
  readonly speedMultiplier: number;
  readonly weather: Weather;
  readonly visibility: number;
  readonly scoring: RoundScoringRules;
  readonly objective: RoundObjective;
  readonly passRequirements: PassRequirements;
  readonly assists: RoundAssists;
  readonly playerOptions: RoundPlayerOptions;
  readonly campaignMissionIndex?: number;
}

export interface RoundResultStats {
  readonly score: number;
  readonly hits: number;
  readonly shots: number;
  readonly accuracy: number;
  readonly identificationAccuracy: number;
  readonly protectedHits: number;
  readonly nonTargetHits: number;
  readonly misses: number;
  readonly elapsedSeconds: number;
}

export interface RoundEvaluation {
  readonly passed: boolean;
  readonly failures: readonly string[];
}

export function validateRoundConfig(config: RoundConfig): readonly string[] {
  const errors: string[] = [];
  if (!config.locationId) errors.push('A location is required.');
  if (!config.seed) errors.push('A deterministic seed is required.');
  if (config.endless && config.durationSeconds !== null)
    errors.push('Endless rounds cannot have a duration.');
  if (!config.endless && (!config.durationSeconds || config.durationSeconds < 10))
    errors.push('Timed rounds require at least 10 seconds.');
  if (config.ammunition.magazineSize < 1 || config.ammunition.magazineSize > 20)
    errors.push('Magazine size must be between 1 and 20.');
  if (!config.targetSpeciesIds.length) errors.push('At least one target species is required.');
  if (config.flockCap < 1 || config.flockCap > 30)
    errors.push('Flock cap must be between 1 and 30.');
  if (config.spawnCadenceMs < 500 || config.spawnCadenceMs > 15_000)
    errors.push('Spawn cadence must be between 500 and 15000ms.');
  if (config.speedMultiplier < 0.5 || config.speedMultiplier > 2)
    errors.push('Speed multiplier must be between 0.5 and 2.');
  if (config.visibility < 0.3 || config.visibility > 1)
    errors.push('Visibility must be between 0.3 and 1.');
  if (config.spawnSpecies.some(({ weight }) => weight <= 0))
    errors.push('Every spawn species must have positive weight.');
  if (config.protectedLookalikes.speciesIds.some((id) => config.targetSpeciesIds.includes(id)))
    errors.push('A protected lookalike cannot also be a target.');
  return errors;
}

export function evaluateRound(config: RoundConfig, stats: RoundResultStats): RoundEvaluation {
  const failures: string[] = [];
  if (stats.score < config.passRequirements.minScore)
    failures.push(`Score ${config.passRequirements.minScore}`);
  if (stats.hits < config.passRequirements.minHits)
    failures.push(`${config.passRequirements.minHits} valid hits`);
  if (stats.accuracy < config.passRequirements.minAccuracy)
    failures.push(`${config.passRequirements.minAccuracy}% shot accuracy`);
  if (stats.identificationAccuracy < config.passRequirements.minIdentificationAccuracy)
    failures.push(`${config.passRequirements.minIdentificationAccuracy}% identification accuracy`);
  if (stats.protectedHits > config.passRequirements.maxProtectedHits)
    failures.push('No protected-bird hits');
  if (
    config.passRequirements.maxMistakes !== undefined &&
    stats.misses + stats.nonTargetHits + stats.protectedHits >= config.passRequirements.maxMistakes
  )
    failures.push(`Fewer than ${config.passRequirements.maxMistakes} mistakes`);
  return { passed: failures.length === 0, failures };
}
