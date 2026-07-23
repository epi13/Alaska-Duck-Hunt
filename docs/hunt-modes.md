# Hunt Mode System

Every playable hunt is described by the serializable `RoundConfig` in
`src/core/modes/round-config.ts`. Mode defaults and content-aware configuration
live in `src/data/mode-configs.ts`. Phaser receives a completed configuration and
does not choose a mode, location, duration, target pool, ammunition rule, or
objective on its own.

## Configuration contract

`RoundConfig` records the mode, location id, deterministic seed, timed/endless
rule, ammunition and reload budget, target/non-target/protected pools, flock cap,
spawn cadence, speed multiplier, weather, visibility, scoring, objective, pass
requirements, assists, and the player's selected options. Validation rejects
empty targets and unsafe duration, magazine, flock, cadence, speed, visibility,
or protected-target combinations. Configurations are plain JSON and can be
stored or replayed directly.

## Playable rules

| Mode                     | Runtime rule                                                                                                                               | Result action                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Campaign                 | 75-second location mission; score and accuracy qualification advances the map                                                              | Retry or campaign next area   |
| Classic Hunt             | One 60-second arcade round; eight-hit quota and two reloads                                                                                | Retry or next classic round   |
| Endless Migration        | No timer; cadence and speed escalate; three mistakes end the run                                                                           | Retry same run                |
| Species Challenge        | Selected compatible species is heavily weighted; non-target lookalikes remain possible                                                     | Retry or change settings      |
| Identification Challenge | Target, non-target, and protected roles; 80% identification requirement and severe penalties                                               | Retry or change settings      |
| Time Trial               | Player-selected 30–120 second clock; fast spawn pressure, accuracy and remaining-time bonuses                                              | Retry or change duration      |
| Practice Range           | Configurable location, species, clock, difficulty, weather, flock cap, ammunition, protected birds, and assists; no campaign advancement   | Restart same settings         |
| Daily Seed               | One UTC-date configuration generated from `daily:YYYY-MM-DD`; local result stored by UTC date                                              | Retry same daily challenge    |
| Custom Hunt              | Validated multi-species builder with location, duration, difficulty, weather, ammunition, reloads, flock cap, protected birds, and assists | Restart same settings or edit |

The Classic Hunt rule is intentionally a clearly bounded single arcade round,
not an unimplemented multi-round placeholder. “Next Classic Round” increments
the round index and therefore creates a new deterministic seed while preserving
the selected setup.

## Determinism and dates

All simulation randomness comes from `SeededRandom`. Mode and simulation code
must not call `Math.random()`. Non-daily seeds are derived from the selected
mode, location, targets, duration, and round index unless the caller supplies an
explicit seed. Daily Seed uses the UTC calendar date, not the browser locale or
Alaska local midnight. Two players generating a challenge anywhere in the world
for the same UTC date receive the same configuration.

## Persistence

- `adh-mode-options` in session storage preserves setup choices while navigating
  back through modes and briefings.
- `adh-mode-best-{mode}` stores the best score for each mode.
- `adh-daily-result-YYYY-MM-DD` stores score, shot accuracy, identification
  accuracy, pass state, and seed for the UTC daily challenge.
- The version-3 save under `adh-save` owns Campaign completion, unlocks, best
  location results, and campaign-complete state. Legacy `matsu-wetlands` and
  the former index keys migrate through the same serializer.
- Only a passed location mission unlocks the next canonical Campaign area.
- Continue Campaign selects the highest unlocked incomplete location; completed
  locations remain replayable from the map.
- Practice and Custom results never advance Campaign.

All ammunition, seasons, objectives, limits, and scoring are fictional game
rules and are explicitly labeled as such in the briefing.
