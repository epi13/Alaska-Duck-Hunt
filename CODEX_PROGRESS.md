# Codex Progress

Last updated: 2026-07-20

## Completed work

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
- Original visual direction: crisp 16-bit-inspired Alaska landscapes, navy/glacial-blue/spruce/lichen/safety-amber palette, clipped-corner HUD panels, layered parallax and restrained weather effects.

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

- Vitest: 7 tests passing in 1 file.
- Playwright: Chromium startup/navigation/settings and gameplay/manifest/responsive flows configured; targeted browser automation and production screenshots completed.

## Known issues

- Phaser remains a large browser bundle (about 343 kB gzip); Vite reports a non-failing chunk-size warning.
- The field-guide gameplay database is a curated launch subset; regulatory documentation lists the broader annual verification policy.
- Physical ESP32 Zapper hardware remains under development; BLE/Serial transports are still future adapters. Mouse, keyboard, touch-pointer, gamepad architecture, and the simulated-controller pathway remain available.

## Next steps

- Final Git review, commit, push, and GitHub Pages status check.

## Latest implementation commit hash

- `aac61c51739ffea76ecaae47f2ab1e5ef594094a` — feat: add animated Alaska bird sprites
