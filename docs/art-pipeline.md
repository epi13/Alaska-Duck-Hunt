# Art Pipeline

Asset generation should be deterministic and source-controlled at the recipe level. Palette definitions, pixel primitives, sprite manifests, and atlas metadata are inputs; optimized PNG/WebP atlases and JSON maps are outputs.

Bird sheets share named states: rest, takeoff, wing-up, wing-neutral, wing-down, bank-left, bank-right, climb, dive, hit, fall, escape, distant, and flock. Variant metadata maps sex, age, and seasonal plumage to frames. Habitat generation emits parallax layers, terrain tiles, vegetation, animated water or snow, weather textures, and occluders. UI generation emits reticles, ammunition, buttons, logo treatment, achievements, controller diagrams, guide plates, splash art, and PWA icons.

Validation checks dimensions, transparent padding, duplicate hashes, missing states, atlas bounds, nearest-neighbor metadata, file size budgets, and every referenced asset path. Visual review covers silhouette readability at native and TV scale, palette contrast, protected-lookalike differentiation, and phone-safe crops.

