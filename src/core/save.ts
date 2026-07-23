import {
  CAMPAIGN_LOCATION_IDS,
  createDefaultCampaignProgress,
  recoverCampaignProgress,
  type CampaignProgress,
} from './campaign/campaign-progression';

export const SAVE_VERSION = 3;
export const SAVE_STORAGE_KEY = 'adh-save';

export interface SaveData {
  version: typeof SAVE_VERSION;
  profile: { id: string; name: string };
  campaign: CampaignProgress;
  records: { highScores: Record<string, number>; dailyScores: Record<string, number> };
  stats: {
    shots: number;
    validHits: number;
    misses: number;
    protectedAvoided: number;
    bestCombo: number;
    huntsCompleted: number;
    bestAccuracy: number;
  };
  settings: { masterVolume: number; reducedMotion: boolean; screenShake: boolean; sensitivity: number };
}

export function createDefaultSave(id = 'default', name = 'Hunter'): SaveData {
  return {
    version: SAVE_VERSION,
    profile: { id, name },
    campaign: createDefaultCampaignProgress(),
    records: { highScores: {}, dailyScores: {} },
    stats: {
      shots: 0,
      validHits: 0,
      misses: 0,
      protectedAvoided: 0,
      bestCombo: 0,
      huntsCompleted: 0,
      bestAccuracy: 0,
    },
    settings: { masterVolume: 0.8, reducedMotion: false, screenShake: true, sensitivity: 1 },
  };
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function number(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

function numberRecord(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(object(value))
      .filter((entry): entry is [string, number] => {
        const [, score] = entry;
        return typeof score === 'number' && Number.isFinite(score) && score >= 0;
      })
      .map(([key, score]) => [key, score]),
  );
}

export function migrateSave(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return createDefaultSave();
  const input = raw as Record<string, unknown>;
  const base = createDefaultSave();
  const profile = object(input.profile);
  const campaign = recoverCampaignProgress(input.campaign);
  const records = object(input.records);
  const stats = object(input.stats);
  const settings = object(input.settings);
  return {
    version: SAVE_VERSION,
    profile: {
      id: text(profile.id, base.profile.id),
      name: text(profile.name, base.profile.name),
    },
    campaign,
    records: {
      highScores: numberRecord(records.highScores),
      dailyScores: numberRecord(records.dailyScores),
    },
    stats: {
      shots: number(stats.shots, base.stats.shots),
      validHits: number(stats.validHits, base.stats.validHits),
      misses: number(stats.misses, base.stats.misses),
      protectedAvoided: number(stats.protectedAvoided, base.stats.protectedAvoided),
      bestCombo: number(stats.bestCombo, base.stats.bestCombo),
      huntsCompleted: number(stats.huntsCompleted, base.stats.huntsCompleted),
      bestAccuracy: number(stats.bestAccuracy, base.stats.bestAccuracy, 0, 100),
    },
    settings: {
      masterVolume: number(settings.masterVolume, base.settings.masterVolume, 0, 1),
      reducedMotion:
        typeof settings.reducedMotion === 'boolean'
          ? settings.reducedMotion
          : base.settings.reducedMotion,
      screenShake:
        typeof settings.screenShake === 'boolean' ? settings.screenShake : base.settings.screenShake,
      sensitivity: number(settings.sensitivity, base.settings.sensitivity, 0.1, 3),
    },
  };
}

export function parseSave(serialized: string): SaveData {
  try {
    return migrateSave(JSON.parse(serialized));
  } catch {
    return createDefaultSave();
  }
}

export const serializeSave = (save: SaveData): string => JSON.stringify(migrateSave(save));

export function migrateLegacyCampaignIndex(
  save: SaveData,
  nextLocationIndex: unknown,
  started: unknown,
): SaveData {
  const numericIndex =
    typeof nextLocationIndex === 'number'
      ? nextLocationIndex
      : typeof nextLocationIndex === 'string' && nextLocationIndex.trim() !== ''
        ? Number(nextLocationIndex)
        : Number.NaN;
  const clampedIndex = Number.isFinite(numericIndex)
    ? Math.max(0, Math.min(CAMPAIGN_LOCATION_IDS.length - 1, Math.floor(numericIndex)))
    : 0;
  const hasLegacyProgress = started === true || started === 'true' || clampedIndex > 0;
  if (!hasLegacyProgress) return migrateSave(save);
  const completedLocations = CAMPAIGN_LOCATION_IDS.slice(0, clampedIndex);
  const unlockedLocations = CAMPAIGN_LOCATION_IDS.slice(0, clampedIndex + 1);
  return {
    ...migrateSave(save),
    campaign: recoverCampaignProgress({
      ...save.campaign,
      started: true,
      completedLocations: [...save.campaign.completedLocations, ...completedLocations],
      unlockedLocations: [...save.campaign.unlockedLocations, ...unlockedLocations],
    }),
  };
}
