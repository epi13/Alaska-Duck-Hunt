# Art Pipeline

Asset generation should be deterministic and source-controlled at the recipe level. Palette definitions, pixel primitives, sprite manifests, and atlas metadata are inputs; optimized PNG/WebP atlases and JSON maps are outputs.

Bird sheets share named states: rest, takeoff, wing-up, wing-neutral, wing-down, bank-left, bank-right, climb, dive, hit, fall, escape, distant, and flock. Variant metadata maps sex, age, and seasonal plumage to frames. Habitat generation emits parallax layers, terrain tiles, vegetation, animated water or snow, weather textures, and occluders. UI generation emits reticles, ammunition, buttons, logo treatment, achievements, controller diagrams, guide plates, splash art, and PWA icons.

The first production bird collection uses a compact flight atlas contract: each 512×512 PNG contains four 128×128 flight frames across four documented sex, morph, age, or seasonal rows. `src/data/bird-sprites.ts` is the runtime manifest. The keyed generation sources, prompt record, licensed photo references, and final alpha sheets are source-controlled separately so a production build never becomes the only copy of source material.

The location collection follows the same separation. Twelve original 1280×720 opaque plates live under `public/assets/scenes`; a 512×512 field-retriever sheet provides four rows of animation; and three 1024×512 habitat atlases provide wetland, forest, and arctic occluders. `src/data/scene-art.ts` maps every location to its plate, habitat kit, and normalized mid/foreground placements. Phaser owns only responsive display, animation, and depth ordering. The retained generation sources, keyed masters, prompt record, and reference-license manifests live under `assets/`.

Validation checks dimensions, transparent padding, duplicate hashes, missing states, atlas bounds, nearest-neighbor metadata, file size budgets, and every referenced asset path. Visual review covers silhouette readability at native and TV scale, palette contrast, protected-lookalike differentiation, and phone-safe crops.
