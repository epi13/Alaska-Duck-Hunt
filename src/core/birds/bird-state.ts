export const BIRD_STATES = [
  'concealed',
  'resting',
  'foraging',
  'walking',
  'swimming',
  'diving',
  'perched',
  'alert',
  'revealing',
  'standingBonus',
  'preTakeoff',
  'takeoff',
  'flying',
  'distant',
  'banking',
  'climbing',
  'descending',
  'landing',
  'settled',
  'returning',
  'hit',
  'falling',
  'escaped',
] as const;

export type BirdState = (typeof BIRD_STATES)[number];

export type BirdEvent =
  | 'idle-shift'
  | 'disturbed'
  | 'reveal-complete'
  | 'alert-complete'
  | 'anticipation-complete'
  | 'takeoff-complete'
  | 'bank'
  | 'climb'
  | 'descend'
  | 'land'
  | 'settle'
  | 'return'
  | 'hit'
  | 'fall-complete'
  | 'escape';

export interface BirdTransitionRules {
  revealBeforeFlush: boolean;
}

export function transitionBirdState(
  state: BirdState,
  event: BirdEvent,
  rules: BirdTransitionRules,
): BirdState {
  if (event === 'hit') return state === 'concealed' ? state : 'hit';
  if (event === 'fall-complete') return 'escaped';
  if (event === 'escape') return 'escaped';
  if (event === 'disturbed') {
    if (!['concealed', 'resting', 'foraging', 'walking', 'swimming', 'diving', 'perched', 'settled'].includes(state)) {
      return state;
    }
    return rules.revealBeforeFlush && state === 'concealed' ? 'revealing' : 'alert';
  }
  if (event === 'reveal-complete' && state === 'revealing') return 'standingBonus';
  if (event === 'alert-complete' && ['alert', 'standingBonus'].includes(state)) return 'preTakeoff';
  if (event === 'anticipation-complete' && state === 'preTakeoff') return 'takeoff';
  if (event === 'takeoff-complete' && state === 'takeoff') return 'flying';
  if (event === 'bank' && ['flying', 'climbing', 'descending'].includes(state)) return 'banking';
  if (event === 'climb' && ['flying', 'banking'].includes(state)) return 'climbing';
  if (event === 'descend' && ['flying', 'banking', 'climbing', 'returning'].includes(state)) return 'descending';
  if (event === 'land' && ['flying', 'banking', 'descending', 'returning'].includes(state)) return 'landing';
  if (event === 'settle' && state === 'landing') return 'settled';
  if (event === 'return' && ['flying', 'escaped'].includes(state)) return 'returning';
  if (event === 'idle-shift') {
    if (state === 'resting') return 'foraging';
    if (state === 'foraging') return 'walking';
    if (state === 'walking') return 'resting';
    if (state === 'swimming') return 'diving';
    if (state === 'diving') return 'swimming';
  }
  return state;
}

export const AIRBORNE_STATES = new Set<BirdState>([
  'takeoff',
  'flying',
  'distant',
  'banking',
  'climbing',
  'descending',
  'landing',
  'returning',
  'hit',
  'falling',
]);
