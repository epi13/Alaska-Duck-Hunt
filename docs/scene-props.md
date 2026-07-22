# Scene-map prop placement

`src/data/scene-props.ts` is the authoritative environmental-prop layout for all twelve locations. It replaces the shared coordinate arrays formerly stored in `SceneArt`. Every placement is stable authored data tied to one region from `src/data/scene-maps.ts`; props are never randomly relocated on load.

Pure types, validation, occlusion geometry, and actor-depth resolution live in `src/core/scenes/scene-props.ts`. `src/game/systems/ScenePropSystem.ts` is the Phaser presentation adapter. `HuntScene` creates the background, scene-map adapter, and prop system, but does not own prop placement or depth rules.

## Placement format

Each `ScenePropPlacement` contains:

- A unique, location-prefixed `id`, regional `atlas`, and frame number from 0–15.
- A semantic prop `type`, such as reed, sedge, aquatic plant, grass, shrub, willow, conifer, rock, log, branch, shoreline edge, snow plant, or snow rock.
- A normalized source-image `anchor` and exact `surfaceRegionId` from that location’s semantic scene map.
- A `layer`: `background-detail`, `midground`, `gameplay-cover`, or `foreground`.
- Normalized `perspectiveDepth`, `baseScale`, sprite `origin`, and optional restrained rotation, flip, or vertical aspect scale.
- Normalized occlusion bounds or polygon plus `occlusionStrength`.
- A wind profile (`none`, `light`, `moderate`, or `strong`). Wind changes rotation only; it never moves the authored anchor.
- Allowed bird relationships (`behind`, `beside`, or `on`) and a dog pass rule (`behind`, `front`, `both`, or `blocked`).

The regional atlas frames use row-major numbering. Frames 0–11 contain plant, shrub, rock, moss, wood, or snow cutouts; frames 12–15 contain low water/shore edges. The semantic `type` is explicit because frame imagery differs between regional atlases.

## Validation and authoring

1. Inspect the production 1280×720 plate and its semantic map together.
2. Pick the exact mapped region that can support the prop. Reeds belong to marsh, shallow-water edge, river edge, or wet grass; rocks belong to mapped shore or exposed ground; wood belongs to forest floor, shore, river edge, rocky ground, or a mapped branch; snow props require snow ground.
3. Set the anchor in normalized plate coordinates. Polygon anchors must be inside the region. Narrow path anchors must be on the mapped path within a small tracing tolerance.
4. Choose perspective depth and scale based on the source image. Keep target corridors open and use small occlusion bounds around only the opaque portion of the sprite.
5. Use `gameplay-cover` for partial reeds, grass, edges, rocks, and logs that can sit between an actor and the camera. Opaque cover at or above the targetability threshold prevents a fully hidden bird from remaining targetable; partial cover retains the bird’s actual state hitbox and combines environmental occlusion with the state’s own occlusion value.
6. Use `foreground` sparingly near the lower edge. HUD and menus are accessible DOM layers above the Phaser canvas, so scene props cannot cover them.
7. Run `npm test`, `npm run validate:assets`, and `npm run test:e2e`. Validation rejects missing regions, incompatible prop/surface pairs, out-of-region anchors, invalid frames, excessive rotation, malformed occlusion geometry, duplicate ids, and incomplete location coverage.

## Depth and resize behavior

Depth ranges are derived from layer plus perspective: background details 12–22, midground 36–49, gameplay cover 50–66, and foreground 70–84. This leaves distant birds above background details, grounded actors among midground/gameplay cover, and effects above foreground props. Surface-bound birds and the dog compare their normalized point with nearby prop occlusion geometry. Actors above a prop anchor pass behind it; actors below it may pass in front when the placement allows both. Airborne birds retain their flight depth.

`ScenePropSystem.resize()` converts every unchanged normalized anchor through the same cover transform used by the scene plate and semantic map. Scale follows that transform, so props remain connected to their mapped surface under desktop, tablet, and mobile crops.

Append `?debugSceneMap=1` during development. The overlay adds cyan prop anchors and bounds, placement id, layer, display depth, occlusion polygons, actor/prop depth relationships, and red diagnostics for invalid placements to the existing surface/path display.
