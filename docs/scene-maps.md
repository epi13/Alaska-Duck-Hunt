# Semantic scene maps

Every 1280×720 production plate in `public/assets/scenes` has a hand-authored normalized map in `src/data/scene-maps.ts`. The game never performs image recognition at runtime. Pure geometry and deterministic sampling live in `src/core/scenes/scene-map.ts`; `src/game/systems/SceneMapSystem.ts` is the Phaser-facing coordinate and debug adapter.

## Format

A `SceneMap` declares its `locationId`, source dimensions, semantic regions, dog patrol paths, no-spawn polygons, and foreground-occlusion polygons. All points use image-normalized coordinates: `(0, 0)` is the source plate’s upper-left and `(1, 1)` is its lower-right.

Regions are polygons or paths. Each region has a stable id and one bird surface (`openWater`, `shallowWater`, `shoreline`, `mudflat`, `marshGrass`, `tallGrass`, `tundraGround`, `snowGround`, `forestFloor`, `rockyCoast`, `riverEdge`, or `lowBranch`). It also declares normalized perspective depth, preferred Phaser display depth, minimum/maximum object scale, optional local anchor height, optional valid bird families/species, and optional occlusion ids. Paths model narrow anchors such as shorelines, river edges, and branches; polygons model areas such as water, mud, grass, and ground.

`sampleScenePoint` selects a compatible region and valid point using only `SeededRandom`. Polygon rejection excludes checked-in no-spawn areas. Path sampling is length-weighted. The result includes the semantic surface, region id, normalized point/depth, preferred display depth, expected scale, anchor height, and occlusion membership. Projection can snap a point to a path or polygon boundary.

## Responsive conversion

Scene plates use cover scaling. `createCoverTransform` applies the same scale and centered crop as the Phaser background, including negative horizontal offsets on tall mobile screens and negative vertical offsets on wide screens. `SceneMapSystem.toWorld` and `fromWorld` are inverse transforms. Sampling is restricted to the currently visible normalized bounds. On resize, surface-bound birds and the dog are converted again from their normalized anchors; airborne motion remains world-space gameplay motion.

## Authoring procedure

1. Open the exact 1280×720 production PNG, not a generated source or screenshot.
2. Trace visible semantic areas clockwise with normalized `(pixelX / 1280, pixelY / 720)` points. Use a path for a narrow waterline, shoreline, river edge, branch, or perch; use a polygon for an area.
3. Keep ground and water geometry inside visibly corresponding pixels. Add explicit no-spawn polygons for sky or ambiguous gaps. Do not use a broad rectangle that includes open sky.
4. Author perspective depth and scale from far to near. Region display depth guides grounded actors; environmental prop depths are derived separately from their authored layer and perspective in `scene-props.ts`.
5. Trace at least one continuous, visibly grounded dog corridor. Curves are represented by short connected segments.
6. Add broad foreground-occlusion areas for map-level queries. Individual environmental props define tighter occlusion geometry in `scene-props.ts`; see [scene-map prop placement](scene-props.md).
7. If a region is biologically or visually restricted, add `birdFamilies` or `species`. Keep this data descriptive; game regulations do not belong in scene maps.
8. Run `npm test` and `npm run validate:assets`. Catalog tests require all twelve maps, valid normalized geometry, unique ids, dog paths, no-spawn areas, and occlusion hooks.
9. Launch `npm run dev` and append `?debugSceneMap=1`. The development overlay draws surface polygons, shoreline/branch paths, dog patrols, depth labels, recent deterministic samples, no-spawn areas, foreground occlusion, and the currently selected region/surface/position. Check desktop, tablet, and mobile aspect ratios.

Stable region ids are browser telemetry contracts. `#aim-layer` exposes `data-scene-region-id`, `data-scene-depth`, `data-scene-world-x`, `data-scene-world-y`, and dog path/world-position fields for Playwright and diagnostics.
