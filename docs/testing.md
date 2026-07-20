# Testing

The release gate runs formatting checks, lint, strict typecheck, unit tests, production build, and Playwright tests against the production preview.

Unit coverage includes seeded RNG vectors, round reproduction, scoring/combo/accuracy, difficulty, spawn selection, habitat and species filters, protected-target exclusion, penalties, unlocks, save serialization/migration/corruption recovery, bindings, settings, and controller translation.

Browser coverage includes startup, first-run navigation, hunt start, mouse fire, keyboard aim/fire, reload, pause/resume, round completion/results, settings persistence, save export/import validation, phone portrait, phone landscape, desktop, TV viewport, manifest discovery, service-worker registration, and offline restart where supported.

Visual checks capture stable seeded scenes at representative viewports. Tests fail on uncaught errors, missing textures, rejected audio promises, invalid buttons, horizontal overflow, or inaccessible focus traps. Performance sampling records frame time and active/pool counts during a dense storm round; budgets should be documented with measured target hardware rather than assumed.

