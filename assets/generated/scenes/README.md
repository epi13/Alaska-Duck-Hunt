# Generated Alaska Scene Collection

These are original ImageGen production assets created on 2026-07-20 from the licensed/public-domain landscape references in `assets/references/Alaska_Duck_Hunt_Reference_Pack`. The reference pack's README and CSV remain the authority for source-image attribution. No source photograph is shipped as gameplay art, and no Nintendo art, composition, character, or sprite was used.

## Output contract

- `source/*.png`: full-resolution opaque generation outputs for the 12 location plates.
- `public/assets/scenes/*.png`: centered 1280×720 nearest-neighbor production plates.
- `assets/generated/characters/keyed/retriever.png`: keyed 4×4 source sheet.
- `public/assets/characters/retriever.png`: 512×512 alpha sheet, 128×128 frames.
- `assets/generated/habitat/keyed/*.png`: keyed 4×2 source atlases.
- `public/assets/habitat/*.png`: 1024×512 alpha atlases, 256×256 frames.

Chroma-key sources use `#FF00FF`. Alpha outputs were made with the repository image-generation skill's `remove_chroma_key.py` helper using a 48–118 soft matte, one-pixel edge contraction, and spill cleanup.

## Prompt set

All 12 scene prompts shared this production direction: an original Alaska hunting-game environment in crisp, hard-edged late-1980s/early-1990s 16-bit pixel art; 16:9; open upper flight lane; broken midground cover; foreground vegetation and a concealed dog corridor; no birds, dog, hunter, weapon, crosshair, HUD, text, logo, copied composition, or Nintendo imitation.

Location-specific additions were:

- Mat-Su: Chugach peaks, autumn hay flats, slough, ghost-tree snags.
- Cook Inlet: low tide, silver mudflat, branching channels, mountain-wrapped arm.
- Copper River: glacial braidwater, cloud-wrapped snow mountains, ochre sedge and driftwood.
- Yukon–Kuskokwim: extremely low tundra horizon, serpentine channels and shallow ponds.
- Interior: calm boreal river slough, black spruce, golden birch, muskeg roots.
- Arctic: Brooks Range, polygon ponds, braided river, tundra flowers and old snow.
- Aleutian: rolling fog, basalt sea cliffs, surf, black sand and beach grass.
- Southeast: misty fjord, reflective estuary, spruce/hemlock, fireweed and mossy roots.
- Tundra lakes: thaw-lake mosaic, beaded streams, cotton grass, lichen and dwarf birch.
- Alpine: polychrome ridges, tundra saddle, talus, alpine flowers and faint rainbow.
- Willow: deep winter sky, Alaska Range, wind-sculpted snow and bare willow bands.
- River flats: warm migration evening, flooded meadow, distant original field barn and muddy dog trail.

The retriever prompt requested a distinct original black-and-chocolate Alaska field dog in a strict 4×4 right-facing sheet: run, sniff/search, bound, and retrieve/celebrate rows. The three habitat prompts requested strict 4×2 atlases for wetland/delta, forest/alpine, and arctic/winter occluders.
