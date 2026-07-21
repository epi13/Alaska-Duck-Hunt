# Bird Sprite Generation Record

Generated 2026-07-20 with Codex's built-in image-generation tool from the licensed reference photographs in `assets/references/Alaska_Game_Bird_Reference_Collection`.

The photographs were used only as anatomy, marking, sex, seasonal-plumage, and flight-pose references. The shipped sheets are original pixel-art interpretations; they do not contain copied photo backgrounds or proprietary game artwork. Photo attribution and individual licenses remain in the reference collection's `IMAGE_SOURCES_AND_LICENSES.csv`.

## Shared prompt contract

Each species used the following production prompt, augmented with its identification traits and honest variant labels:

> Create one original animated 16-bit pixel-art sprite sheet informed by the supplied species references. Use exactly four columns by four rows on a square canvas. Every cell contains one complete orthographic side-profile bird facing right on the same body anchor. Columns are wing-up, mid-downstroke, wing-down, and glide. Rows are the four listed sex, age, morph, or seasonal variants. Use hard-edged pixel clusters, a limited Alaska palette, and a perfectly flat `#FF00FF` background. No text, grid lines, scenery, shadows, extra birds, antialiasing, proprietary-game imitation, or watermark.

## Species rows

- Willow Ptarmigan: male summer, female summer, male winter, female winter.
- Spruce Grouse: male, female, male cold-season, female cold-season. Flight poses were inferred because the supplied collection documents that no reusable true-flight photograph was found.
- Mallard: breeding drake, hen, eclipse drake, winter hen.
- Northern Pintail: breeding drake, hen, summer drake, winter drake.
- Common Goldeneye: breeding drake, female, summer male, winter female.
- Harlequin Duck: breeding drake, female, summer female, winter drake.
- Canada Goose: large adult, smaller adult, warm-season adult, cold-season adult; no invented sex markings.
- Snow Goose: white morph, blue morph, smaller white morph, juvenile.
- Brant: dark adult, smaller adult, warm-season adult, cold-season adult; no invented sex markings.
- Sandhill Crane: gray adult, rust-stained adult, smaller adult, winter-gray adult.

The keyed generation sources are in `keyed/`. Production assets in `public/assets/birds/` were padded to a divisible grid, converted to alpha with the image-generation skill's chroma-removal helper, and nearest-neighbor reduced to 512×512. Phaser slices every sheet into sixteen 128×128 frames.
