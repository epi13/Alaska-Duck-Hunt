# Codex Progress

Last updated: 2026-07-22

## Completed work

- Desynchronized all looping bird animations with deterministic per-member start frames and restrained family-specific playback rates while preserving frame-zero authored timing for reveal, alert, pre-takeoff, takeoff, landing, hit, and falling one-shots. Added restart guards, reduced-motion static frames, seeded Alaskan Husky loop phase/rate, live development animation telemetry, pure unit coverage, and multi-flock browser assertions.

- Refactored flock planning so leaders retain shared species, destination/surface, formation, flight profile, direction, and disturbance intent while every member receives a stable `individualVisualSeed`, biological variant, bounded visual treatment, scale, animation phase/rate, pose preference, speed/reaction/glide offsets, local path amplitude, and formation jitter.
- Added species-authentic flock rules: Snow Goose guarantees visible white/blue morph mixing; Willow Ptarmigan stays season-consistent and surface-aware; crane rust staining varies naturally; drake/hen species retain explicit art; and similar-sex geese use adult/juvenile, size, posture, phase, and behavior differences rather than invented sex colors.
- Expanded all 16 production atlases to a fixed two-biological × two-individual-treatment × sixteen-pose budget (64 named frames). Added eleven original hen/female/juvenile keyed masters to replace legacy whole-sheet sex/age modulation, restrained alternate palette treatments without hue shifts, exhaustive atlas-combination validation, deterministic member tests, active-roster telemetry, and multi-flock Playwright captures.
- Added `docs/individual-bird-variation.md` with the leader/member contract, biological rules, asset budget, and seeded browser fixture.

- Replaced the former field-dog artwork with an original, research-informed working Alaskan Husky: a clean binary-alpha 512×512 atlas, sixteen semantically named frames, JSON metadata, preview strip, retained keyed/source master, production prompt, and official-reference license manifest.
- Moved the dog animation contract into typed data and deterministic pure patrol/flush phase functions. The Phaser adapter now aligns an authored paw contact to scene-map paths, preserves seeded cadence, responds to direction changes, uses bound/reaction/watch/run poses for actual flush events, celebrates results, respects authored prop depth, recomputes scale/contact after resize, and substitutes static poses/lift-free motion when reduced motion is active.
- Added Alaskan Husky telemetry, accessible naming, a restrained menu cameo, explicit PWA assets, manifest/asset validation, unit coverage, responsive Playwright assertions, and `docs/alaskan-husky.md`.

- Added an explicit species/family/state/surface/contact compatibility model. Initial state and surface are now selected together; grounded flock offsets are reprojected in normalized scene-map space; unsupported members are reduced rather than floated; and no ordinary wave may begin airborne.
- Authored state-specific feet, belly, waterline, branch-grip, concealed-baseline, and airborne-center contacts in the bird sprite manifest. Surface-bound Phaser sprites align that contact to the mapped point, assert alignment in development, retain their anchor after responsive resize, and report contact telemetry for browser verification.
- Routed descent and return landings to compatible mapped water, ground, shore, rock, snow, or low-branch anchors. Added all-family deterministic tests, asset validation, six representative Playwright surface-contact screenshots, and `docs/bird-surface-anchoring.md`.

- Replaced shared regional prop-coordinate templates with 96 individually authored, stable placements across all twelve backgrounds. Every plant, rock, log, branch, snow element, and shoreline piece names a compatible semantic scene-map region and carries typed layer, perspective, scale, origin, occlusion, wind, bird-relation, and dog-pass metadata.
- Moved prop rendering and responsive layout out of `HuntScene` into `ScenePropSystem`. Prop depth now follows layer and perspective; grounded birds combine state and environmental occlusion for targetability, while birds and the dog move naturally behind or in front of nearby mapped cover.
- Extended `?debugSceneMap=1` with prop anchors, bounds, layer/depth labels, occlusion polygons, invalid-placement diagnostics, and actor/prop depth relationships. Added placement/depth telemetry, pure validation/occlusion tests, six-family Playwright screenshots, and `docs/scene-props.md`.

- Replaced rectangular surface/Y approximations with typed, deterministic semantic scene maps authored against all twelve 1280×720 production plates. Pure geometry supports surface lookup, polygon/path sampling, no-spawn rejection, projection, depth/scale/occlusion metadata, and cover-aware responsive coordinate transforms; Phaser only adapts those results to world coordinates.
- Anchored water, ground, shoreline, river-edge, rocky-coast, and low-branch birds to mapped visible image features. Surface-bound birds reproject while moving and relayout from normalized anchors after resize; the field dog now follows a location-authored curved/segmented corridor instead of a fixed `0.94 × height` line.
- Added `?debugSceneMap=1` visualization for semantic regions, depths, paths, samples, no-spawn polygons, occlusion hooks, and the current selection. Added DOM telemetry for region id, depth, selected world position, dog path, and dog world position, plus unit and Playwright coverage across desktop/mobile cover crops.
- Documented the schema and tracing workflow in `docs/scene-maps.md`; asset validation now validates the checked-in map catalog as well as the twelve source plates.

- Added authored-facing metadata for every bird atlas and a pure facing transform so left- and right-authored sheets both match flight direction. Grounded flock members receive alternating deterministic idle facings, while takeoff, flight, landing, and circling-return states always face their actual motion.
- Replaced generic Y-coordinate starts with deterministic location-specific water, shore, mudflat, marsh, tundra, snow, forest-floor, rocky-coast, river-edge, and low-branch spawn zones. Species preferences, behavior surfaces, and scene-visible surfaces are intersected before planning; alpine now correctly excludes spruce grouse and supports ptarmigan only.
- Matched initial animation states to selected surfaces, preventing swimming/diving poses on dry ground and walking/foraging starts in open water.
- Generated eight original 4×4 regional foreground atlases (128 props total), including four water/shore occluders per atlas; retained keyed sources and prompt records, produced 1024×1024 alpha sheets, and mapped them across all 12 locations.
- Added a fourth waterline/shore depth plane in front of resting birds, while keeping takeoff and airborne birds above it. Added unit coverage for facing, surface-aware starts, habitat intersection, zone compatibility, atlas diversity, and spawn placement.

- Replaced the flight-only bird runtime with a deterministic surface → dog disturbance → alert/reveal → takeoff → species flight → landing/escape state system. Pure planning, transition, targetability, and vectors live in `src/core/birds`; habitat, behavior, scoring, and atlas definitions stay in `src/data`; Phaser adapters live in `src/game/entities` and `src/game/systems`.
- Archived the ten superseded 512×512 flight sheets under `assets/references/current-implemented-bird-sheets` with their original layout contract, manifest, repository provenance, and SHA-256 checksums before runtime replacement.
- Built complete original behavior atlases for all 16 roster species, including the protected Spectacled Eider. Every species has two explicit variants, 32 named frames, a production atlas/JSON pair, and a deliberate four-frame Field Guide preview; crane uses larger logical frames for its conceal/reveal/upright/run sequence.
- Added family-specific starts and motion: dabblers spring from shallow water, divers and sea ducks dive and water-run, geese graze/sentry/run in formations, grouse and ptarmigan make short landing-prone flushes, and crane has a readable upright 2× bonus window before takeoff.
- Added state-specific display origins, scales, depth, occlusion, and ellipse hitboxes; protected Spectacled Eider is fully illustrated, visibly flushes, never awards points, and carries a 1,500-point penalty.
- Added `npm run pack:birds` and expanded asset validation to all 16 atlas dimensions, 32-frame named metadata, required states, preview strips, scene plates, dog sheet, and habitat atlases. Chroma sources and processed alpha sheets remain separate from production outputs.
- Added deterministic behavior tests for seeded flocks, habitat filtering, dabbler/diver differences, upland landing/return, crane reveal, targetability, crane scoring, and protected penalties. Browser telemetry now records surface, initial/current state, dog flush, target state/position, and confirms no generic fallback.
- Added `docs/bird-animation-system.md` and `docs/species-behavior.md`, refreshed architecture/art/pipeline/README documentation, recorded natural-history sources, and verified official conservation/regulatory links on 2026-07-20 with the in-game disclaimer intact.

- Preserved the user-supplied 12-location Alaska scene reference pack under `assets/references`, including all 36 photos, the area-menu reference, README, and source/license CSV.
- Generated twelve original, reference-informed 16-bit Alaska gameplay plates with distinct regional landforms, vegetation, water, weather, and seasonal palettes; retained full-resolution source outputs and emitted 1280×720 production PNGs.
- Generated and keyed the original legacy 16-frame field-dog sheet plus three eight-frame wetland, forest/alpine, and arctic/winter habitat prop atlases; the dog sheet was later superseded by the named Alaskan Husky atlas above.
- Added a data-driven scene-art manifest covering every location, normalized mid/foreground prop placements, responsive cover scaling, a far/near bird depth split, a dog ground route, and periodic dog movement above the foreground plane.
- Added scene-manifest unit coverage, background/dog/habitat dimension validation, live browser telemetry for location/background/layer state, asset-request assertions, and desktop/mobile visual QA.
- Preserved the user-supplied 69-photo, 10-species reference collection by moving it from disposable `dist/assets` to `assets/references`, retaining its category and license manifests.
- Generated ten original 4×4 pixel-art flight sheets with four animation frames across four documented sex, morph, age, or seasonal variants; retained keyed generation sources and produced validated 512×512 transparent gameplay PNGs.
- Added a data-driven bird sprite manifest, deterministic illustrated-species and variant selection, correct directional flipping, per-species display/hitbox tuning, animated Phaser flight, and animated field-guide previews.
- Added Common Goldeneye, Canada Goose, and Snow Goose field-guide records after verifying broad game-bird context against official 2026 USFWS and current ADF&G sources on 2026-07-20; the in-game legal disclaimer and no-fixed-limits policy remain in force.
- Added sprite manifest/unit coverage, PNG dimension validation, live illustrated-spawn and field-guide browser assertions, all-page-error failure handling, and a fix for the optional Phaser physics teardown error found during visual QA.
- Configured Workbox to precache all ten bird sheets and the existing concept art; production now precaches 19 entries (about 5 MB), so installed offline play retains the new artwork.
- Fixed the localhost MIME failure: a project-local `python -m http.server` process was serving raw `src/main.ts`, which Linux labeled `text/vnd.trolltech.linguist`.
- Configured Vite development at `http://localhost:8000` with host enabled, strict port ownership, and no-cache development responses. The correct command is `npm run dev`; transformed `src/main.ts` is now `text/javascript`.
- Added a lifecycle-safe `BrowserInputProvider` that emits normalized absolute aim, trigger down/up, reload, pause, and fullscreen actions through the existing abstract input contract.
- Made mouse/keyboard the automatic controller-free fallback, with one-shot primary-pointer firing, pause/results/menu gating, resize-safe world-coordinate conversion, focus restoration, and listener cleanup across hunt transitions.
- Added development cleanup for stale same-origin service-worker registrations and project/workbox caches.
- Expanded Playwright coverage for Vite MIME responses, console module failures, menu safety, hunt startup, aim, exactly-once firing, pause/resume, resize, keyboard controls, and production loading.
- Hardened hunt restarts and exits so disconnected browser providers and destroyed Phaser instances cannot be reused, and made forbidden MIME/module console messages fail the entire Playwright test lifecycle.
- Diagnosed a second occurrence after the same long-lived terminal relaunched `python -m http.server` as PID 284442. Stopped only that project-local process, restarted Vite on port 8000, added an explicit SVG favicon, and added browser coverage for its successful MIME response.

## Repair files and validation

- Deterministic loop-phase validation: `npm run validate:assets`, `npm run check` (49/49 Vitest assertions), and `npm run test:e2e` (14/14 Chromium) passed on 2026-07-22. Playwright captured the seeded Snow Goose, Mallard, and Spruce Grouse multi-bird flocks and verified live animation key/frame/phase/rate/start-count telemetry without continuous loop restarts. PWA precache remains 86 entries (about 34.1 MiB); the existing non-failing Phaser bundle-size warning remains.
- Deterministic individual-variation validation: `npm run validate:assets`, `npm run check`, and all 14 Chromium e2e tests passed; the e2e suite was split into four grep groups after the execution harness terminated the monolithic command at its per-command runtime ceiling after 9 passing tests. Vitest passed 44/44 assertions. Playwright captured reproducible 1280×720 Snow Goose, Mallard, and Spruce Grouse flocks and asserted unique seeds/scales/phases, both pose/treatment choices, required Snow Goose morph mixing, and byte-identical replay telemetry.
- Browser plugin was unavailable, so repository Playwright provided the required rendered QA. The three flock captures showed no framework overlay or relevant console/page errors. Snow Goose white/blue morphs are visibly mixed; Mallard and Spruce Grouse preserve biological marks while varying pose, phase, treatment, and scale. The final PWA precaches 86 entries (about 33.3 MiB); production bird atlas PNGs total about 9 MiB. The existing non-failing Phaser chunk-size warning remains.
- Image-generation asset workflow: the built-in tool produced eleven new keyed hen/female/juvenile masters on 2026-07-22. Corresponding adult sheets were used only as pose-layout and pixel-scale edit references; species marks followed Cornell Lab identification references recorded in the prompt log. The packer normalizes generated chroma backgrounds, preserves alpha, and applies only a restrained non-hue alternate treatment.

- Alaskan Husky validation: `npm install` audited 474 packages with 0 vulnerabilities; `npm run typecheck`, `npm run lint`, `npm test` (42/42), `npm run validate:assets`, `npm run build`, `npm run test:e2e` (13/13 Chromium), and `npm run check` passed. Production-preview Playwright passed 10/10 applicable flows with three expected development-fixture skips. Workbox precaches 86 entries (about 29.9 MB), explicitly including the production husky atlas, JSON, and preview. The known non-failing Phaser bundle-size warning remains.
- Browser plugin was unavailable, so repository Playwright provided rendered QA at 1280×720 across wetland, forest, tundra, and snow plus 390×844 snow/mobile. The screenshots show the agouti silhouette readable on all four palettes, mapped paw contact, correct left/right flip, and full mobile bounds. An initial opaque montage background and a left-edge mobile clip were found during QA and corrected before final validation.
- Husky fidelity ledger: official Denali references support the final sturdy body, long legs, compact feet, dense coat, working gait, varied agouti markings, and naturally carried tail. The sprite intentionally avoids a show-ring mask, harness/collar, sporting-dog outline, or copied reference pose. Search/flush silhouettes remain larger and simpler than the source photographs for gameplay readability.

- Scene-prop phase validation: `npm install` audited 474 packages with 0 vulnerabilities; `npm run typecheck`, `npm run lint`, `npm test` (32/32), `npm run validate:assets`, `npm run build`, `npm run test:e2e` (10/10 Chromium), and `npm run check` passed. Six 1280×720 Playwright captures cover wetland, forest, coastal, tundra, alpine, and snow layouts; mobile debug QA at 390×844 verifies in-bounds prop, bird, and dog telemetry after cover-crop resize. Browser plugin was unavailable, so repository Playwright was used. The known non-failing Phaser bundle warning remains.

- Semantic scene-map validation: `npm install` audited 474 packages with 0 vulnerabilities; `npm run typecheck`, `npm run lint`, `npm test` (28/28), `npm run validate:assets`, `npm run build`, `npm run test:e2e` (9/9 Chromium), and `npm run check` passed. Workbox precaches 81 entries (about 29.8 MB). Playwright visual QA at 1440×900 and 390×844 used `?debugSceneMap=1`, showed aligned polygons/paths and in-bounds bird/dog telemetry after cover-crop resize, and reported no console or page errors. The Browser plugin was unavailable, so repository Playwright was used.

- Regional habitat/facing validation: `npm run check` passed with 23/23 Vitest assertions; `npm run validate:assets` passed for all 16 bird atlases, 12 scene plates, the then-current dog sheet, three retained legacy habitat sheets, and eight new regional alpha atlases. Development Playwright passed 8/8 and production preview passed 7/7 applicable flows with the development-only MIME assertion skipped.
- Visual QA used Playwright Chromium because the Browser plugin was unavailable. Desktop captures at 1440×900 covered Copper River, Y–K Delta, Aleutian coast, Southeast rainforest, and winter willow; mobile QA used 390×844. All reported four scene layers, no console/page errors, and zero mobile overflow. A first-pass waterline mismatch was fixed by reducing that plane to a thin 12% vertical scale at 72% opacity.
- Accepted concept/final fidelity ledger: mountain/sky flight space, braided or coastal water, irregular foreground cover, water birds, dog corridor, and upright crane remain aligned. Regional vegetation now varies by setting; grounded flocks mix idle facings; flight facings follow actual motion. HUD copy and layout are unchanged. The playable runtime still uses smaller target sprites than the illustrative concept so flock density and hit testing remain practical.

- Bird-behavior phase validation: `npm run validate:assets` passed for 16 atlases/JSON maps/previews, 12 scene plates, the then-current dog sheet, and three habitat atlases. `npm run check` passed with 18/18 Vitest assertions; development Playwright passed 8/8, including explicit touch input and seeded crane reveal-to-flight ordering checks; production Playwright passed 7/7 applicable flows with the development-only MIME check skipped.
- Browser plugin was not available, so repository Playwright was used as required by the frontend testing skill. Desktop QA at 1440×900 showed water/ground flocks, dog-triggered crane and goose flush telemetry, state-aware target coordinates, and airborne wing cycles. Mobile QA at 390×844 showed 16 illustrated guide cards with no horizontal overflow. No application console/page errors occurred; the only messages were headless Chromium WebGL readback performance warnings during screenshots.
- Accepted concept/final fidelity ledger: both retain the Copper River braided-water middle depth, distant snowy mountains, broad sky flight lane, dense foreground reeds/logs, dog search corridor, water birds, and upright crane reveal. The final intentionally adds the playable HUD/reticle, packs more birds into deterministic flocks, and uses the existing three-layer scene plate rather than baking birds or dog into the background.
- Production Workbox precaches 73 entries (about 25.97 MB), including all 16 atlases, metadata, previews, and location art. The known non-failing Phaser chunk-size warning remains.

- Scene-art phase files: `src/data/scene-art.ts`, `src/data/scene-art.test.ts`, `src/game/HuntScene.ts`, `src/main.ts`, `scripts/validate-assets.ts`, `tests/e2e/game.spec.ts`, `assets/generated/`, `assets/references/Alaska_Duck_Hunt_Reference_Pack/`, `public/assets/{scenes,characters,habitat}/`, `docs/art-pipeline.md`, `README.md`, and this progress log.
- `npm run validate:assets`: passed for 10 bird sheets, 12 scene plates, one dog sheet, and three habitat atlases.
- Scene-art validation: `npm run typecheck` and `npm run lint` passed; Vitest passed 10/10 across three files; development Playwright passed 5/5; `npm run check` and the production PWA build passed; production Playwright passed 4/4 applicable tests with one expected development-only MIME test skipped.
- Browser visual QA: Chromium at 1440×900 and 390×844 loaded the Copper River hunt with the correct plate, three declared scene layers, animated dog, four illustrated birds, near/far flight telemetry, and no console or page errors. The original concept/final fidelity ledger retained the open sky lane, distant snowy mountain band, braided-water middle depth, foreground dog corridor, and irregular cover silhouettes while intentionally omitting HUD and characters from the opaque art plate.
- Production Workbox precaches 35 entries (about 21 MB), including all scene plates and animation atlases. The only build note remains Vite's non-failing large Phaser chunk warning.
- Files changed: `vite.config.ts`, `playwright.config.ts`, `src/vite-env.d.ts`, `src/core/input.ts`, `src/game/HuntScene.ts`, `src/main.ts`, `tests/e2e/game.spec.ts`, `README.md`, and this progress log.
- `npm install`: passed; 474 packages audited, 0 vulnerabilities.
- `npm run typecheck`, `npm run lint`, `npm test`: passed; Vitest 7/7.
- `npm run test:e2e`: passed in development, Playwright 5/5 on Chromium.
- `npm run build` and `npm run check`: passed; production PWA emitted to `dist/` (only the known Phaser chunk-size warning remains).
- Production preview: Playwright 4/4 applicable tests passed (1 development-only MIME test skipped); independent Chromium smoke check loaded the menu with no console or page errors.
- Header verification: `/` returned `text/html`; `/src/main.ts` returned `text/javascript`, both with `Cache-Control: no-store` in development.
- Final live-process verification replaced project-local `python -m http.server` PID 278701 with Vite PID 281671 for development testing; both project servers were stopped cleanly after validation.
- Final validation after lifecycle hardening: `npm install`, `npm run typecheck`, `npm run lint`, `npm test` (7/7), `npm run test:e2e` (5/5 development), `npm run build`, production Playwright (4/4 with 1 expected skip), and `npm run check` all passed. The only production smoke warnings were Chromium headless WebGL readback performance messages.
- Follow-up browser validation after the server was relaunched: `/src/main.ts` returned `200 text/javascript`, `/assets/icon.svg` returned `200 image/svg+xml`, Chromium passed 5/5 tests, and `npm run check` passed. Vite was deliberately left running on port 8000 for immediate manual retesting.
- Bird-sprite validation: `npm run validate:assets` passed for all ten 512×512 sheets; Vitest passed 8/8; development Playwright passed 5/5; production Playwright passed 4/4 applicable tests with one expected development-only skip; `npm run check` and the production PWA build passed. Seeded Chromium visual QA rendered four animated birds plus ten guide cards with zero page errors or failed requests.

- Inspected the initial repository, Node/npm/Git toolchain, and GitHub authentication.
- Confirmed a clean `main` branch with only the initial README and MIT license.
- Generated the original full-screen Copper River Delta gameplay art-direction concept.
- Selected TypeScript, Phaser 3, Vite, Vitest, Playwright, ESLint, Prettier, and a static PWA architecture.
- Implemented the playable splash → menu → campaign/modes → briefing → hunt → results flow.
- Added mouse, keyboard and touch-pointer play, reload, pause, fullscreen, scoring, combos, protected-bird penalties, synthesized audio, animated birds and responsive HUD.
- Added deterministic RNG/round plans, scoring, input/controller translation, versioned saves/migration/recovery, and seven unit tests.
- Added twelve habitat records, nine selectable modes, a field guide, settings, achievements/records screens and controller simulator.
- Added offline PWA generation, CI/Pages workflow, asset scripts, screenshots, and the full required documentation set.

## Current architecture

- Phaser provides the responsive playfield; accessible DOM overlays provide menus/settings. Pure strict TypeScript modules under `src/core` own deterministic domain logic.
- Original visual direction: crisp 16-bit-inspired Alaska landscapes, navy/glacial-blue/spruce/lichen/safety-amber palette, clipped-corner HUD panels, and four explicit scene-art planes (background, regional midground, waterline/shore occlusion, and foreground) around state-dependent bird/dog depths. Opaque location plates, transparent regional habitat occluders, and character sheets are mapped in `src/data/scene-art.ts`; Phaser remains the presentation adapter.

## Commands that work

- `node --version` (v22.22.2)
- `npm --version` (10.9.7)
- `git --version` (2.55.0)
- `gh auth status` (authenticated as `epi13`)
- `npm run generate:assets`
- `npm run validate:assets`
- `npm run check`
- `npm run test:e2e`

## Tests that pass

- Vitest: 37 tests passing across 9 files.
- Playwright: 11/11 Chromium development flows, including six semantic surface-contact screenshots and mobile scene-map relayout.

## Known issues

- Phaser remains a large browser bundle (about 343 kB gzip); Vite reports a non-failing chunk-size warning.
- The 16-species gameplay roster is complete; natural-history simplifications and all score/timing values remain fictional game tuning.
- Physical ESP32 Zapper hardware remains under development; BLE/Serial transports are still future adapters. Mouse, keyboard, touch-pointer, gamepad architecture, and the simulated-controller pathway remain available.

## Next steps

- Final Git review, commit, push, and GitHub Pages status check.

## Latest implementation branch

- `fix/valid-surface-state-spawning` — semantic surface-state compatibility, sprite contacts, flock reprojection, and mapped landing anchors.
