import type {
  BirdPlanProfile,
  BirdSurface,
  FlightProfile,
  Formation,
} from '../core/birds/bird-plan';
import type { BirdState } from '../core/birds/bird-state';
import type { BirdFamily } from '../core/birds/bird-placement';
export type { BirdFamily } from '../core/birds/bird-placement';

export type LocomotionSurface = 'water' | 'ground' | 'shoreline' | 'perch';

export interface BirdBehaviorProfile extends BirdPlanProfile {
  family: BirdFamily;
  locomotion: readonly LocomotionSurface[];
  wingbeatCadence: number;
  glideDurationMs: readonly [number, number];
  takeoffStyle: 'verticalLaunch' | 'shortPatter' | 'longWaterRun' | 'heavyRun' | 'explosiveFlush';
  fieldNotes: {
    start: string;
    feeding: string;
    flush: string;
    flight: string;
    grouping: string;
    special: string;
  };
}

interface FamilyDefaults {
  surfaces: readonly BirdSurface[];
  initialStates: readonly BirdState[];
  flightProfile: FlightProfile;
  speed: readonly [number, number];
  acceleration: number;
  climbRate: readonly [number, number];
  preferredAltitude: readonly [number, number];
  maximumTurnRate: number;
  wingbeatCadence: number;
  glideDurationMs: readonly [number, number];
  flightDurationMs: readonly [number, number];
  reactionDelayMs: readonly [number, number];
  alertDurationMs: readonly [number, number];
  disturbanceRadius: readonly [number, number];
  flockSize: readonly [number, number];
  formation: readonly Formation[];
  formationSpacing: readonly [number, number];
  landingProbability: number;
  returnProbability: number;
  revealBeforeFlush: boolean;
  locomotion: readonly LocomotionSurface[];
  takeoffStyle: BirdBehaviorProfile['takeoffStyle'];
}

type IndividualDefaults = Pick<
  BirdPlanProfile,
  | 'biologicalVariantPolicy'
  | 'individualScale'
  | 'animationRateMultiplier'
  | 'speedOffsetRatio'
  | 'reactionOffsetMs'
  | 'glideTimingOffsetMs'
  | 'localPathOffset'
>;

const individualDefaults: IndividualDefaults = {
  biologicalVariantPolicy: 'independent',
  individualScale: [0.94, 1.06],
  animationRateMultiplier: [0.94, 1.06],
  speedOffsetRatio: [-0.035, 0.035],
  reactionOffsetMs: [-90, 150],
  glideTimingOffsetMs: [-140, 180],
  localPathOffset: [3, 9],
};

const familyDefaults: Record<BirdFamily, FamilyDefaults> = {
  dabbler: {
    surfaces: ['shallowWater', 'mudflat', 'shoreline', 'marshGrass'],
    initialStates: ['swimming', 'foraging', 'resting'],
    flightProfile: 'directFlight',
    speed: [190, 270],
    acceleration: 42,
    climbRate: [95, 145],
    preferredAltitude: [0.24, 0.58],
    maximumTurnRate: 1.7,
    wingbeatCadence: 9,
    glideDurationMs: [250, 620],
    flightDurationMs: [5_200, 8_300],
    reactionDelayMs: [120, 520],
    alertDurationMs: [180, 580],
    disturbanceRadius: [185, 250],
    flockSize: [1, 4],
    formation: ['single', 'pair', 'cluster'],
    formationSpacing: [42, 72],
    landingProbability: 0.12,
    returnProbability: 0.04,
    revealBeforeFlush: false,
    locomotion: ['water', 'ground', 'shoreline'],
    takeoffStyle: 'verticalLaunch',
  },
  diver: {
    surfaces: ['openWater', 'shallowWater', 'riverEdge'],
    initialStates: ['swimming', 'diving', 'resting'],
    flightProfile: 'directFlight',
    speed: [225, 305],
    acceleration: 30,
    climbRate: [70, 110],
    preferredAltitude: [0.2, 0.46],
    maximumTurnRate: 1.1,
    wingbeatCadence: 11,
    glideDurationMs: [180, 420],
    flightDurationMs: [5_600, 8_800],
    reactionDelayMs: [180, 620],
    alertDurationMs: [260, 650],
    disturbanceRadius: [170, 230],
    flockSize: [2, 6],
    formation: ['pair', 'cluster', 'line'],
    formationSpacing: [34, 58],
    landingProbability: 0.08,
    returnProbability: 0.03,
    revealBeforeFlush: false,
    locomotion: ['water'],
    takeoffStyle: 'shortPatter',
  },
  seaDuck: {
    surfaces: ['openWater', 'rockyCoast', 'shoreline'],
    initialStates: ['swimming', 'diving', 'resting'],
    flightProfile: 'lowCoastalFlight',
    speed: [205, 280],
    acceleration: 24,
    climbRate: [58, 92],
    preferredAltitude: [0.16, 0.38],
    maximumTurnRate: 0.9,
    wingbeatCadence: 9,
    glideDurationMs: [220, 540],
    flightDurationMs: [6_200, 9_200],
    reactionDelayMs: [200, 680],
    alertDurationMs: [260, 760],
    disturbanceRadius: [160, 220],
    flockSize: [1, 5],
    formation: ['pair', 'cluster', 'line'],
    formationSpacing: [40, 70],
    landingProbability: 0.08,
    returnProbability: 0.02,
    revealBeforeFlush: false,
    locomotion: ['water', 'shoreline'],
    takeoffStyle: 'shortPatter',
  },
  goose: {
    surfaces: ['marshGrass', 'tundraGround', 'mudflat', 'shallowWater'],
    initialStates: ['foraging', 'walking', 'resting'],
    flightProfile: 'gooseFormationFlight',
    speed: [165, 225],
    acceleration: 18,
    climbRate: [68, 105],
    preferredAltitude: [0.28, 0.62],
    maximumTurnRate: 0.65,
    wingbeatCadence: 6,
    glideDurationMs: [520, 1_100],
    flightDurationMs: [7_200, 11_000],
    reactionDelayMs: [280, 880],
    alertDurationMs: [520, 1_150],
    disturbanceRadius: [210, 300],
    flockSize: [2, 7],
    formation: ['line', 'vee', 'wave'],
    formationSpacing: [58, 92],
    landingProbability: 0.12,
    returnProbability: 0.08,
    revealBeforeFlush: false,
    locomotion: ['ground', 'water', 'shoreline'],
    takeoffStyle: 'heavyRun',
  },
  crane: {
    surfaces: ['tallGrass', 'marshGrass', 'tundraGround'],
    initialStates: ['concealed', 'foraging', 'walking'],
    flightProfile: 'craneFlight',
    speed: [125, 175],
    acceleration: 12,
    climbRate: [54, 82],
    preferredAltitude: [0.32, 0.66],
    maximumTurnRate: 0.42,
    wingbeatCadence: 3,
    glideDurationMs: [900, 1_800],
    flightDurationMs: [8_000, 12_500],
    reactionDelayMs: [420, 920],
    alertDurationMs: [900, 1_450],
    disturbanceRadius: [240, 325],
    flockSize: [1, 3],
    formation: ['single', 'pair', 'line'],
    formationSpacing: [86, 128],
    landingProbability: 0.06,
    returnProbability: 0.02,
    revealBeforeFlush: true,
    locomotion: ['ground', 'shoreline'],
    takeoffStyle: 'heavyRun',
  },
  upland: {
    surfaces: ['forestFloor', 'lowBranch', 'tundraGround', 'snowGround'],
    initialStates: ['concealed', 'foraging', 'walking', 'perched'],
    flightProfile: 'shortFlushFlight',
    speed: [155, 225],
    acceleration: 65,
    climbRate: [105, 155],
    preferredAltitude: [0.48, 0.76],
    maximumTurnRate: 1.25,
    wingbeatCadence: 12,
    glideDurationMs: [320, 740],
    flightDurationMs: [1_600, 3_200],
    reactionDelayMs: [260, 1_350],
    alertDurationMs: [220, 720],
    disturbanceRadius: [125, 205],
    flockSize: [1, 3],
    formation: ['single', 'pair', 'cluster'],
    formationSpacing: [38, 62],
    landingProbability: 0.78,
    returnProbability: 0.34,
    revealBeforeFlush: false,
    locomotion: ['ground', 'perch'],
    takeoffStyle: 'explosiveFlush',
  },
};

const notes = (
  start: string,
  feeding: string,
  flush: string,
  flight: string,
  grouping: string,
  special: string,
): BirdBehaviorProfile['fieldNotes'] => ({ start, feeding, flush, flight, grouping, special });

function profile(
  speciesId: string,
  family: BirdFamily,
  variants: readonly string[],
  fieldNotes: BirdBehaviorProfile['fieldNotes'],
  overrides: Partial<FamilyDefaults & IndividualDefaults & Pick<BirdBehaviorProfile, 'revealDurationMs'>> = {},
): BirdBehaviorProfile {
  return { speciesId, family, variants, ...familyDefaults[family], ...individualDefaults, ...overrides, fieldNotes };
}

export const birdBehaviors: readonly BirdBehaviorProfile[] = [
  profile(
    'mallard',
    'dabbler',
    ['drake', 'hen'],
    notes('Water or marsh edge', 'Dabbles, tips up, preens, and waddles ashore', 'Brief head-up scan then a rapid spring', 'Strong direct flight with moderate turns', 'Singles, pairs, and small mixed flocks', 'No prolonged water runway'),
  ),
  profile(
    'pintail',
    'dabbler',
    ['drake', 'hen'],
    notes('Shallow water, tundra pond, or mudflat', 'Graceful swimming and surface feeding', 'Sudden spring into an elegant climbing turn', 'Fast, high, graceful wheeling', 'Singles, pairs, and small flocks', 'Long neck and pointed tail remain readable'),
    { flightProfile: 'dartingFlight', speed: [225, 300], preferredAltitude: [0.34, 0.68] },
  ),
  profile(
    'wigeon',
    'dabbler',
    ['drake', 'hen'],
    notes('Water, shore, or wet grass', 'Walks and grazes on land; dabbles and dips its head', 'Immediate energetic eruption', 'Rapid irregular course changes', 'Small groups, often mixed with other dabblers', 'Spends unusually meaningful time grazing ashore'),
    { flightProfile: 'dartingFlight', maximumTurnRate: 2.0 },
  ),
  profile(
    'teal',
    'dabbler',
    ['drake', 'hen'],
    notes('Shallow pond, mudflat, or dense marsh edge', 'Quick paddling, dabbling, and mud probing', 'Instant launch directly from water', 'Very fast tight zigzags and abrupt banks', 'Tightly spaced small flocks', 'Smallest and most agile target silhouette'),
    { flightProfile: 'dartingFlight', speed: [270, 350], maximumTurnRate: 2.8, flockSize: [2, 6], formationSpacing: [26, 44] },
  ),
  profile(
    'scaup',
    'diver',
    ['drake', 'hen'],
    notes('Open water or a large tundra lake', 'Rafts tightly and dives frequently', 'Heavy water patter before lift', 'Low, fast, and direct', 'Tight rafts and compact flight groups', 'May synchronize dives'),
    { flightProfile: 'heavyMarineFlight', takeoffStyle: 'longWaterRun' },
  ),
  profile(
    'eider',
    'seaDuck',
    ['drake', 'hen'],
    notes('Marine water, rocky coast, or gravel spit', 'Heavy floating posture with repeated dives', 'Long powerful water run and gradual lift', 'Powerful low coastal flight', 'Loose rafts and lines', 'Heaviest duck takeoff in the roster'),
    { flightProfile: 'heavyMarineFlight', speed: [185, 245], takeoffStyle: 'longWaterRun', alertDurationMs: [600, 980] },
  ),
  profile(
    'harlequin',
    'seaDuck',
    ['drake', 'hen'],
    notes('Fast water, cobble beach, or coastal boulder', 'Dives, nods, and rushes low across rough water', 'Quick compact low launch', 'Rapid shoreline-following flight', 'Pairs and small food-rich groups', 'Much lighter launch than an eider'),
    { speed: [235, 310], maximumTurnRate: 1.45, takeoffStyle: 'shortPatter' },
  ),
  profile(
    'goldeneye',
    'diver',
    ['drake', 'hen'],
    notes('Lake, river, or coastal winter water', 'Active paddling and frequent synchronized dives', 'Short three-to-six-foot water patter', 'Very fast direct flight', 'Small to medium flocks', 'Distinctive whistling-wing cadence'),
    { speed: [260, 335], wingbeatCadence: 12 },
  ),
  profile(
    'goose',
    'goose',
    ['adult', 'juvenile'],
    notes('Tundra wetland, mudflat, shore, or field', 'Grazes and tips in shallow water while sentries watch', 'Sentry alarm spreads before a staggered run', 'Strong lines and V formations', 'Family groups and social flocks', 'Can circle and make a falling-leaf landing'),
    { reactionDelayMs: [200, 620], landingProbability: 0.2, returnProbability: 0.16 },
  ),
  profile(
    'canada-goose',
    'goose',
    ['adult', 'juvenile'],
    notes('Wetland edge, grass, marsh, or open water', 'Grazes, dabbles, walks deliberately, and posts sentries', 'Heavy staggered run with powerful beats', 'Steady V formations and broad turns', 'Families and flocks', 'Threat posture uses an extended neck'),
    { speed: [150, 205], flockSize: [2, 6], formation: ['line', 'vee'] },
  ),
  profile(
    'snow-goose',
    'goose',
    ['white', 'blue'],
    notes('Tundra wetland, delta, marsh, or staging flat', 'Dense grazing groups dig for roots and tubers', 'Disturbance spreads in launch waves', 'Steady wingbeats in wavering lines', 'Family groups inside large flocks', 'White and blue morphs remain visible'),
    { flockSize: [4, 8], formation: ['wave', 'line', 'vee'], reactionDelayMs: [180, 720], biologicalVariantPolicy: 'mixed-required' },
  ),
  profile(
    'brant',
    'goose',
    ['adult', 'juvenile'],
    notes('Lagoon, saltmarsh, mudflat, or shallow marine water', 'Grazes eelgrass and tips in shallow water', 'Skittish compression followed by a rapid low launch', 'Low swarm-like coastal movement', 'Tight social groups', 'Less orderly than Canada Goose formations'),
    { flightProfile: 'lowCoastalFlight', speed: [205, 270], maximumTurnRate: 1.3, formation: ['cluster', 'wave'] },
  ),
  profile(
    'crane',
    'crane',
    ['gray-adult', 'rust-stained'],
    notes('Tall wet meadow, marsh edge, or river flat', 'Walks slowly and probes with its bill', 'Raises its neck, stands briefly, then runs into broad wingbeats', 'Slow deep beats with long glides', 'Singles, pairs, and family lines', 'Fully upright ground state carries a 2× bonus'),
    { revealDurationMs: [1_250, 2_100] },
  ),
  profile(
    'grouse',
    'upland',
    ['male', 'female'],
    notes('Forest floor, dirt path, or low branch', 'Walks quietly, pecks, pauses, and feeds on needles', 'Freezes, crouches, then explodes into a short climb', 'Rapid flutter followed by a short glide', 'Usually single; occasional small autumn groups', 'Often lands nearby and may return after danger fades'),
    { surfaces: ['forestFloor', 'lowBranch'], flightProfile: 'localRelocation', returnProbability: 0.46 },
  ),
  profile(
    'ptarmigan',
    'upland',
    ['summer', 'winter'],
    notes('Willow scrub, tundra ground, snow, or low shrub edge', 'Walks slowly and deliberately while pecking buds and berries', 'Low explosive burst from camouflage', 'Brief low flap-and-glide path', 'Singles, families, and small seasonal groups', 'Usually settles behind nearby willow, rock, or snow cover'),
    { surfaces: ['tundraGround', 'snowGround', 'marshGrass'], flightProfile: 'shortFlushFlight', landingProbability: 0.84, biologicalVariantPolicy: 'flock-consistent' },
  ),
  profile(
    'spectacled',
    'seaDuck',
    ['drake', 'hen'],
    notes('Marshy tundra pond, sedge island, or coastal water', 'Dabbles in shallow breeding water and dives in marine groups', 'Eider-like water run with tighter group signaling', 'Strong low marine group flight', 'Close groups and seasonal marine flocks', 'Protected identification bird; never awards target points'),
    { surfaces: ['openWater', 'shallowWater', 'marshGrass'], flightProfile: 'heavyMarineFlight', speed: [200, 260], flockSize: [2, 5], alertDurationMs: [420, 820], takeoffStyle: 'longWaterRun' },
  ),
];

export const birdBehaviorBySpecies = new Map(
  birdBehaviors.map((entry) => [entry.speciesId, entry] as const),
);
