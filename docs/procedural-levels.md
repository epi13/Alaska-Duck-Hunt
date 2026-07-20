# Procedural Levels

A round is reproduced by `seed + contentVersion + RoundConfig`. The generator uses named random streams for environment, spawns, paths, objectives, and bonuses so presentation-only changes do not reorder gameplay choices.

Generation order is: validate configuration, choose environment variation, construct eligible target/non-target/protected pools, create objective, allocate spawn windows, choose formations and entry edges, generate spline/control points, apply wind and difficulty transforms, then validate reachability and ammunition budget.

Supported paths include straight crossing, gentle arc, climb, dive, S-turn, panic turn, circling, flock separation, wind drift, sudden acceleration, low marsh flight, high migration, flushing upland flight, and ptarmigan burst flight. Difficulty scales reaction window, speed, path complexity, visibility, flock ambiguity, and ammunition pressure without changing input sensitivity.

Validation rejects impossible rounds, overlapping protected-target silhouettes at beginner difficulty, empty pools, insufficient ammunition, and spawns hidden for their full lifetime. Daily Seed derives a locale-independent `YYYY-MM-DD` seed and records the content version so later data changes are transparent.

Developer mode may display seed, streams, hitboxes, paths, object counts, and frame timing; override weather, wind, speed, and species; skip rounds; simulate scores/controller events; and reset procedural state. It is off by default and enabled by a documented development flag.

