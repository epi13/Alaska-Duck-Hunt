# Codex Progress

Last updated: 2026-07-20

## Completed work

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

- `1bac352080401b273d32b4a7a1b12c1d3905b109` — fix: add favicon and verify Vite assets
