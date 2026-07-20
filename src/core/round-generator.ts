import { SeededRandom } from './rng';

export type FlightBehavior =
  | 'straight'
  | 'arc'
  | 'climb'
  | 'dive'
  | 's-turn'
  | 'panic'
  | 'circle'
  | 'wind-drift'
  | 'burst';
export type Weather = 'clear' | 'rain' | 'snow' | 'fog' | 'wind';

export interface RoundSpecies {
  id: string;
  role: 'target' | 'non-target' | 'protected';
  weight: number;
  speed: readonly [number, number];
  behaviors: readonly FlightBehavior[];
}

export interface RoundSettings {
  seed: string;
  durationMs: number;
  difficulty: number;
  species: readonly RoundSpecies[];
  weather?: readonly Weather[];
  maxFlockSize?: number;
}

export interface SpawnPlan {
  id: number;
  atMs: number;
  speciesId: string;
  role: RoundSpecies['role'];
  edge: 'left' | 'right';
  altitude: number;
  speed: number;
  flockSize: number;
  behavior: FlightBehavior;
}

export interface RoundPlan {
  seed: string;
  weather: Weather;
  wind: number;
  visibility: number;
  ammunition: number;
  spawns: SpawnPlan[];
}

export function generateRound(settings: RoundSettings): RoundPlan {
  if (!settings.species.length) throw new Error('A round requires at least one species');
  const difficulty = Math.max(0, Math.min(10, settings.difficulty));
  const rng = new SeededRandom(settings.seed);
  const weather = rng.pick(settings.weather?.length ? settings.weather : (['clear'] as const));
  const interval = Math.max(650, 2_200 - difficulty * 130);
  const count = Math.max(1, Math.floor(settings.durationMs / interval));
  const spawns: SpawnPlan[] = [];
  for (let id = 0; id < count; id += 1) {
    const bird = rng.weighted(settings.species.map((entry) => ({ value: entry, weight: entry.weight })));
    const jitter = rng.int(-Math.floor(interval * 0.25), Math.floor(interval * 0.25));
    spawns.push({
      id,
      atMs: Math.max(0, Math.round((id + 0.5) * interval + jitter)),
      speciesId: bird.id,
      role: bird.role,
      edge: rng.next() < 0.5 ? 'left' : 'right',
      altitude: rng.int(12, 78),
      speed: Math.round((bird.speed[0] + rng.next() * (bird.speed[1] - bird.speed[0])) * (1 + difficulty * 0.045)),
      flockSize: rng.int(1, Math.max(1, settings.maxFlockSize ?? 4)),
      behavior: rng.pick(bird.behaviors),
    });
  }
  return {
    seed: settings.seed,
    weather,
    wind: Number(((rng.next() * 2 - 1) * (2 + difficulty)).toFixed(2)),
    visibility: Number(Math.max(0.35, 1 - (weather === 'fog' ? 0.4 : 0) - difficulty * 0.015).toFixed(2)),
    ammunition: Math.max(3, Math.ceil(count * 1.45)),
    spawns,
  };
}
