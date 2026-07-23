import {
  type RoundAssists,
  type RoundConfig,
  type RoundPlayerOptions,
  validateRoundConfig,
} from '../core/modes/round-config';
import { dailySeed, SeededRandom } from '../core/rng';
import type { Weather } from '../core/round-generator';
import { birdHabitats } from './bird-habitats';
import { locations, modes, species, type GameMode } from './content';

export interface ModePresentation {
  readonly id: GameMode;
  readonly name: string;
  readonly rulesSummary: string;
  readonly duration: string;
  readonly objectiveStyle: string;
}

export const modePresentations: readonly ModePresentation[] = modes.map((mode) => {
  const details: Record<GameMode, Omit<ModePresentation, 'id' | 'name'>> = {
    campaign: {
      rulesSummary: 'Location missions with progression and qualification standards.',
      duration: '75 sec missions',
      objectiveStyle: 'Score + accuracy',
    },
    classic: {
      rulesSummary: 'One arcade round, eight-hit quota, two reloads.',
      duration: '60 sec',
      objectiveStyle: 'Hit quota',
    },
    endless: {
      rulesSummary: 'Migration pressure escalates until three mistakes end the run.',
      duration: 'Endless',
      objectiveStyle: 'Survival score',
    },
    species: {
      rulesSummary: 'One chosen target with plausible non-target lookalikes.',
      duration: '70 sec',
      objectiveStyle: 'Species mastery',
    },
    identification: {
      rulesSummary: 'Separate targets from confusing and protected birds.',
      duration: '75 sec',
      objectiveStyle: 'Identification accuracy',
    },
    time: {
      rulesSummary: 'Fast birds, time bonus, and a player-selected clock.',
      duration: '30–120 sec',
      objectiveStyle: 'Speed score',
    },
    practice: {
      rulesSummary: 'Configurable training with no campaign consequences.',
      duration: '30–180 sec',
      objectiveStyle: 'Training',
    },
    daily: {
      rulesSummary: 'One UTC-date challenge shared by every player.',
      duration: '60 sec',
      objectiveStyle: 'Daily objective',
    },
    custom: {
      rulesSummary: 'Build and validate a complete hunt configuration.',
      duration: '30–180 sec',
      objectiveStyle: 'Player defined',
    },
  };
  return { id: mode.id, name: mode.name, ...details[mode.id] };
});

const defaultAssists: RoundAssists = {
  aimAssist: false,
  identificationLabels: false,
  trajectoryGuide: false,
};

const targetIds = species.filter(({ target }) => target).map(({ id }) => id);
const protectedIds = species.filter(({ target }) => !target).map(({ id }) => id);

export function speciesForLocation(locationId: string): readonly string[] {
  return birdHabitats
    .filter(
      ({ speciesId, locations: habitatLocations }) =>
        habitatLocations.includes(locationId) && targetIds.includes(speciesId),
    )
    .map(({ speciesId }) => speciesId);
}

function supportsLocation(speciesId: string, locationId: string) {
  return (
    birdHabitats.find((entry) => entry.speciesId === speciesId)?.locations.includes(locationId) ??
    false
  );
}

function firstSupportedLocation(speciesId: string) {
  return (
    birdHabitats.find((entry) => entry.speciesId === speciesId)?.locations[0] ?? locations[0]!.id
  );
}

function weatherVisibility(weather: Weather) {
  return weather === 'fog' ? 0.58 : weather === 'snow' ? 0.7 : weather === 'rain' ? 0.78 : 1;
}

function selectedTargets(options: RoundPlayerOptions, locationId: string) {
  const requested = (options.targetSpeciesIds ?? []).filter(
    (id) => targetIds.includes(id) && supportsLocation(id, locationId),
  );
  return requested.length ? requested : speciesForLocation(locationId).slice(0, 4);
}

function roundSeed(
  mode: GameMode,
  locationId: string,
  targets: readonly string[],
  options: RoundPlayerOptions,
) {
  return (
    options.seed ??
    `${mode}:${locationId}:${targets.join(',')}:${options.durationSeconds ?? 'default'}:${options.roundIndex ?? 0}`
  );
}

export function createRoundConfig(
  mode: GameMode,
  rawOptions: RoundPlayerOptions = {},
  now = new Date(),
): RoundConfig {
  const options: RoundPlayerOptions = JSON.parse(JSON.stringify(rawOptions)) as RoundPlayerOptions;
  if (mode === 'daily') return createDailyConfig(now);
  if (mode === 'custom') validateCustomOptions(options);

  const requestedTarget = options.targetSpeciesIds?.find((id) => targetIds.includes(id));
  const defaultLocation =
    mode === 'identification'
      ? 'arctic'
      : requestedTarget
        ? firstSupportedLocation(requestedTarget)
        : mode === 'campaign'
          ? locations[Math.max(0, Math.min(locations.length - 1, options.roundIndex ?? 0))]!.id
          : 'copper';
  const locationId = locations.some(({ id }) => id === options.locationId)
    ? options.locationId!
    : defaultLocation;
  const targets = selectedTargets(options, locationId);
  const difficulty = Math.max(1, Math.min(5, options.difficulty ?? 2));
  const weather = options.weather ?? (mode === 'campaign' ? 'rain' : 'clear');
  const includeProtected = options.includeProtected ?? ['identification', 'custom'].includes(mode);
  const eligibleProtected = protectedIds.filter((id) => supportsLocation(id, locationId));
  const protectedSpecies = includeProtected ? eligibleProtected : [];
  const nonTargets = speciesForLocation(locationId)
    .filter((id) => !targets.includes(id))
    .slice(0, mode === 'identification' ? 3 : 1);
  const assists = { ...defaultAssists, ...options.assists };
  const durationByMode: Record<Exclude<GameMode, 'daily'>, number | null> = {
    campaign: 75,
    classic: 60,
    endless: null,
    species: 70,
    identification: 75,
    time: Math.max(30, Math.min(120, options.durationSeconds ?? 45)),
    practice: Math.max(30, Math.min(180, options.durationSeconds ?? 120)),
    custom: Math.max(30, Math.min(180, options.durationSeconds ?? 90)),
  };
  const durationSeconds = durationByMode[mode];
  const endless = mode === 'endless';
  const defaults = modeRules(mode);
  const config: RoundConfig = {
    version: 1,
    mode,
    locationId,
    seed: roundSeed(mode, locationId, targets, options),
    durationSeconds,
    endless,
    ammunition: {
      magazineSize: Math.max(1, Math.min(20, options.magazineSize ?? defaults.magazineSize)),
      reloads: options.reloads ?? defaults.reloads,
      reloadAllowed: (options.reloads ?? defaults.reloads) !== 0,
    },
    targetSpeciesIds: targets,
    protectedLookalikes: {
      enabled: protectedSpecies.length > 0,
      speciesIds: protectedSpecies,
      warningRequired: protectedSpecies.length > 0,
    },
    spawnSpecies: [
      ...targets.map((speciesId) => ({
        speciesId,
        role: 'target' as const,
        weight: mode === 'species' ? 8 : 5,
      })),
      ...nonTargets.map((speciesId) => ({
        speciesId,
        role: 'non-target' as const,
        weight: mode === 'identification' ? 4 : 1,
      })),
      ...protectedSpecies.map((speciesId) => ({
        speciesId,
        role: 'protected' as const,
        weight: mode === 'identification' ? 3 : 1,
      })),
    ],
    flockCap: Math.max(1, Math.min(30, options.flockCap ?? defaults.flockCap)),
    spawnCadenceMs: Math.round(defaults.spawnCadenceMs / (1 + (difficulty - 2) * 0.08)),
    speedMultiplier:
      options.speedMultiplier ??
      Number((defaults.speedMultiplier * (1 + (difficulty - 2) * 0.08)).toFixed(2)),
    weather,
    visibility: weatherVisibility(weather),
    scoring: defaults.scoring,
    objective: defaults.objective,
    passRequirements: defaults.passRequirements,
    assists,
    playerOptions: { ...options, locationId, targetSpeciesIds: targets },
    campaignMissionIndex: mode === 'campaign' ? (options.roundIndex ?? 0) : undefined,
  };
  const errors = validateRoundConfig(config);
  if (errors.length) throw new Error(errors.join(' '));
  return config;
}

function validateCustomOptions(options: RoundPlayerOptions) {
  const errors: string[] = [];
  if (options.targetSpeciesIds !== undefined && options.targetSpeciesIds.length === 0)
    errors.push('Select at least one target species.');
  if (
    options.durationSeconds !== undefined &&
    (options.durationSeconds < 30 || options.durationSeconds > 180)
  )
    errors.push('Duration must be between 30 and 180 seconds.');
  if (options.magazineSize !== undefined && (options.magazineSize < 1 || options.magazineSize > 20))
    errors.push('Magazine size must be between 1 and 20.');
  if (options.flockCap !== undefined && (options.flockCap < 1 || options.flockCap > 30))
    errors.push('Flock cap must be between 1 and 30.');
  if (options.difficulty !== undefined && (options.difficulty < 1 || options.difficulty > 5))
    errors.push('Difficulty must be between 1 and 5.');
  if (
    options.speedMultiplier !== undefined &&
    (options.speedMultiplier < 0.5 || options.speedMultiplier > 2)
  )
    errors.push('Speed multiplier must be between 0.5 and 2.');
  if (errors.length) throw new Error(errors.join(' '));
}

function createDailyConfig(now: Date): RoundConfig {
  const challengeDate = dailySeed(now);
  const rng = new SeededRandom(`daily:${challengeDate}`);
  const locationId = rng.pick(locations).id;
  const eligibleTargets = speciesForLocation(locationId);
  const targetSpeciesId = rng.pick(eligibleTargets);
  const weather = rng.pick(['clear', 'rain', 'fog', 'wind'] as const);
  const protectedSpecies = protectedIds.filter((id) => supportsLocation(id, locationId));
  return {
    version: 1,
    mode: 'daily',
    locationId,
    seed: `daily:${challengeDate}`,
    challengeDate,
    durationSeconds: 60,
    endless: false,
    ammunition: { magazineSize: 5, reloads: 2, reloadAllowed: true },
    targetSpeciesIds: [targetSpeciesId],
    protectedLookalikes: {
      enabled: protectedSpecies.length > 0,
      speciesIds: protectedSpecies,
      warningRequired: protectedSpecies.length > 0,
    },
    spawnSpecies: [
      { speciesId: targetSpeciesId, role: 'target', weight: 6 },
      ...speciesForLocation(locationId)
        .filter((id) => id !== targetSpeciesId)
        .slice(0, 2)
        .map((speciesId) => ({ speciesId, role: 'non-target' as const, weight: 2 })),
      ...protectedSpecies.map((speciesId) => ({
        speciesId,
        role: 'protected' as const,
        weight: 1,
      })),
    ],
    flockCap: 12,
    spawnCadenceMs: 3_600,
    speedMultiplier: 1.08,
    weather,
    visibility: weatherVisibility(weather),
    scoring: {
      targetMultiplier: 1.1,
      accuracyBonus: 500,
      missPenalty: 35,
      nonTargetPenalty: 350,
      protectedPenalty: 1_800,
      timeBonusPerSecond: 0,
    },
    objective: {
      kind: 'score',
      target: 1_400,
      description: 'Score 1,400 with at least 65% accuracy.',
    },
    passRequirements: {
      minScore: 1_400,
      minHits: 5,
      minAccuracy: 65,
      minIdentificationAccuracy: 75,
      maxProtectedHits: 0,
    },
    assists: defaultAssists,
    playerOptions: { locationId, targetSpeciesIds: [targetSpeciesId] },
  };
}

function modeRules(mode: Exclude<GameMode, 'daily'>) {
  const commonScoring = {
    targetMultiplier: 1,
    accuracyBonus: 300,
    missPenalty: 20,
    nonTargetPenalty: 250,
    protectedPenalty: 1_500,
    timeBonusPerSecond: 0,
  };
  const commonPass = {
    minScore: 0,
    minHits: 0,
    minAccuracy: 0,
    minIdentificationAccuracy: 0,
    maxProtectedHits: 0,
  };
  return {
    campaign: {
      magazineSize: 5,
      reloads: 2 as number | 'unlimited',
      flockCap: 14,
      spawnCadenceMs: 4_200,
      speedMultiplier: 1,
      scoring: commonScoring,
      objective: {
        kind: 'score' as const,
        target: 1_200,
        description: 'Score 1,200 and maintain 45% accuracy.',
      },
      passRequirements: { ...commonPass, minScore: 1_200, minAccuracy: 45 },
    },
    classic: {
      magazineSize: 5,
      reloads: 2 as number | 'unlimited',
      flockCap: 12,
      spawnCadenceMs: 3_700,
      speedMultiplier: 1,
      scoring: commonScoring,
      objective: {
        kind: 'hits' as const,
        target: 8,
        description: 'Make eight valid hits before the round ends.',
      },
      passRequirements: { ...commonPass, minHits: 8, minAccuracy: 40 },
    },
    endless: {
      magazineSize: 6,
      reloads: 'unlimited' as const,
      flockCap: 18,
      spawnCadenceMs: 2_800,
      speedMultiplier: 1.08,
      scoring: { ...commonScoring, missPenalty: 0 },
      objective: {
        kind: 'survival' as const,
        target: 3,
        description: 'Survive escalating migration pressure; three mistakes end the run.',
      },
      passRequirements: { ...commonPass, maxMistakes: 3 },
    },
    species: {
      magazineSize: 5,
      reloads: 3 as number | 'unlimited',
      flockCap: 10,
      spawnCadenceMs: 3_900,
      speedMultiplier: 1.02,
      scoring: { ...commonScoring, nonTargetPenalty: 400 },
      objective: {
        kind: 'hits' as const,
        target: 6,
        description: 'Make six valid hits on the selected species only.',
      },
      passRequirements: { ...commonPass, minHits: 6, minAccuracy: 60 },
    },
    identification: {
      magazineSize: 5,
      reloads: 2 as number | 'unlimited',
      flockCap: 12,
      spawnCadenceMs: 4_000,
      speedMultiplier: 0.96,
      scoring: {
        ...commonScoring,
        nonTargetPenalty: 500,
        protectedPenalty: 2_000,
      },
      objective: {
        kind: 'identification' as const,
        target: 80,
        description: 'Finish with 80% identification accuracy and no protected hits.',
      },
      passRequirements: {
        ...commonPass,
        minHits: 4,
        minIdentificationAccuracy: 80,
      },
    },
    time: {
      magazineSize: 6,
      reloads: 'unlimited' as const,
      flockCap: 16,
      spawnCadenceMs: 2_600,
      speedMultiplier: 1.14,
      scoring: { ...commonScoring, accuracyBonus: 600, timeBonusPerSecond: 12 },
      objective: {
        kind: 'score' as const,
        target: 1_000,
        description: 'Reach 1,000 quickly; speed and accuracy earn bonuses.',
      },
      passRequirements: { ...commonPass, minScore: 1_000, minAccuracy: 50 },
    },
    practice: {
      magazineSize: 8,
      reloads: 'unlimited' as const,
      flockCap: 8,
      spawnCadenceMs: 4_600,
      speedMultiplier: 0.85,
      scoring: { ...commonScoring, nonTargetPenalty: 0, protectedPenalty: 0 },
      objective: {
        kind: 'hits' as const,
        target: 0,
        description: 'Train with the selected settings; no qualification required.',
      },
      passRequirements: commonPass,
    },
    custom: {
      magazineSize: 5,
      reloads: 3 as number | 'unlimited',
      flockCap: 12,
      spawnCadenceMs: 3_800,
      speedMultiplier: 1,
      scoring: commonScoring,
      objective: {
        kind: 'score' as const,
        target: 1_000,
        description: 'Score 1,000 under the selected custom rules.',
      },
      passRequirements: { ...commonPass, minScore: 1_000 },
    },
  }[mode];
}

export function modeBestStorageKey(mode: GameMode) {
  return `adh-mode-best-${mode}`;
}
