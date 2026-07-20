export const SAVE_VERSION = 2;

export interface SaveData {
  version: typeof SAVE_VERSION;
  profile: { id: string; name: string };
  campaign: { completedMissions: string[]; unlockedLocations: string[] };
  records: { highScores: Record<string, number>; dailyScores: Record<string, number> };
  stats: { shots: number; validHits: number; misses: number; protectedAvoided: number; bestCombo: number };
  settings: { masterVolume: number; reducedMotion: boolean; screenShake: boolean; sensitivity: number };
}

export function createDefaultSave(id = 'default', name = 'Hunter'): SaveData {
  return {
    version: SAVE_VERSION,
    profile: { id, name },
    campaign: { completedMissions: [], unlockedLocations: ['matsu-wetlands'] },
    records: { highScores: {}, dailyScores: {} },
    stats: { shots: 0, validHits: 0, misses: 0, protectedAvoided: 0, bestCombo: 0 },
    settings: { masterVolume: 0.8, reducedMotion: false, screenShake: true, sensitivity: 1 },
  };
}

export function migrateSave(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return createDefaultSave();
  const input = raw as Record<string, unknown>;
  const base = createDefaultSave();
  const profile = typeof input.profile === 'object' && input.profile ? input.profile as Partial<SaveData['profile']> : {};
  const campaign = typeof input.campaign === 'object' && input.campaign ? input.campaign as Partial<SaveData['campaign']> : {};
  const records = typeof input.records === 'object' && input.records ? input.records as Partial<SaveData['records']> : {};
  const stats = typeof input.stats === 'object' && input.stats ? input.stats as Partial<SaveData['stats']> : {};
  const settings = typeof input.settings === 'object' && input.settings ? input.settings as Partial<SaveData['settings']> : {};
  return {
    ...base,
    profile: { ...base.profile, ...profile },
    campaign: { ...base.campaign, ...campaign },
    records: { ...base.records, ...records },
    stats: { ...base.stats, ...stats },
    settings: { ...base.settings, ...settings },
  };
}

export function parseSave(serialized: string): SaveData {
  try { return migrateSave(JSON.parse(serialized)); } catch { return createDefaultSave(); }
}

export const serializeSave = (save: SaveData): string => JSON.stringify(migrateSave(save));
