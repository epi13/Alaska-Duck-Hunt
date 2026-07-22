# Bird surface anchoring

Non-flying birds are placed through the semantic scene map, never through a species-specific screen-Y offset. `src/core/birds/bird-placement.ts` is the authoritative compatibility model. It resolves a species, family, state, and semantic surface to a locomotion mode and one required sprite contact: `feet`, `belly`, `waterline`, `branchGrip`, or `concealedBaseline`. Airborne starts use `airborneCenter` only when a caller explicitly enables an airborne wave.

`src/data/bird-sprites.ts` authors normalized contact points inside each state frame. `BirdEntity` uses the resolved point as the Phaser origin, so the sprite contact—not its visual center—is aligned with the scene-map anchor. Development assertions reject incompatible states and surfaces, missing low-branch region ids, missing sprite contacts, and rendered contacts more than two pixels from their mapped anchor.

## Deterministic spawning and flock placement

`createBirdPlan` first enumerates compatible `(surface, initialState)` pairs and makes one seeded selection. It does not select the two independently. The first flock member is the leader. Remaining formation offsets are normalized map-space vectors; `BirdSpawnSystem` adds each vector to the leader anchor and projects that member onto the nearest compatible visible region. A member is omitted when no nearby valid projection exists. No raw vertical screen offset is applied to a grounded flock.

Every placement retains its stable region id, normalized point, perspective depth, display depth, and authored scale. Surface-bound walking or swimming motion is projected back onto that same polygon or path each frame. Resize applies the scene plate's cover transform again to the normalized anchor, keeping the contact correct through desktop, tablet, and mobile crops.

## Landing

A bird scheduled to land enters descent, asks the scene map for the nearest compatible anchor, and approaches that world point. The landing target carries normalized coordinates so resize can relayout it while descent is active. The bird becomes `settled` only at the mapped point and immediately uses the same compatibility and contact rules as an initial spawn. Returning birds follow the same descent path.

## Authoring and verification

When adding a state or sprite:

1. Add its locomotion/surface rule in `bird-placement.ts`.
2. Add the required normalized contact to that state's visual entry in `bird-sprites.ts`.
3. Ensure each behavior profile has at least one compatible surface-state pair and each location map exposes the requested region.
4. Run `npm run validate:assets`; it checks every compatible start and settled-state contact.
5. Use `?debugSceneMap=1` to inspect regions and append development-only `debugBirdSpecies`, `debugBirdSurface`, and `debugBirdState` parameters to isolate a start. DOM telemetry reports the region id, semantic surface, depth, map world point, rendered contact point, and contact error.

The browser suite covers water, forest ground, snow, rocky coast, low branch, and tall-grass concealment, including a mobile resize. Deterministic unit tests cover all six bird families, incompatible starts, missing perch ids, formation projection, and the full contact manifest.
