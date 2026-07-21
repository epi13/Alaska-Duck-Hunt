export const BIRD_VARIANTS = ['primary', 'female', 'seasonal', 'winter'] as const;

export type BirdVariant = (typeof BIRD_VARIANTS)[number];

export interface BirdSpriteDefinition {
  speciesId: string;
  textureKey: string;
  path: string;
  variants: readonly [string, string, string, string];
  displayScale: number;
  hitRadius: number;
}

export const birdSprites: readonly BirdSpriteDefinition[] = [
  {
    speciesId: 'ptarmigan',
    textureKey: 'bird-ptarmigan',
    path: 'assets/birds/ptarmigan.png',
    variants: ['male summer', 'female summer', 'male winter', 'female winter'],
    displayScale: 0.78,
    hitRadius: 39,
  },
  {
    speciesId: 'grouse',
    textureKey: 'bird-grouse',
    path: 'assets/birds/grouse.png',
    variants: ['male', 'female', 'male cold-season', 'female cold-season'],
    displayScale: 0.78,
    hitRadius: 39,
  },
  {
    speciesId: 'mallard',
    textureKey: 'bird-mallard',
    path: 'assets/birds/mallard.png',
    variants: ['breeding drake', 'hen', 'eclipse drake', 'winter hen'],
    displayScale: 0.82,
    hitRadius: 40,
  },
  {
    speciesId: 'pintail',
    textureKey: 'bird-pintail',
    path: 'assets/birds/pintail.png',
    variants: ['breeding drake', 'hen', 'summer drake', 'winter drake'],
    displayScale: 0.86,
    hitRadius: 42,
  },
  {
    speciesId: 'goldeneye',
    textureKey: 'bird-goldeneye',
    path: 'assets/birds/goldeneye.png',
    variants: ['breeding drake', 'female', 'summer male', 'winter female'],
    displayScale: 0.78,
    hitRadius: 38,
  },
  {
    speciesId: 'harlequin',
    textureKey: 'bird-harlequin',
    path: 'assets/birds/harlequin.png',
    variants: ['breeding drake', 'female', 'summer female', 'winter drake'],
    displayScale: 0.75,
    hitRadius: 37,
  },
  {
    speciesId: 'canada-goose',
    textureKey: 'bird-canada-goose',
    path: 'assets/birds/canada-goose.png',
    variants: ['large adult', 'smaller adult', 'warm-season adult', 'cold-season adult'],
    displayScale: 0.92,
    hitRadius: 46,
  },
  {
    speciesId: 'snow-goose',
    textureKey: 'bird-snow-goose',
    path: 'assets/birds/snow-goose.png',
    variants: ['white morph', 'blue morph', 'smaller white morph', 'juvenile'],
    displayScale: 0.9,
    hitRadius: 45,
  },
  {
    speciesId: 'brant',
    textureKey: 'bird-brant',
    path: 'assets/birds/brant.png',
    variants: ['dark adult', 'smaller adult', 'warm-season adult', 'cold-season adult'],
    displayScale: 0.86,
    hitRadius: 43,
  },
  {
    speciesId: 'crane',
    textureKey: 'bird-crane',
    path: 'assets/birds/crane.png',
    variants: ['gray adult', 'rust-stained adult', 'smaller adult', 'winter-gray adult'],
    displayScale: 1.05,
    hitRadius: 50,
  },
];

export const birdSpriteBySpecies = new Map(
  birdSprites.map((definition) => [definition.speciesId, definition] as const),
);
