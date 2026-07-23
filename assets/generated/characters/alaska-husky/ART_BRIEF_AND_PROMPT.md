# Original Alaskan Husky art brief

The field dog is a fictional, original working Alaskan Husky informed by National Park Service descriptions of Denali freight dogs. It uses sturdy athletic proportions, long working legs, a deep chest, strong shoulders, compact snow feet, dense double coat, and a naturally carried bushy tail. The warm agouti charcoal/brown/cream coat avoids a sporting-dog silhouette and a standardized show-ring Siberian mask.

## Production prompt

Create an original vintage 16-bit pixel-art sprite-sheet master of one Alaskan Husky working dog in an exact 4×4 grid on uniform chroma green. Use the same right-facing dog in every cell, with a strong readable silhouette, natural freight/park-working proportions, long legs, deep chest, strong shoulders, large compact paws, wedge head, practical double coat, and a low/trailing bushy tail. Use a restrained agouti charcoal-brown, cream, and muted copper palette. Do not use a collar, harness, show mask, antialiasing, shadows, scenery, labels, or proprietary character traits.

Frames in row order: idle; sniff; search-walk contact A/B; search-trot extension/compression; run extension/gathered; slow cautious approach; alert; look toward hidden bird; turn transition; bound into cover; flush reaction; stop and watch; celebration. Keep all grounded paws on a consistent baseline and leave safe cell margins.

## Processing record

- Generator mode: text-to-image; no image inputs or copied artwork.
- Keyed master: `keyed/alaska-husky-master.png` (1254×1254).
- Processing: split the authored cells, isolate the largest foreground component, remove chroma pixels, nearest-neighbor scale, normalize the paw baseline, quantize the opaque palette, and force binary alpha.
- Processed master: `processed/alaska-husky-atlas.png` (512×512, 16 named 128×128 frames).
- Production output: `public/assets/characters/alaska-husky/{atlas.png,atlas.json,preview.png}`.
- The retrieve/carry pose was intentionally omitted because the current game has no retrieve mechanic.
