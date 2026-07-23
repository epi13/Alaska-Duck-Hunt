# Game Design

Alaska Duck Hunt is an original, mild, non-graphic arcade hunting game inspired by the broad light-gun genre. It uses no Nintendo code, art, characters, audio, dialogue, logos, fonts, or interface assets. Real birds and habitats are represented for identification and conservation awareness; game limits and scoring are fictional.

## Core loop

Read the briefing, identify valid targets, aim, fire, reload, avoid protected and non-target birds, then meet the objective before time or ammunition expires. Clean hits, reaction time, distance, accuracy, species difficulty, flock sequences, and combos raise score. Misses and invalid targets reduce score or end objectives. Hit feedback is limited to flashes, loose feathers, and tumbling silhouettes without blood or gore.

## Modes

1. **Campaign** — unlock twelve locations through objectives, identification lessons, storms, and migration finales.
2. **Classic Hunt** — short waves with a target-hit threshold.
3. **Endless Migration** — escalating waves until the failure meter fills.
4. **Species Challenge** — engage the named species and reject lookalikes.
5. **Identification Challenge** — identify a bird before or during engagement.
6. **Time Trial** — maximize score before the clock expires.
7. **Practice Range** — configure pool, speed, flock, weather, ammunition, paths, assist, and game speed.
8. **Daily Seed** — a deterministic UTC-date challenge with a local best.
9. **Custom Hunt** — select location, pool, weather, time, difficulty, ammunition, and length.

Every mode has an explicit completion or failure condition, results summary, retry, and exit path.
The implemented runtime rules and persistence keys are documented in
[`hunt-modes.md`](hunt-modes.md).

## Campaign route

The campaign introduces mechanics in an authored order while rounds remain seeded:

| Chapter | Location                     | Primary lesson                            |
| ------- | ---------------------------- | ----------------------------------------- |
| 1       | Mat-Su Valley wetlands       | Aim, fire, reload, valid targets          |
| 2       | Cook Inlet coastal marsh     | Tide-side wind and lookalikes             |
| 3       | River flats during migration | Flocks and lead timing                    |
| 4       | Interior boreal forest       | Obstruction and flushing birds            |
| 5       | Snow-covered willow country  | Snow visibility and grouse identification |
| 6       | Tundra lake country          | Mixed waterfowl pools                     |
| 7       | Yukon-Kuskokwim Delta        | Long formations and strict target calls   |
| 8       | Copper River Delta           | Rain, gusts, and coastal migration        |
| 9       | Southeast rainforest estuary | Low light and heavy rain                  |
| 10      | Alpine ptarmigan country     | Burst flight and seasonal plumage         |
| 11      | Arctic coastal plain         | Fog, glare, and distant silhouettes       |
| 12      | Aleutian shoreline           | Finale: crosswinds and a multi-wave storm |

Each chapter includes three standard hunts and a mastery hunt. Stars come from objective completion, accuracy, and protected-bird avoidance. Progress never requires a perfect score; assist settings do not block advancement.

## Location direction

Each location has a distinct palette, ambient layer, procedural prop set, foreground occlusion, and visibility modifier. Background, middle ground, play plane, and foreground scroll separately. Time and season are palette transforms supported by bespoke accent tiles. Water locations animate reflections and reeds; snow locations use drifting and accumulation illusions; forest locations animate canopy and brush.

## Progression

Unlocks include locations, modes, reticles, field-guide discoveries, and achievement badges. Mastery tracks locations and species without consumable currencies. Records store scores, accuracy, combos, avoidance, and mode-specific results. There are no advertisements, purchases, loot boxes, or mandatory accounts.

## Tutorial

The tutorial pauses between short lessons: pointer/keyboard aim, fire, reload, read target card, reject a protected lookalike, understand score feedback, then complete a miniature round. It can be replayed or skipped and adapts prompts to the active input provider.
