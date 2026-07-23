import type { CampaignMission } from '../core/campaign/campaign-progression';
import type { PassRequirements } from '../core/modes/round-config';

const requirements = (
  minScore: number,
  minHits: number,
  minAccuracy: number,
  minIdentificationAccuracy: number,
): PassRequirements => ({
  minScore,
  minHits,
  minAccuracy,
  minIdentificationAccuracy,
  maxProtectedHits: 0,
});

export const campaignMissions: readonly CampaignMission[] = [
  {
    locationId: 'matsu',
    title: 'Wetland Orientation',
    objective: 'Score 600, make 3 target hits, and finish with 30% shot accuracy.',
    requirements: requirements(600, 3, 30, 0),
  },
  {
    locationId: 'cook',
    title: 'Tidal Crossing',
    objective: 'Score 750, make 4 target hits, and finish with 35% shot accuracy.',
    requirements: requirements(750, 4, 35, 0),
  },
  {
    locationId: 'copper',
    title: 'Delta Weather',
    objective:
      'Score 900, make 4 target hits, reach 40% shot accuracy, and avoid protected birds.',
    requirements: requirements(900, 4, 40, 0),
  },
  {
    locationId: 'yk',
    title: 'Identification Line',
    objective:
      'Score 1,050, make 5 target hits, reach 45% shot and 55% identification accuracy.',
    requirements: requirements(1_050, 5, 45, 55),
  },
  {
    locationId: 'interior',
    title: 'Boreal Openings',
    objective:
      'Score 1,100, make 5 target hits, reach 45% shot and 55% identification accuracy.',
    requirements: requirements(1_100, 5, 45, 55),
  },
  {
    locationId: 'arctic',
    title: 'Coastal Plain',
    objective:
      'Score 1,200, make 5 target hits, reach 50% shot and 65% identification accuracy.',
    requirements: requirements(1_200, 5, 50, 65),
  },
  {
    locationId: 'aleutian',
    title: 'Squall Passage',
    objective:
      'Score 1,300, make 6 target hits, reach 50% shot and 65% identification accuracy.',
    requirements: requirements(1_300, 6, 50, 65),
  },
  {
    locationId: 'southeast',
    title: 'Rainforest Estuary',
    objective:
      'Score 1,350, make 6 target hits, reach 55% shot and 65% identification accuracy.',
    requirements: requirements(1_350, 6, 55, 65),
  },
  {
    locationId: 'tundra',
    title: 'Lake Country',
    objective:
      'Score 1,450, make 7 target hits, reach 55% shot and 70% identification accuracy.',
    requirements: requirements(1_450, 7, 55, 70),
  },
  {
    locationId: 'alpine',
    title: 'High Country',
    objective:
      'Score 1,500, make 7 target hits, reach 60% shot and 70% identification accuracy.',
    requirements: requirements(1_500, 7, 60, 70),
  },
  {
    locationId: 'willow',
    title: 'Winter Willow',
    objective:
      'Score 1,600, make 8 target hits, reach 60% shot and 75% identification accuracy.',
    requirements: requirements(1_600, 8, 60, 75),
  },
  {
    locationId: 'river',
    title: 'Migration Finale',
    objective:
      'Score 1,800, make 8 target hits, reach 65% shot and 75% identification accuracy.',
    requirements: requirements(1_800, 8, 65, 75),
  },
];
