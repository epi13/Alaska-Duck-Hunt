# Architecture

Alaska Duck Hunt is designed as a static, offline-capable TypeScript application. Phaser owns the real-time canvas, while DOM overlays provide accessible menus and forms. No server is required for gameplay or progression.

## Runtime boundaries

- `data`: immutable species, habitat, campaign, achievement, and citation records.
- `systems`: deterministic round generation, scoring, progression, saves, audio, and input.
- `game`: Phaser scenes, pooled entities, collisions, particles, and presentation.
- `ui`: screen flow and accessible HTML controls.
- `platform`: storage, PWA lifecycle, fullscreen, and optional controller transports.

The simulation receives a seed and a serializable `RoundConfig`. It must not read wall-clock time after configuration is created. Presentation may interpolate, but simulation state advances on a fixed step. Random choices use an injected generator; direct `Math.random()` calls are prohibited in simulation code.

`src/core/modes/round-config.ts` owns the JSON-safe contract, validation, and
pass/fail evaluation. `src/data/mode-configs.ts` owns the nine data-driven mode
profiles and is the only layer that converts content and player options into a
complete round. `HuntScene` and `BirdSpawnSystem` consume that result as Phaser
presentation adapters.

## Scene and application flow

`boot -> splash -> profile -> menu -> mode/location -> briefing -> hunt -> results -> progression`

Pause is an overlay state rather than a separate simulation. Field guide, settings, records, credits, controller setup, offline status, and legal information are reachable from the main menu. First launch inserts the tutorial before the first briefing.

## Persistence

The versioned save envelope contains schema version, profiles, shared settings, and integrity metadata. Reads validate and migrate one version at a time. A malformed save is retained as a recovery copy before safe defaults are created. Import validates before replacing active data; export contains no credentials or remote identifiers.

## Performance contract

Birds, projectiles, feathers, and weather particles are pooled. Broad-phase collision uses spatial buckets. Texture atlases and audio buffers preload per location, and quality tiers cap particles and parallax layers. Visibility loss pauses simulation and releases sustained audio. Gameplay-loop allocations are avoided.

## Future-safe input

Gameplay consumes semantic actions (`aim`, `fire`, `reload`, `pause`, `confirm`) from providers. Keyboard/mouse, touch, gamepad, simulated Zapper, BLE, and Web Serial adapters normalize into the same timestamped event stream. Transport code never calls scene methods directly.

## Bird behavior boundary

`src/core/birds` contains pure transition, disturbance, flock-plan, and flight-vector functions; `src/core/dog` contains deterministic Alaskan Husky patrol/flush animation phases. Species profiles, habitat affinities, scoring, and sprite manifests remain immutable data under `src/data`. `BirdEntity`, `BirdSpawnSystem`, and `DogFlushSystem` are presentation adapters: they translate deterministic plans into Phaser animation, mapped contact, depth, input hitboxes, and telemetry. The runtime throws on a missing character atlas and never substitutes generic geometry.
