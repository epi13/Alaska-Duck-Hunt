# Codex Progress

Last updated: 2026-07-20

## Completed work

- Preserved the user-supplied 12-location Alaska scene reference pack under `assets/references`, including all 36 photos, the area-menu reference, README, and source/license CSV.
- Generated twelve original, reference-informed 16-bit Alaska gameplay plates with distinct regional landforms, vegetation, water, weather, and seasonal palettes; retained full-resolution source outputs and emitted 1280×720 production PNGs.
- Generated and keyed an original 16-frame Alaska field-retriever sheet (run, search, bound, retrieve/celebrate) plus three eight-frame wetland, forest/alpine, and arctic/winter habitat prop atlases.
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
- Original visual direction: crisp 16-bit-inspired Alaska landscapes, navy/glacial-blue/spruce/lichen/safety-amber palette, clipped-corner HUD panels, and three playable depth planes. Opaque location plates, transparent habitat occluders, and character sheets are mapped in `src/data/scene-art.ts`; Phaser remains the presentation adapter.

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

- Vitest: 10 tests passing across 3 files.
- Playwright: Chromium startup/navigation/settings and gameplay/manifest/responsive flows configured; targeted browser automation and production screenshots completed.

## Known issues

- Phaser remains a large browser bundle (about 343 kB gzip); Vite reports a non-failing chunk-size warning.
- The field-guide gameplay database is a curated launch subset; regulatory documentation lists the broader annual verification policy.
- Physical ESP32 Zapper hardware remains under development; BLE/Serial transports are still future adapters. Mouse, keyboard, touch-pointer, gamepad architecture, and the simulated-controller pathway remain available.

## Next steps

- Final Git review, commit, push, and GitHub Pages status check.

## Latest implementation commit hash

- `aac61c51739ffea76ecaae47f2ab1e5ef594094a` — feat: add animated Alaska bird sprites
