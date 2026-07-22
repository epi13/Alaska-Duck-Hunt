# Regional habitat atlas generation record

Generated: 2026-07-21

Model workflow: OpenAI ImageGen with the corresponding production location plate supplied as a visual style reference. All outputs are original and contain no copied game assets.

Shared production brief:

> Create an original production sprite atlas matching the attached scene's vintage late-1980s 16-bit pixel-art palette. Use a strict 4×4 grid with exactly 16 separate props, one per cell. Rows 1–3 contain 12 plant/rock/wood cutouts. Row 4 contains four low water/shore occlusion pieces. Use a solid `#FF00FF` chroma background, with no text, grid, birds, people, weapons, or overlapping cells.

Regional briefs supplied the representative plant and terrain vocabulary documented in `docs/regional-habitat-art.md` for Southcentral wetland, coastal delta, western tundra, boreal Interior, Southeast rainforest, Arctic/alpine, Aleutian coast, and winter willow.

Keyed sources are retained in `assets/generated/regional-habitat/keyed`. Production images were point-resized to 1024×1024 and processed with the ImageGen skill's `remove_chroma_key.py` helper using a soft magenta matte, despill, and one-pixel edge contraction. Final alpha sheets are in `public/assets/habitat/regions`.
