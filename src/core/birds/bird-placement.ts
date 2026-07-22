import type { BirdSurface } from './bird-plan';
import { AIRBORNE_STATES, type BirdState } from './bird-state';

export type BirdLocomotion = 'waterborne' | 'ground' | 'perch' | 'concealed' | 'airborne';
export type BirdFamily = 'dabbler' | 'diver' | 'seaDuck' | 'goose' | 'crane' | 'upland';
export type SpriteContactType = 'feet' | 'belly' | 'waterline' | 'branchGrip' | 'concealedBaseline' | 'airborneCenter';

export interface BirdPlacementCompatibility {
  readonly compatible: boolean;
  readonly locomotion: BirdLocomotion;
  readonly contact: SpriteContactType;
  readonly requiresPerchId: boolean;
  readonly reason?: string;
}

const water = new Set<BirdSurface>(['openWater', 'shallowWater']);
const ground = new Set<BirdSurface>(['mudflat', 'shoreline', 'marshGrass', 'tallGrass', 'tundraGround', 'snowGround', 'forestFloor', 'rockyCoast', 'riverEdge']);

export function birdPlacementCompatibility(
  speciesId: string,
  family: BirdFamily,
  state: BirdState,
  surface: BirdSurface,
  allowAirborneStart = false,
): BirdPlacementCompatibility {
  if (AIRBORNE_STATES.has(state) || state === 'escaped') {
    return allowAirborneStart
      ? { compatible: true, locomotion: 'airborne', contact: 'airborneCenter', requiresPerchId: false }
      : incompatible('airborne', 'airborneCenter', 'airborne starts require an explicit airborne wave');
  }
  if (state === 'swimming' || state === 'diving') {
    return water.has(surface)
      ? familyAllows(family, 'waterborne', 'waterline')
      : incompatible('waterborne', 'waterline', `${state} requires mapped open or shallow water`);
  }
  if (state === 'perched') {
    return surface === 'lowBranch' && family === 'upland'
      ? { compatible: true, locomotion: 'perch', contact: 'branchGrip', requiresPerchId: true }
      : incompatible('perch', 'branchGrip', 'perched birds require an upland family and mapped low branch');
  }
  if (state === 'concealed' || state === 'revealing') {
    const compatible = speciesId === 'crane'
      ? ['tallGrass', 'marshGrass'].includes(surface)
      : ['tallGrass', 'marshGrass', 'forestFloor', 'tundraGround', 'snowGround'].includes(surface);
    return compatible
      ? { compatible: true, locomotion: 'concealed', contact: 'concealedBaseline', requiresPerchId: false }
      : incompatible('concealed', 'concealedBaseline', `${speciesId} cannot conceal on ${surface}`);
  }
  if (state === 'walking' || state === 'foraging' || state === 'standingBonus') {
    if (!ground.has(surface)) return incompatible('ground', state === 'foraging' ? 'belly' : 'feet', `${state} requires mapped dry or wet ground`);
    return familyAllows(family, 'ground', state === 'foraging' ? 'belly' : 'feet');
  }
  if (surface === 'lowBranch') {
    return family === 'upland'
      ? { compatible: true, locomotion: 'perch', contact: 'branchGrip', requiresPerchId: true }
      : incompatible('perch', 'branchGrip', `${family} cannot use a low-branch anchor`);
  }
  if (water.has(surface)) return familyAllows(family, 'waterborne', 'waterline');
  if (ground.has(surface)) {
    const contact: SpriteContactType = state === 'alert' || state === 'preTakeoff' ? 'feet' : 'belly';
    return familyAllows(family, 'ground', contact);
  }
  return incompatible('ground', 'feet', `no compatibility rule for ${state} on ${surface}`);
}

export function assertBirdPlacement(
  speciesId: string,
  family: BirdFamily,
  state: BirdState,
  surface: BirdSurface,
  perchId?: string,
  allowAirborneStart = false,
): BirdPlacementCompatibility {
  const result = birdPlacementCompatibility(speciesId, family, state, surface, allowAirborneStart);
  if (!result.compatible) throw new Error(`Invalid bird placement ${speciesId}/${state}/${surface}: ${result.reason}`);
  if (result.requiresPerchId && !perchId) throw new Error(`Invalid bird placement ${speciesId}/${state}/${surface}: missing perch id`);
  return result;
}

function familyAllows(family: BirdFamily, locomotion: Exclude<BirdLocomotion, 'perch' | 'concealed' | 'airborne'>, contact: SpriteContactType): BirdPlacementCompatibility {
  const allowed = locomotion === 'waterborne'
    ? ['dabbler', 'diver', 'seaDuck', 'goose'].includes(family)
    : family !== 'diver';
  return allowed
    ? { compatible: true, locomotion, contact, requiresPerchId: false }
    : incompatible(locomotion, contact, `${family} does not support ${locomotion} locomotion`);
}

function incompatible(locomotion: BirdLocomotion, contact: SpriteContactType, reason: string): BirdPlacementCompatibility {
  return { compatible: false, locomotion, contact, requiresPerchId: false, reason };
}
