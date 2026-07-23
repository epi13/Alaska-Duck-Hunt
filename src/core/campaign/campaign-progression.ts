import type { PassRequirements, RoundResultStats } from '../modes/round-config';

export const CAMPAIGN_LOCATION_IDS = [
  'matsu',
  'cook',
  'copper',
  'yk',
  'interior',
  'arctic',
  'aleutian',
  'southeast',
  'tundra',
  'alpine',
  'willow',
  'river',
] as const;

export type CampaignLocationId = (typeof CAMPAIGN_LOCATION_IDS)[number];
export type CampaignRating = 'C' | 'B' | 'A' | 'S';

export interface CampaignMission {
  readonly locationId: CampaignLocationId;
  readonly title: string;
  readonly objective: string;
  readonly requirements: PassRequirements;
}

export interface CampaignBestResult {
  readonly score: number;
  readonly accuracy: number;
  readonly targetHits: number;
  readonly identificationAccuracy: number;
  readonly protectedHits: number;
  readonly elapsedSeconds: number;
  readonly rating: CampaignRating;
}

export interface CampaignProgress {
  readonly started: boolean;
  readonly completedLocations: readonly CampaignLocationId[];
  readonly unlockedLocations: readonly CampaignLocationId[];
  readonly bestResults: Readonly<Partial<Record<CampaignLocationId, CampaignBestResult>>>;
  readonly campaignComplete: boolean;
}

export interface CampaignMissionEvaluation {
  readonly passed: boolean;
  readonly failures: readonly string[];
  readonly rating: CampaignRating;
}

export interface CampaignResult {
  readonly progress: CampaignProgress;
  readonly evaluation: CampaignMissionEvaluation;
  readonly newlyUnlockedLocation?: CampaignLocationId;
}

const legacyAliases: Readonly<Record<string, CampaignLocationId>> = {
  'matsu-wetlands': 'matsu',
  'mat-su-wetlands': 'matsu',
};

export function isCampaignLocationId(value: unknown): value is CampaignLocationId {
  return typeof value === 'string' && CAMPAIGN_LOCATION_IDS.includes(value as CampaignLocationId);
}

export function canonicalCampaignLocationId(value: unknown): CampaignLocationId | undefined {
  if (isCampaignLocationId(value)) return value;
  return typeof value === 'string' ? legacyAliases[value] : undefined;
}

export function campaignMission(
  missions: readonly CampaignMission[],
  locationId: string,
): CampaignMission {
  const id = canonicalCampaignLocationId(locationId) ?? 'matsu';
  return missions.find((mission) => mission.locationId === id) ?? missions[0]!;
}

export function createDefaultCampaignProgress(): CampaignProgress {
  return {
    started: false,
    completedLocations: [],
    unlockedLocations: ['matsu'],
    bestResults: {},
    campaignComplete: false,
  };
}

function canonicalList(value: unknown): CampaignLocationId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(canonicalCampaignLocationId).filter(isCampaignLocationId))].sort(
    (a, b) => CAMPAIGN_LOCATION_IDS.indexOf(a) - CAMPAIGN_LOCATION_IDS.indexOf(b),
  );
}

function finite(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function recoverBestResult(value: unknown): CampaignBestResult | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const result = value as Record<string, unknown>;
  const rating = ['C', 'B', 'A', 'S'].includes(String(result.rating))
    ? (result.rating as CampaignRating)
    : 'C';
  return {
    score: Math.max(0, finite(result.score)),
    accuracy: Math.max(0, Math.min(100, finite(result.accuracy))),
    targetHits: Math.max(0, finite(result.targetHits ?? result.hits)),
    identificationAccuracy: Math.max(
      0,
      Math.min(100, finite(result.identificationAccuracy)),
    ),
    protectedHits: Math.max(0, finite(result.protectedHits)),
    elapsedSeconds: Math.max(0, finite(result.elapsedSeconds)),
    rating,
  };
}

export function recoverCampaignProgress(raw: unknown): CampaignProgress {
  if (!raw || typeof raw !== 'object') return createDefaultCampaignProgress();
  const input = raw as Record<string, unknown>;
  const completed = canonicalList(input.completedLocations ?? input.completedMissions);
  const unlocked = canonicalList(input.unlockedLocations);
  const bestInput =
    input.bestResults && typeof input.bestResults === 'object'
      ? (input.bestResults as Record<string, unknown>)
      : {};
  const bestResults: Partial<Record<CampaignLocationId, CampaignBestResult>> = {};
  for (const [rawId, result] of Object.entries(bestInput)) {
    const id = canonicalCampaignLocationId(rawId);
    const recovered = recoverBestResult(result);
    if (id && recovered) bestResults[id] = recovered;
  }

  const derivedUnlocked = new Set<CampaignLocationId>(['matsu', ...unlocked]);
  for (const id of completed) {
    derivedUnlocked.add(id);
    const next = CAMPAIGN_LOCATION_IDS[CAMPAIGN_LOCATION_IDS.indexOf(id) + 1];
    if (next) derivedUnlocked.add(next);
  }
  const campaignComplete = completed.length === CAMPAIGN_LOCATION_IDS.length;
  return {
    started:
      input.started === true || completed.length > 0 || derivedUnlocked.size > 1 || campaignComplete,
    completedLocations: completed,
    unlockedLocations: CAMPAIGN_LOCATION_IDS.filter((id) => derivedUnlocked.has(id)),
    bestResults,
    campaignComplete,
  };
}

export function campaignCurrentLocation(
  progress: CampaignProgress,
): CampaignLocationId | undefined {
  const safe = recoverCampaignProgress(progress);
  return [...safe.unlockedLocations]
    .reverse()
    .find((id) => !safe.completedLocations.includes(id));
}

export function campaignNextLocation(
  progress: CampaignProgress,
  fromLocation?: CampaignLocationId,
): CampaignLocationId | undefined {
  const safe = recoverCampaignProgress(progress);
  if (fromLocation) {
    const next = CAMPAIGN_LOCATION_IDS[CAMPAIGN_LOCATION_IDS.indexOf(fromLocation) + 1];
    return next && safe.unlockedLocations.includes(next) ? next : undefined;
  }
  return campaignCurrentLocation(safe);
}

export function canPlayCampaignLocation(progress: CampaignProgress, locationId: string): boolean {
  const id = canonicalCampaignLocationId(locationId);
  return id !== undefined && recoverCampaignProgress(progress).unlockedLocations.includes(id);
}

function campaignRating(mission: CampaignMission, stats: RoundResultStats): CampaignRating {
  const scoreRatio = stats.score / Math.max(1, mission.requirements.minScore);
  if (
    scoreRatio >= 1.5 &&
    stats.accuracy >= Math.max(80, mission.requirements.minAccuracy + 15) &&
    stats.protectedHits === 0
  )
    return 'S';
  if (
    scoreRatio >= 1.25 &&
    stats.accuracy >= mission.requirements.minAccuracy + 10 &&
    stats.protectedHits === 0
  )
    return 'A';
  if (scoreRatio >= 1 && stats.accuracy >= mission.requirements.minAccuracy) return 'B';
  return 'C';
}

export function evaluateCampaignMission(
  missions: readonly CampaignMission[],
  locationId: string,
  stats: RoundResultStats,
): CampaignMissionEvaluation {
  const mission = campaignMission(missions, locationId);
  const failures: string[] = [];
  if (stats.score < mission.requirements.minScore)
    failures.push(`${mission.requirements.minScore.toLocaleString()} score`);
  if (stats.hits < mission.requirements.minHits)
    failures.push(`${mission.requirements.minHits} target hits`);
  if (stats.accuracy < mission.requirements.minAccuracy)
    failures.push(`${mission.requirements.minAccuracy}% shot accuracy`);
  if (stats.identificationAccuracy < mission.requirements.minIdentificationAccuracy)
    failures.push(`${mission.requirements.minIdentificationAccuracy}% identification accuracy`);
  if (stats.protectedHits > mission.requirements.maxProtectedHits)
    failures.push('avoid all protected birds');
  return { passed: failures.length === 0, failures, rating: campaignRating(mission, stats) };
}

function isBetterResult(candidate: CampaignBestResult, existing?: CampaignBestResult) {
  if (!existing) return true;
  const ranks: Record<CampaignRating, number> = { C: 0, B: 1, A: 2, S: 3 };
  return (
    ranks[candidate.rating] > ranks[existing.rating] ||
    (candidate.rating === existing.rating && candidate.score > existing.score)
  );
}

export function applyCampaignResult(
  missions: readonly CampaignMission[],
  progress: CampaignProgress,
  locationId: string,
  stats: RoundResultStats,
): CampaignResult {
  const safe = recoverCampaignProgress(progress);
  const id = canonicalCampaignLocationId(locationId);
  if (!id || !safe.unlockedLocations.includes(id))
    return {
      progress: safe,
      evaluation: { passed: false, failures: ['mission is locked'], rating: 'C' },
    };

  const evaluation = evaluateCampaignMission(missions, id, stats);
  const bestResult: CampaignBestResult = {
    score: stats.score,
    accuracy: stats.accuracy,
    targetHits: stats.hits,
    identificationAccuracy: stats.identificationAccuracy,
    protectedHits: stats.protectedHits,
    elapsedSeconds: stats.elapsedSeconds,
    rating: evaluation.rating,
  };
  const bestResults = { ...safe.bestResults };
  if (isBetterResult(bestResult, bestResults[id])) bestResults[id] = bestResult;
  if (!evaluation.passed)
    return {
      progress: { ...safe, started: true, bestResults },
      evaluation,
    };

  const completedLocations = CAMPAIGN_LOCATION_IDS.filter(
    (location) => safe.completedLocations.includes(location) || location === id,
  );
  const unlocked = new Set(safe.unlockedLocations);
  const next = CAMPAIGN_LOCATION_IDS[CAMPAIGN_LOCATION_IDS.indexOf(id) + 1];
  const newlyUnlockedLocation = next && !unlocked.has(next) ? next : undefined;
  if (next) unlocked.add(next);
  return {
    progress: {
      started: true,
      completedLocations,
      unlockedLocations: CAMPAIGN_LOCATION_IDS.filter((location) => unlocked.has(location)),
      bestResults,
      campaignComplete: completedLocations.length === CAMPAIGN_LOCATION_IDS.length,
    },
    evaluation,
    newlyUnlockedLocation,
  };
}

export function startCampaign(progress: CampaignProgress): CampaignProgress {
  return { ...recoverCampaignProgress(progress), started: true };
}
