# Bird Animation and Behavior System

The hunt starts birds where Alaska birds actually read best: on open or shallow water, mudflat, shoreline, marsh or tundra ground, forest floor, low branch, rocky coast, or river edge. The retriever is the disturbance source. Proximity schedules a deterministic reaction delay, then each bird advances through its species profile instead of appearing already in flight.

## State flow

The shared flow is `concealed/resting/foraging/swimming/perched → alert → preTakeoff → takeoff → flying → banking/climbing/descending → landing/settled or escaped`. Divers add dive and surface poses. Geese add sentry, threat, and run-up behavior. Upland birds freeze and explode into a short relocation, commonly landing nearby. Sandhill Crane uses the special sequence `concealed → revealing → standingBonus → preTakeoff → takeoff`; only the fully upright ground state receives the 2× scoring multiplier.

`src/core/birds` owns seeded planning, transitions, disturbance timing, targetability, and flight vectors. `src/data/bird-behaviors.ts`, `bird-habitats.ts`, `bird-scoring.ts`, and `bird-sprites.ts` own content. `BirdEntity`, `BirdSpawnSystem`, and `DogFlushSystem` adapt those decisions into Phaser sprites and events. No simulation path calls `Math.random`, and there is no generic bird-art fallback.

## Atlas contract

Each of the 16 species has `public/assets/birds/<species>/atlas.png`, `atlas.json`, and `preview.png`. Normal atlases are 1024×512 with two 4×4 variants and 128-pixel logical frames. The crane atlas is 1536×768 with 192-pixel logical frames. Every JSON file has 32 named frames in `<variant>/<pose>/0` form. Runtime animation maps typed bird states to those names, filters only frames present in that species atlas, and registers Phaser animations once per texture/variant/state.

The Field Guide uses a separate four-frame preview strip derived from the production atlas. It therefore shows an intentional alert/takeoff/flight sequence without exposing a whole sprite sheet. `prefers-reduced-motion` freezes the preview.

## Art provenance and reproduction

The ten superseded 512×512 sheets are preserved with a manifest and SHA-256 checksums in `assets/references/current-implemented-bird-sheets`. New keyed masters live in `assets/generated/bird-atlases/keyed`; processed alpha sheets are retained separately. Run `npm run pack:birds` to normalize source backgrounds, apply the ImageGen chroma-key helper, derive restrained alternate-plumage variants where no second hand-rendered sheet exists, pack atlases, write named metadata, and emit preview strips. Run `npm run validate:assets` afterward.

The prompt family requested original vintage 16-bit pixel art, a strict 4×4 grid, 16 isolated behavior poses, crisp dark outlines, no text or scenery, and a flat `#FF00FF` key. Pose sequences were family-specific: dabblers spring vertically, divers and sea ducks patter across water, geese graze/sentry/run, upland birds freeze/hop/flush, and cranes rise from concealed through upright to running takeoff. Supplied bird photos were used only for species identity and proportions; no copyrighted game art was requested or used.

## Performance and diagnostics

Only atlases eligible for a location are instantiated. Active birds are capped, flocks share a deterministic leader plan with staggered reaction offsets, and hit testing uses a state-specific ellipse rather than a full frame rectangle. Telemetry exposes initial state/surface, dog flushes, transitions, target state, atlas illustration status, and lane information to browser tests. The generated atlases are included in the PWA precache.
