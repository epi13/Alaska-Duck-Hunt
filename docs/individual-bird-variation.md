# Deterministic bird individuality

Flock planning separates shared intent from per-bird appearance and response. The leader owns species, compatible start surface/state, formation, flight profile, direction, broad timing, landing/return intent, and disturbance context. Every member gets a stable `individualVisualSeed` plus its own biological variant, individual visual treatment, scale, animation phase/rate, pose preference, speed offset, reaction offset, glide timing, local path amplitude, and formation jitter.

The same round seed reproduces the complete member roster. Individual random streams are forked by flock seed and member index so adding presentation logic does not make one bird consume another bird’s values. Scale and animation rate use four deterministic strata within the species-safe limits; adjacent members therefore do not collapse onto the same scale/rate bin.

## Biological rules

- Drake/hen artwork remains explicit for Mallard, Northern Pintail, American Wigeon, Green-winged Teal, Greater Scaup, Common Eider, Harlequin, Common Goldeneye, and Spectacled Eider.
- Snow Goose uses a `mixed-required` rule: a flock of at least two contains both white and blue morphs.
- Sandhill Crane independently varies gray and naturally rust-stained plumage.
- Willow Ptarmigan is flock-consistent and surface-aware: snow starts use winter plumage; non-snow starts use summer plumage.
- Greater White-fronted Goose, Canada Goose, and Brant use adult/juvenile art. Their sexes are not assigned invented color differences.
- Spruce Grouse retains its documented male/female artwork while varying scale, phase, pose, and treatment independently.

## Atlas budget

Each species is limited to:

- 2 biological variants
- 2 individual treatments per biological variant (`natural`, `alternate`)
- 16 named poses per treatment
- 64 total atlas frames

The alternate treatment is a restrained 2% brightness / 4% saturation change with no hue rotation, so field marks remain intact. Pose preference and animation phase provide most visible variation. `validate:assets` rejects missing biological/treatment/state combinations, dimensions outside the four-sheet budget, or metadata that claims a different budget.

The production bird-atlas PNG payload is approximately 9 MiB. Keyed masters remain build inputs and are not part of the PWA precache.

## Browser fixture

Development-only query parameters can force a reproducible flock for QA:

```text
?seed=individual-snow-goose-morphs
&debugBirdSpecies=snow-goose
&debugBirdSurface=shallowWater
&debugBirdState=resting
&debugFlockSize=6
```

The `data-bird-individual-plans` telemetry on `#aim-layer` exposes the active deterministic roster. It is development-only.
