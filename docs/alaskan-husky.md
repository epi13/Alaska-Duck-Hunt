# Alaskan Husky character pipeline

The field companion is an original working Alaskan Husky, not a standardized show-breed depiction. The art brief uses official Denali working-dog descriptions: a sturdy freight-capable body, long legs, strong shoulders, large compact paws, dense coat, naturally carried bushy tail, and intentionally varied working-dog character. The research files, source URLs, credits, and usage terms are recorded in `assets/references/Alaskan_Husky_Working_Dog`; the complete generation prompt and processing record live in `assets/generated/characters/alaska-husky`.

## Production format

`public/assets/characters/alaska-husky/atlas.png` is a 512×512 transparent sheet containing sixteen 128×128 frames. `atlas.json` assigns semantic frame names and records the canonical right-facing direction and normalized paw contact `(0.5, 0.875)`. `preview.png` is a four-pose reference strip. Runtime paths and animation groups are typed in `src/data/husky-sprites.ts`; no numeric-frame contract remains in the Phaser system.

The atlas supplies idle, sniff, search walk, search trot, run, slow cautious approach, alert, look-to-cover, bound, flush reaction, stop/watch, celebration, and a dedicated turn pose. Search walk, trot, and run have two-frame gait cycles. Carry/retrieve is absent because the game currently has no retrieval mechanic; add it only together with real gameplay state and validation.

## Runtime contract

`DogFlushSystem` is a presentation adapter over deterministic phase functions in `src/core/dog/husky-motion.ts`. A seeded phase offset varies the patrol cadence without changing the mapped patrol path. Direction changes use the dedicated turn pose and mirror the right-authored atlas only when movement heads left. A flush produces bound → reaction → watch → run, while round completion requests the celebration pose.

The sprite origin is the authored paw contact, so `SceneMapSystem.toWorld()` places that point—not the frame center—on the selected dog path. Resize recomputes the world point and cover scale. `ScenePropSystem` still resolves whether the dog passes behind or in front of nearby authored vegetation. Reduced-motion mode selects static first frames and removes the bound lift without changing path motion or gameplay disturbance distance.

Browser telemetry on `#aim-layer` exposes character id, animation state, named frame, facing, flip, mapped/contact world Y, contact error, scale, path, depth, and prop relationship. Asset validation checks the source/reference chain, alpha atlas, dimensions, metadata, semantic frames, preview, and manifest agreement. Workbox explicitly includes all three production files for offline play.

## Authoring updates

1. Update the research/license manifest and art brief before changing visual identity.
2. Retain a keyed source master; never paint over an existing proprietary dog or game character.
3. Isolate each cell, remove chroma and isolated components, nearest-neighbor scale, normalize grounded paws to the contact baseline, constrain the opaque palette, and emit binary alpha.
4. Name frames in `atlas.json`, then update the typed manifest rather than addressing cells numerically.
5. Run `npm run validate:assets`, unit tests, and responsive Playwright coverage. Visually verify snow, tundra, wetland, and forest contrast; mapped paw contact; facing; cover depth; and reduced motion.
