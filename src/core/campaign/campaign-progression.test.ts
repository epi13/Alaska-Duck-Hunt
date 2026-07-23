import { describe, expect, it } from 'vitest';
import type { RoundResultStats } from '../modes/round-config';
import { createDefaultSave, parseSave, serializeSave } from '../save';
import { campaignMissions } from '../../data/campaign-missions';
import {
  applyCampaignResult,
  campaignCurrentLocation,
  canPlayCampaignLocation,
  CAMPAIGN_LOCATION_IDS,
  createDefaultCampaignProgress,
  recoverCampaignProgress,
} from './campaign-progression';

const passingResult: RoundResultStats = {
  score: 10_000,
  hits: 20,
  shots: 20,
  accuracy: 100,
  identificationAccuracy: 100,
  protectedHits: 0,
  nonTargetHits: 0,
  misses: 0,
  elapsedSeconds: 30,
};

function completeThrough(count: number) {
  let progress = createDefaultCampaignProgress();
  for (const id of CAMPAIGN_LOCATION_IDS.slice(0, count))
    progress = applyCampaignResult(campaignMissions, progress, id, passingResult).progress;
  return progress;
}

describe('campaign progression', () => {
  it('defines one ordered fictional mission for every canonical location', () => {
    expect(campaignMissions.map(({ locationId }) => locationId)).toEqual(
      CAMPAIGN_LOCATION_IDS,
    );
    expect(campaignMissions.every(({ objective }) => objective.length > 20)).toBe(true);
  });

  it('unlocks only the first area for a new save', () => {
    const progress = createDefaultSave().campaign;
    expect(progress.unlockedLocations).toEqual(['matsu']);
    expect(progress.completedLocations).toEqual([]);
    expect(canPlayCampaignLocation(progress, 'cook')).toBe(false);
  });

  it('completes areas one through three sequentially', () => {
    const progress = completeThrough(3);
    expect(progress.completedLocations).toEqual(['matsu', 'cook', 'copper']);
    expect(campaignCurrentLocation(progress)).toBe('yk');
  });

  it('completing area four unlocks area five and survives reload', () => {
    const result = applyCampaignResult(campaignMissions, completeThrough(3), 'yk', passingResult);
    expect(result.evaluation.passed).toBe(true);
    expect(result.newlyUnlockedLocation).toBe('interior');
    expect(canPlayCampaignLocation(result.progress, 'interior')).toBe(true);

    const save = createDefaultSave();
    const reloaded = parseSave(
      serializeSave({ ...save, campaign: result.progress }),
    );
    expect(canPlayCampaignLocation(reloaded.campaign, 'interior')).toBe(true);
    expect(campaignCurrentLocation(reloaded.campaign)).toBe('interior');
  });

  it('does not unlock area five when the fourth mission fails', () => {
    const result = applyCampaignResult(campaignMissions, completeThrough(3), 'yk', {
        ...passingResult,
        score: 100,
        hits: 1,
        accuracy: 20,
        identificationAccuracy: 25,
      });
    expect(result.evaluation.passed).toBe(false);
    expect(result.evaluation.failures).toContain('1,050 score');
    expect(canPlayCampaignLocation(result.progress, 'interior')).toBe(false);
  });

  it('keeps completed locations replayable', () => {
    const progress = completeThrough(4);
    expect(canPlayCampaignLocation(progress, 'matsu')).toBe(true);
    expect(canPlayCampaignLocation(progress, 'yk')).toBe(true);
  });

  it('migrates legacy Mat-Su ids without discarding progress', () => {
    const progress = recoverCampaignProgress({
      started: true,
      completedMissions: ['matsu-wetlands'],
      unlockedLocations: ['matsu-wetlands', 'cook'],
    });
    expect(progress.completedLocations).toEqual(['matsu']);
    expect(progress.unlockedLocations).toEqual(['matsu', 'cook']);
  });

  it('unlocks all twelve locations sequentially and completes the finale safely', () => {
    let progress = createDefaultCampaignProgress();
    for (const [index, id] of CAMPAIGN_LOCATION_IDS.entries()) {
      const result = applyCampaignResult(campaignMissions, progress, id, passingResult);
      progress = result.progress;
      expect(progress.completedLocations).toHaveLength(index + 1);
    }
    expect(progress.unlockedLocations).toEqual(CAMPAIGN_LOCATION_IDS);
    expect(progress.campaignComplete).toBe(true);
    expect(campaignCurrentLocation(progress)).toBeUndefined();
  });

  it('recovers safely from invalid campaign data', () => {
    expect(recoverCampaignProgress(null)).toEqual(createDefaultCampaignProgress());
    expect(
      recoverCampaignProgress({
        completedLocations: [null, 'unknown'],
        unlockedLocations: 'everything',
        bestResults: { unknown: { score: Number.NaN } },
      }),
    ).toEqual(createDefaultCampaignProgress());
  });

  it('chooses the highest unlocked incomplete area for Continue Campaign', () => {
    const progress = recoverCampaignProgress({
      started: true,
      completedLocations: ['matsu', 'cook'],
      unlockedLocations: ['matsu', 'cook', 'copper', 'yk'],
    });
    expect(campaignCurrentLocation(progress)).toBe('yk');
  });
});
